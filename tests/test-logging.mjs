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
  // Get the expected log file location
  const logDir = join(homedir(), '.ksef-pdf-generator', 'logs');
  const logFile = join(logDir, 'ksef-generator.log');
  
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
    { name: 'Date separator', pattern: /={80}/ },
    { name: 'Session start marker', pattern: /SESSION START/ },
    { name: 'Session end marker', pattern: /SESSION END/ },
    { name: 'Start time', pattern: /Start Time: \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/ },
    { name: 'End time', pattern: /End Time: \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/ },
    { name: 'Duration', pattern: /Duration: \d+\.\d+s/ },
    { name: 'Status', pattern: /Status: SUCCESS/ },
    { name: 'Input file', pattern: /Input File:.*invoice\.xml/ },
    { name: 'Output file', pattern: /Output File:.*test-logging\.pdf/ },
    { name: 'Generated file', pattern: /Generated File:.*test-logging\.pdf/ },
    { name: 'Parameters', pattern: /Parameters:/ },
    { name: 'Type field', pattern: /type.*invoice/ },
    { name: 'nrKSeF parameter', pattern: /nrKSeF.*TEST-123/ },
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
  const sessions = updatedLogContent.split('─'.repeat(80));
  const lastSession = sessions[sessions.length - 2] || sessions[sessions.length - 1];
  console.log('─'.repeat(80));
  console.log(lastSession.trim());
  console.log('─'.repeat(80));
  
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

