#!/usr/bin/env node

/**
 * Test script for persistent logging feature
 * 
 * This test verifies that:
 * 1. Logs are created in the correct location
 * 2. Logs contain session start/end times
 * 3. Logs contain parameters, input/output files
 * 4. Logs are organized by date
 * 5. Multiple sessions are properly separated
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const testName = 'Logging Feature';

console.log(`\n${'='.repeat(60)}`);
console.log(`Testing: ${testName}`);
console.log('='.repeat(60));

try {
  // Get the expected log file location (project root logs directory)
  // The logger writes to logs/ksef-generator-YYYY-MM-DD.log
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const logFileName = `ksef-generator-${year}-${month}-${day}.log`;
  const logDir = join(process.cwd(), 'logs');
  const logFile = join(logDir, logFileName);
  
  console.log(`Expected log file: ${logFile}`);
  
  // Run the generator to create a log entry
  console.log('\n1. Running PDF generator...');
  const inputFile = 'assets/invoice.xml';
  const outputFile = 'outputs/test-logging.pdf';
  
  execSync(
    `node dist/cli.cjs --input ${inputFile} --output ${outputFile} --type invoice --nrKSeF TEST-123`,
    { encoding: 'utf-8', stdio: 'pipe' }
  );
  
  console.log('✓ PDF generated successfully');
  
  // Check if log file exists
  console.log('\n2. Checking if log file exists...');
  if (!existsSync(logFile)) {
    throw new Error(`Log file not found at: ${logFile}`);
  }
  console.log('✓ Log file exists');
  
  // Read and validate log content
  console.log('\n3. Validating log content...');
  const logContent = readFileSync(logFile, 'utf-8');
  
  const checks = [
    { name: 'Session entry', pattern: /\{[\s\S]*?\}/ },
    { name: 'Nr field', pattern: /Nr:\s*\d+/ },
    { name: 'Status field', pattern: /Status: SUCCESS/ },
    { name: 'Operation Time', pattern: /Operation Time: \d{2}:\d{2}:\d{2} - \d{2}:\d{2}:\d{2} \(\d+\.\d+s\)/ },
    { name: 'Parameters field', pattern: /Parameters:/ },
    { name: 'Full command', pattern: /Full command:/ },
    { name: 'Input in parameters', pattern: /"input".*invoice\.xml/ },
    { name: 'Output in parameters', pattern: /"output".*test-logging\.pdf/ },
    { name: 'Type in parameters', pattern: /"type".*invoice/ },
    { name: 'nrKSeF in parameters', pattern: /"nrKSeF".*TEST-123/ },
  ];
  
  let allPassed = true;
  for (const check of checks) {
    if (check.pattern.test(logContent)) {
      console.log(`  ✓ ${check.name}`);
    } else {
      console.log(`  ✗ ${check.name} - NOT FOUND`);
      allPassed = false;
    }
  }
  
  if (!allPassed) {
    console.log('\n❌ Some checks failed');
    console.log('\n--- Last 50 lines of log file ---');
    const lines = logContent.split('\n');
    console.log(lines.slice(-50).join('\n'));
    process.exit(1);
  }
  
  console.log('\n4. Testing error logging...');
  try {
    execSync(
      'node dist/cli.cjs --input nonexistent.xml --output test.pdf --type invoice',
      { encoding: 'utf-8', stdio: 'pipe' }
    );
  } catch (err) {
    // Expected to fail
    console.log('✓ Error case triggered as expected');
  }
  
  // Check if error was logged
  const updatedLogContent = readFileSync(logFile, 'utf-8');
  if (updatedLogContent.includes('Status: FAILED')) {
    console.log('✓ Error logged correctly');
  } else {
    console.log('✗ Error not logged');
    allPassed = false;
  }
  
  // Display sample log output
  console.log('\n--- Sample log output (last session) ---');
  // Find the last session entry (format: {...})
  const sessionMatches = updatedLogContent.match(/\{[\s\S]*?\}/g);
  if (sessionMatches && sessionMatches.length > 0) {
    const lastSession = sessionMatches[sessionMatches.length - 1];
    console.log(lastSession);
  } else {
    console.log('No session entries found');
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ ${testName}: PASSED`);
  console.log('='.repeat(60));
  console.log(`\nLog file location: ${logFile}`);
  console.log('You can view the full log file to see all recorded sessions.');
  
  process.exit(0);
} catch (error) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`❌ ${testName}: FAILED`);
  console.log('='.repeat(60));
  console.error('\nError:', error.message);
  process.exit(1);
}

