#!/usr/bin/env node

/**
 * Analyze the bundle size and show what's taking up space
 */

import { readFileSync, statSync } from 'fs';
import { join } from 'path';

const bundlePath = 'dist/cli.cjs';
const nodePath = process.execPath;
const exePath = 'bin/ksef-pdf-generator.exe';

console.log('========================================');
console.log('Bundle Size Analysis');
console.log('========================================\n');

function formatBytes(bytes) {
  const mb = (bytes / 1048576).toFixed(2);
  return `${mb} MB (${bytes.toLocaleString()} bytes)`;
}

function getSize(path) {
  try {
    return statSync(path).size;
  } catch (e) {
    return null;
  }
}

// Analyze bundle
const bundleSize = getSize(bundlePath);
if (bundleSize) {
  console.log(`Bundled code (${bundlePath}):`);
  console.log(`  ${formatBytes(bundleSize)}\n`);
  
  // Try to estimate what's in the bundle
  const content = readFileSync(bundlePath, 'utf-8');
  
  // Rough estimates based on string occurrences
  const deps = [
    { name: 'pdfmake', pattern: /pdfmake|pdfkit/gi },
    { name: 'jsdom', pattern: /jsdom|whatwg/gi },
    { name: 'xml-js', pattern: /xml-js/gi },
  ];
  
  console.log('Estimated dependency presence (by string occurrences):');
  for (const dep of deps) {
    const matches = content.match(dep.pattern);
    console.log(`  ${dep.name}: ~${matches ? matches.length : 0} references`);
  }
  console.log();
} else {
  console.log(`❌ Bundle not found at ${bundlePath}`);
  console.log('   Run: npm run bundle\n');
}

// Analyze Node.js runtime
const nodeSize = getSize(nodePath);
if (nodeSize) {
  console.log(`Node.js runtime (${nodePath}):`);
  console.log(`  ${formatBytes(nodeSize)}\n`);
}

// Analyze final executable
const exeSize = getSize(exePath);
if (exeSize) {
  console.log(`Final executable (${exePath}):`);
  console.log(`  ${formatBytes(exeSize)}`);
  
  if (bundleSize && nodeSize) {
    const overhead = exeSize - nodeSize - bundleSize;
    console.log(`\nSize breakdown:`);
    console.log(`  Node.js runtime:  ${formatBytes(nodeSize)} (${((nodeSize/exeSize)*100).toFixed(1)}%)`);
    console.log(`  Bundled code:     ${formatBytes(bundleSize)} (${((bundleSize/exeSize)*100).toFixed(1)}%)`);
    console.log(`  Overhead:         ${formatBytes(overhead)} (${((overhead/exeSize)*100).toFixed(1)}%)`);
  }
  console.log();
} else {
  console.log(`❌ Executable not found at ${exePath}`);
  console.log('   Run: scripts/build-standalone-win.bat\n');
}

// Recommendations
console.log('========================================');
console.log('Optimization Recommendations');
console.log('========================================\n');

console.log('1. UPX Compression (RECOMMENDED)');
console.log('   - Can reduce size by 50-70% (e.g., 90MB → 30-40MB)');
console.log('   - Install: winget install upx.upx');
console.log('   - Run: scripts/compress-exe.bat\n');

console.log('2. Bundle Optimization (DONE)');
console.log('   - Using --minify and --tree-shaking');
console.log('   - Saves ~5-15 MB\n');

console.log('3. Alternative Runtimes (NOT RECOMMENDED)');
console.log('   - Bun: Doesn\'t support SEA yet');
console.log('   - Deno: Would require significant refactoring');
console.log('   - LLRT: Incompatible with jsdom/pdfmake\n');

console.log('4. Dependency Alternatives (ADVANCED)');
console.log('   - Replace jsdom with lighter HTML parser');
console.log('   - Replace pdfmake with lighter PDF library');
console.log('   - Would require code refactoring\n');

console.log('========================================');
console.log('Expected Final Sizes');
console.log('========================================\n');

if (exeSize) {
  const withUPX = Math.round(exeSize * 0.35);
  console.log(`Current size:         ${formatBytes(exeSize)}`);
  console.log(`With UPX compression: ${formatBytes(withUPX)}`);
  console.log(`Potential savings:    ${formatBytes(exeSize - withUPX)}\n`);
}

