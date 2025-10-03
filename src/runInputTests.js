/**
 * Test Runner for Tekken Input Evaluator
 * Run this with: node src/runInputTests.js
 */

const { TekkenInputEvaluator, TestCaseGenerator, MOVE_DEFINITIONS } = require('./TekkenInputEvaluator');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

/**
 * Format and print test results
 */
function printTestReport(report) {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}${colors.cyan}🎮 TEKKEN INPUT EVALUATOR TEST REPORT${colors.reset}`);
  console.log('='.repeat(80) + '\n');
  
  // Summary
  console.log(`${colors.bright}Summary:${colors.reset}`);
  console.log(`  Total Tests: ${report.summary.total}`);
  console.log(`  ${colors.green}✓ Passed: ${report.summary.passed}${colors.reset}`);
  console.log(`  ${colors.red}✗ Failed: ${report.summary.failed}${colors.reset}`);
  console.log(`  Success Rate: ${((report.summary.passed / report.summary.total) * 100).toFixed(1)}%\n`);
  
  // Category results
  for (const [category, categoryData] of Object.entries(report.categories)) {
    console.log(`${colors.bright}${colors.magenta}${category.toUpperCase()} TESTS${colors.reset} (${categoryData.passed}/${categoryData.tests.length})`);
    console.log('-'.repeat(80));
    
    for (const test of categoryData.tests) {
      const icon = test.passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
      console.log(`\n${icon} ${colors.bright}${test.testName}${colors.reset}`);
      
      // Test details
      console.log(`  Inputs: ${test.testCase.inputs.join(' → ')}`);
      console.log(`  Frame Gaps: [${test.testCase.frameGaps.join(', ')}]`);
      
      if (test.results) {
        for (const result of test.results) {
          const successIcon = result.success ? '✓' : '✗';
          const perfectIcon = result.perfect ? '⚡' : '';
          
          console.log(`\n  ${colors.bright}Result:${colors.reset}`);
          console.log(`    Move: ${result.moveDetected} ${perfectIcon}`);
          console.log(`    Success: ${successIcon} ${result.success ? colors.green : colors.red}${result.success}${colors.reset}`);
          console.log(`    Execution: ${result.executionFrame}f / ${result.targetFrame}f`);
          console.log(`    Timing Offset: ${result.timingOffset > 0 ? '+' : ''}${result.timingOffset}f`);
          console.log(`    Buffer Usage: ${result.bufferUsed}f avg`);
          console.log(`    Reason: ${result.reason}`);
          if (result.tip && result.tip !== '⚡ Perfect!') {
            console.log(`    ${colors.yellow}💡 Tip: ${result.tip}${colors.reset}`);
          }
        }
      } else {
        console.log(`  ${colors.yellow}No move detected${colors.reset}`);
      }
      
      if (test.testCase.note) {
        console.log(`  ${colors.cyan}Note: ${test.testCase.note}${colors.reset}`);
      }
    }
    
    console.log('\n');
  }
  
  console.log('='.repeat(80) + '\n');
}

/**
 * Print JSON output for a single evaluation
 */
function printEvaluationJSON(result) {
  console.log('\n' + colors.bright + 'JSON Output:' + colors.reset);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Run interactive demo
 */
function runInteractiveDemo() {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}${colors.cyan}🎮 INTERACTIVE DEMO${colors.reset}`);
  console.log('='.repeat(80) + '\n');
  
  const evaluator = new TekkenInputEvaluator();
  
  // Demo 1: Perfect EWGF
  console.log(`${colors.bright}Demo 1: Perfect EWGF${colors.reset}`);
  evaluator.reset();
  let timestamp = 0;
  const ewgfInputs = ['f', 'n', 'd', 'df', '2'];
  const ewgfGaps = [2, 2, 2, 2, 2];
  
  for (let i = 0; i < ewgfInputs.length; i++) {
    const result = evaluator.addInput(ewgfInputs[i], timestamp);
    if (result) {
      printEvaluationJSON(result[0]);
    }
    timestamp += ewgfGaps[i] * 16.67;
  }
  
  // Demo 2: Slow Wavedash (should fail)
  console.log(`\n${colors.bright}Demo 2: Slow Wavedash${colors.reset}`);
  evaluator.reset();
  timestamp = 0;
  const wavedashInputs = ['f', 'n', 'd', 'df'];
  const wavedashGaps = [5, 5, 5, 5]; // Too slow
  
  for (let i = 0; i < wavedashInputs.length; i++) {
    const result = evaluator.addInput(wavedashInputs[i], timestamp);
    if (result) {
      printEvaluationJSON(result[0]);
    }
    timestamp += wavedashGaps[i] * 16.67;
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Main execution
 */
function main() {
  console.log(`${colors.bright}${colors.blue}Starting Tekken Input Evaluation Tests...${colors.reset}\n`);
  
  // Run all tests
  const report = TestCaseGenerator.runAllTests();
  printTestReport(report);
  
  // Run interactive demo
  runInteractiveDemo();
  
  // Print move definitions
  console.log(`${colors.bright}${colors.cyan}📋 MOVE DEFINITIONS${colors.reset}`);
  console.log('='.repeat(80));
  for (const [key, move] of Object.entries(MOVE_DEFINITIONS)) {
    console.log(`\n${colors.bright}${move.name}${colors.reset} (${key})`);
    console.log(`  Inputs: ${move.input.join(' → ')}`);
    console.log(`  Max Frames: ${move.maxFrames}f`);
    console.log(`  Just Frame: ${move.justFrame ? 'Yes' : 'No'}`);
    console.log(`  Description: ${move.description}`);
  }
  console.log('\n' + '='.repeat(80) + '\n');
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { printTestReport, printEvaluationJSON, runInteractiveDemo };

