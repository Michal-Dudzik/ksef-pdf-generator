/* sync-notion.js
 * Sync upstream GitHub issues (open + closed within last N days) into a Notion database.
 *
 * Upsert key: (repo + issue number) — stored in Number property "ID" + (optional) repo.
 * Writes ONLY: ID, Name, Date added, Date updated, Updates, Link.
 * Does NOT overwrite: Status, Priority, Did I do it in my fork.
 *
 * Also: if duplicates exist (multiple Notion pages with same ID), keeps the first and archives the rest.
 */

import { Client } from "@notionhq/client";

const UPSTREAM_REPO = process.env.UPSTREAM_REPO; // "owner/repo"
const CLOSED_DAYS = parseInt(process.env.CLOSED_DAYS || "14", 10);
const GH_TOKEN = process.env.GH_TOKEN;
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

// === Notion property names (MUST match exactly) ===
const PROP_ID = "ID";                 // Number (issue number)
const PROP_NAME = "Name";             // Title
const PROP_DATE_ADDED = "Date added"; // Date
const PROP_DATE_UPDATED = "Date updated"; // Date
const PROP_UPDATES = "Updates";       // Select: Yes/No
const PROP_LINK = "Link";             // URL

const UPDATES_YES = "Yes";
const UPDATES_NO = "No";

if (!UPSTREAM_REPO || !NOTION_TOKEN || !NOTION_DATABASE_ID) {
  console.error("Missing required env vars: UPSTREAM_REPO, NOTION_TOKEN, NOTION_DATABASE_ID");
  process.exit(1);
}

const notion = new Client({ auth: NOTION_TOKEN });

function isoDaysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function ghHeaders() {
  const h = {
    Accept: "application/vnd.github+json",
    "User-Agent": "notion-issue-sync",
  };
  if (GH_TOKEN) h.Authorization = `Bearer ${GH_TOKEN}`;
  return h;
}

async function ghFetch(url) {
  const res = await fetch(url, { headers: ghHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function listIssues({ state, since }) {
  const perPage = 100;
  let page = 1;
  const out = [];

  while (page <= 20) { // a bit higher safety cap
    const params = new URLSearchParams({
      state,
      per_page: String(perPage),
      page: String(page),
    });
    if (since) params.set("since", since);

    const url = `https://api.github.com/repos/${UPSTREAM_REPO}/issues?${params.toString()}`;
    const batch = await ghFetch(url);

    if (!Array.isArray(batch) || batch.length === 0) break;

    for (const item of batch) {
      if (item.pull_request) continue; // skip PRs
      out.push(item);
    }

    if (batch.length < perPage) break;
    page += 1;
  }

  return out;
}

function withinLastNDays(isoTimestamp, days) {
  if (!isoTimestamp) return false;
  const dt = new Date(isoTimestamp);
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return dt >= cutoff;
}

function computeUpdatesSelect(issue) {
  // Still a proxy: "Yes" if issue has comments and was updated recently.
  const comments = issue.comments || 0;
  const updatedRecently = withinLastNDays(issue.updated_at, CLOSED_DAYS);
  return comments > 0 && updatedRecently ? UPDATES_YES : UPDATES_NO;
}

/**
 * Query Notion for pages with ID == issueNumber.
 * Returns array of page objects (could be multiple if duplicates already exist).
 */
async function findNotionPagesById(issueNumber) {
  const resp = await notion.databases.query({
    database_id: NOTION_DATABASE_ID,
    filter: {
      property: PROP_ID,
      number: { equals: issueNumber },
    },
    page_size: 100,
  });

  return resp.results || [];
}

async function archivePage(pageId) {
  await notion.pages.update({
    page_id: pageId,
    archived: true,
  });
}

function buildNotionProps(issue) {
  const id = issue.number;                 // <-- GitHub issue number
  const name = issue.title || "(no title)";
  const link = issue.html_url;
  const createdAt = issue.created_at;      // ISO
  const updatedAt = issue.updated_at;      // ISO
  const updates = computeUpdatesSelect(issue);

  return {
    [PROP_ID]: { number: id },
    [PROP_NAME]: { title: [{ text: { content: name } }] },
    [PROP_DATE_ADDED]: { date: { start: createdAt } },
    [PROP_DATE_UPDATED]: { date: { start: updatedAt } },
    [PROP_UPDATES]: { select: { name: updates } },
    [PROP_LINK]: { url: link },
  };
}

async function upsertIssue(issue) {
  const id = issue.number;
  const props = buildNotionProps(issue);

  const pages = await findNotionPagesById(id);

  if (pages.length === 0) {
    await notion.pages.create({
      parent: { database_id: NOTION_DATABASE_ID },
      properties: props,
    });
    return { action: "created", deduped: 0 };
  }

  // If duplicates exist, keep the first and archive the rest.
  const keep = pages[0];
  const duplicates = pages.slice(1);

  await notion.pages.update({
    page_id: keep.id,
    properties: props,
  });

  for (const dup of duplicates) {
    await archivePage(dup.id);
  }

  return { action: "updated", deduped: duplicates.length };
}

async function main() {
  const since = isoDaysAgo(CLOSED_DAYS);

  const openIssues = await listIssues({ state: "open", since: null });

  const closedRecentlyTouched = await listIssues({ state: "closed", since });
  const closedRecent = closedRecentlyTouched.filter(
    (it) => it.closed_at && withinLastNDays(it.closed_at, CLOSED_DAYS)
  );

  // De-dup within a single run by issue number (open + closedRecent could overlap in edge cases)
  const map = new Map();
  for (const it of [...openIssues, ...closedRecent]) {
    map.set(it.number, it);
  }
  const toSync = [...map.values()];

  let created = 0, updated = 0, archived = 0;

  for (const issue of toSync) {
    const res = await upsertIssue(issue);
    if (res.action === "created") created += 1;
    else updated += 1;
    archived += res.deduped;
  }

  console.log(
    `Synced ${toSync.length} issues: created=${created}, updated=${updated}, archived_duplicates=${archived}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
