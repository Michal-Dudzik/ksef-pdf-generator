/* sync-notion.js
 * Sync upstream GitHub issues (open + closed within last N days) into a Notion database.
 * Upserts by "Upstream ID" (Number).
 * Only writes: Upstream ID, Name, Date added, Updates, Link.
 * Does NOT overwrite: Status, Priority, Did I do it in my fork?
 */

const { Client } = require("@notionhq/client");

const UPSTREAM_REPO = process.env.UPSTREAM_REPO; // "owner/repo"
const CLOSED_DAYS = parseInt(process.env.CLOSED_DAYS || "14", 10);
const GH_TOKEN = process.env.GH_TOKEN; // can be undefined, but recommended
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Notion property names (must match exactly)
const PROP_UPSTREAM_ID = "Upstream ID";
const PROP_NAME = "Name";
const PROP_DATE_ADDED = "Date added";
const PROP_UPDATES = "Updates";
const PROP_LINK = "Link";

// Updates Select options (must exist in Notion)
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
    "Accept": "application/vnd.github+json",
    "User-Agent": "notion-issue-sync",
  };
  if (GH_TOKEN) h["Authorization"] = `Bearer ${GH_TOKEN}`;
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

async function listIssues({ state, since /* ISO string or null */ }) {
  // GitHub endpoint includes PRs, so we filter out items with "pull_request"
  const perPage = 100;
  let page = 1;
  const out = [];

  while (page <= 10) { // safety cap; raise if repo is huge
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

function parseIso(s) {
  return s ? new Date(s) : null;
}

function withinLastNDays(isoTimestamp, days) {
  const dt = parseIso(isoTimestamp);
  if (!dt) return false;
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return dt >= cutoff;
}

function computeUpdatesSelect(issue) {
  // Proxy for "new comments":
  // "Yes" if comments exist AND issue updated recently (within CLOSED_DAYS window)
  const comments = issue.comments || 0;
  const updatedRecently = withinLastNDays(issue.updated_at, CLOSED_DAYS);
  return (comments > 0 && updatedRecently) ? UPDATES_YES : UPDATES_NO;
}

async function findNotionPageIdByUpstreamId(upstreamId) {
  const resp = await notion.databases.query({
    database_id: NOTION_DATABASE_ID,
    filter: {
      property: PROP_UPSTREAM_ID,
      number: { equals: upstreamId },
    },
    page_size: 1,
  });

  if (resp.results && resp.results.length > 0) {
    return resp.results[0].id;
  }
  return null;
}

function buildNotionProps(issue) {
  const upstreamId = issue.number;
  const name = issue.title || `(no title)`;
  const link = issue.html_url;
  const createdAt = issue.created_at; // ISO
  const updates = computeUpdatesSelect(issue);

  // Only set the properties you said should be automated
  return {
    [PROP_UPSTREAM_ID]: { number: upstreamId },
    [PROP_NAME]: { title: [{ text: { content: name } }] },   // "Name" must be the Title property
    [PROP_DATE_ADDED]: { date: { start: createdAt } },       // Date property
    [PROP_UPDATES]: { select: { name: updates } },           // Select Yes/No must exist
    [PROP_LINK]: { url: link },                               // URL property
  };
}

async function upsertIssue(issue) {
  const upstreamId = issue.number;
  const existingId = await findNotionPageIdByUpstreamId(upstreamId);
  const props = buildNotionProps(issue);

  if (existingId) {
    await notion.pages.update({
      page_id: existingId,
      properties: props,
    });
    return "updated";
  } else {
    await notion.pages.create({
      parent: { database_id: NOTION_DATABASE_ID },
      properties: props,
    });
    return "created";
  }
}

async function main() {
  const since = isoDaysAgo(CLOSED_DAYS);

  // 1) Open issues (all)
  const openIssues = await listIssues({ state: "open", since: null });

  // 2) Closed issues: fetch issues updated since, then filter to those actually closed within window
  const closedRecentlyTouched = await listIssues({ state: "closed", since });
  const closedRecent = closedRecentlyTouched.filter((it) =>
    it.closed_at && withinLastNDays(it.closed_at, CLOSED_DAYS)
  );

  const toSync = [...openIssues, ...closedRecent];

  let created = 0, updated = 0;

  for (const issue of toSync) {
    const result = await upsertIssue(issue);
    if (result === "created") created += 1;
    else updated += 1;
  }

  console.log(
    `Synced ${toSync.length} issues: open=${openIssues.length}, closed_recent=${closedRecent.length}, created=${created}, updated=${updated}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
