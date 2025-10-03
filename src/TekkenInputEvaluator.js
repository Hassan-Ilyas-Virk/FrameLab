/**
 * Tekken Input Evaluator - 60FPS Input Testing System
 * Evaluates input sequences with frame-perfect timing analysis
 */

const FRAME_TIME = 16.67; // 60FPS
const DEFAULT_BUFFER = 3; // 3-frame buffer
const JUST_FRAME_WINDOW = 1; // 1-frame for perfect execution
const INACTIVITY_TIMEOUT = 500; // 500ms auto-reset

const MOVE_DEFINITIONS = {
  ewgf: {
    name: 'EWGF',
    input: ['f', 'n', 'd', 'df', '2'],
    maxFrames: 13,
    description: 'Electric Wind God Fist'
  },
  pewgf: {
    name: 'Perfect EWGF',
    input: ['f', 'n', 'd', 'df', '2'],
    maxFrames: 11,
    justFrame: true,
    description: 'Perfect Electric (11f or less)'
  },
  wavedash: {
    name: 'Wavedash',
    input: ['f', 'n', 'd', 'df'],
    maxFrames: 15,
    description: 'Korean Backdash Cancel'
  },
  hellsweep: {
    name: 'Hellsweep',
    input: ['f', 'n', 'd', 'df', '4'],
    maxFrames: 16,
    description: 'Mishima Low Sweep'
  },
  kbd: {
    name: 'KBD',
    input: ['b', 'b', 'db', 'b'],
    maxFrames: 12,
    description: 'Korean Backdash'
  },
  run: {
    name: 'Run',
    input: ['f', 'f', 'f'],
    maxFrames: 20,
    description: 'Forward Run'
  },
  throw: {
    name: 'Command Throw',
    input: ['f', '1+2'],
    maxFrames: 10,
    description: 'Forward Throw'
  },
  backdash: {
    name: 'Backdash',
    input: ['b', 'b'],
    maxFrames: 15,
    description: 'Back Dash'
  },
  sidestep_left: {
    name: 'Sidestep Left',
    input: ['u'],
    maxFrames: 5,
    description: 'Step into background'
  },
  sidestep_right: {
    name: 'Sidestep Right',
    input: ['d'],
    maxFrames: 5,
    description: 'Step into foreground'
  }
};

class TekkenInputEvaluator {
  constructor() {
    this.inputBuffer = [];
    this.lastInputTime = null;
    this.moveStartTime = null;
  }

  /**
   * Add input with timestamp (in milliseconds)
   */
  addInput(input, timestamp) {
    // Check for inactivity timeout
    if (this.lastInputTime && timestamp - this.lastInputTime > INACTIVITY_TIMEOUT) {
      this.reset();
    }

    if (this.inputBuffer.length === 0) {
      this.moveStartTime = timestamp;
    }

    this.inputBuffer.push({ input, timestamp });
    this.lastInputTime = timestamp;

    return this.evaluateBuffer(timestamp);
  }

  /**
   * Clean buffer (handle combos, filter quick neutrals)
   */
  cleanBuffer() {
    const cleaned = [];
    
    for (let i = 0; i < this.inputBuffer.length; i++) {
      const current = this.inputBuffer[i].input;
      
      // Split combo inputs (e.g., "1+2" -> "1", "2")
      if (current.includes('+')) {
        const parts = current.split('+');
        for (const part of parts) {
          cleaned.push(part);
        }
        continue;
      }
      
      // Filter quick neutrals between same directions
      if (current === 'n') {
        const prev = cleaned[cleaned.length - 1];
        const next = this.inputBuffer[i + 1]?.input;
        
        if (prev && next && prev === next && ['f', 'b', 'u', 'd'].includes(prev)) {
          continue; // Skip neutral
        }
      }
      
      cleaned.push(current);
    }
    
    return cleaned;
  }

  /**
   * Evaluate current buffer for move detection
   */
  evaluateBuffer(currentTime) {
    const cleanedInputs = this.cleanBuffer();
    const results = [];

    // Check each move definition
    for (const [moveKey, moveDef] of Object.entries(MOVE_DEFINITIONS)) {
      const result = this.checkMove(moveKey, moveDef, cleanedInputs, currentTime);
      if (result) {
        results.push(result);
      }
    }

    return results.length > 0 ? results : null;
  }

  /**
   * Check if buffer matches a specific move
   */
  checkMove(moveKey, moveDef, cleanedInputs, currentTime) {
    const required = moveDef.input;
    
    if (cleanedInputs.length < required.length) {
      return null; // Not enough inputs
    }

    // Check if recent inputs match
    const recent = cleanedInputs.slice(-required.length);
    const matches = recent.every((inp, idx) => inp === required[idx]);

    if (!matches) {
      return null;
    }

    // Calculate execution time and frames
    const executionTime = currentTime - this.moveStartTime;
    const executionFrames = Math.round(executionTime / FRAME_TIME);
    
    // Calculate timing offset from perfect
    const perfectFrames = moveDef.justFrame ? moveDef.maxFrames : moveDef.maxFrames;
    const timingOffset = executionFrames - perfectFrames;
    
    // Determine success
    const success = executionFrames <= moveDef.maxFrames;
    const isPerfect = moveDef.justFrame ? 
      (executionFrames <= moveDef.maxFrames && executionFrames >= moveDef.maxFrames - JUST_FRAME_WINDOW) :
      (executionFrames <= moveDef.maxFrames);

    // Calculate buffer usage (frames between inputs)
    const bufferUsed = this.calculateBufferUsage();

    // Determine reason for failure
    let reason = '';
    let tip = '';
    
    if (!success) {
      if (executionFrames > moveDef.maxFrames) {
        reason = `Too slow by ${executionFrames - moveDef.maxFrames} frames`;
        tip = `Speed up your inputs - aim for ${moveDef.maxFrames}f or less`;
      }
    } else if (moveDef.justFrame && !isPerfect) {
      reason = `Not perfect - need ${moveDef.maxFrames}f or less`;
      tip = `You were ${timingOffset}f late - tighten your timing!`;
    } else {
      reason = isPerfect ? 'Perfect execution!' : 'Successful execution';
    }

    return {
      moveDetected: moveDef.name,
      moveKey: moveKey,
      success: success,
      perfect: isPerfect,
      timingOffset: timingOffset,
      bufferUsed: bufferUsed,
      executionFrame: executionFrames,
      targetFrame: moveDef.maxFrames,
      reason: reason,
      tip: !success || !isPerfect ? tip : '⚡ Perfect!',
      replayInputs: this.inputBuffer.map(i => ({
        input: i.input,
        frame: Math.round((i.timestamp - this.moveStartTime) / FRAME_TIME)
      }))
    };
  }

  /**
   * Calculate average buffer usage (frames between inputs)
   */
  calculateBufferUsage() {
    if (this.inputBuffer.length < 2) return 0;

    const gaps = [];
    for (let i = 1; i < this.inputBuffer.length; i++) {
      const gap = this.inputBuffer[i].timestamp - this.inputBuffer[i - 1].timestamp;
      gaps.push(Math.round(gap / FRAME_TIME));
    }

    return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
  }

  /**
   * Reset evaluator state
   */
  reset() {
    this.inputBuffer = [];
    this.lastInputTime = null;
    this.moveStartTime = null;
  }

  /**
   * Add input sequence with frame-based timing
   */
  addSequence(inputs, frameGaps) {
    let timestamp = 0;
    const results = [];

    for (let i = 0; i < inputs.length; i++) {
      const result = this.addInput(inputs[i], timestamp);
      if (result) {
        results.push(...result);
      }
      
      if (i < inputs.length - 1) {
        timestamp += (frameGaps[i] || 1) * FRAME_TIME;
      }
    }

    return results.length > 0 ? results : null;
  }
}

/**
 * Test Case Generator
 */
class TestCaseGenerator {
  /**
   * Generate all test cases
   */
  static generateAllTests() {
    return {
      positive: this.generatePositiveTests(),
      negative: this.generateNegativeTests(),
      edge: this.generateEdgeTests(),
      noisy: this.generateNoisyTests()
    };
  }

  /**
   * Positive test cases (should succeed)
   */
  static generatePositiveTests() {
    return [
      {
        name: 'EWGF - Perfect Timing (13f)',
        inputs: ['f', 'n', 'd', 'df', '2'],
        frameGaps: [2, 2, 2, 2, 2], // ~10-12 frames total
        expectedMove: 'ewgf',
        expectedSuccess: true
      },
      {
        name: 'Perfect EWGF (11f)',
        inputs: ['f', 'n', 'd', 'df', '2'],
        frameGaps: [2, 2, 2, 2, 1], // ~9-11 frames total
        expectedMove: 'pewgf',
        expectedSuccess: true
      },
      {
        name: 'Wavedash - Clean',
        inputs: ['f', 'n', 'd', 'df'],
        frameGaps: [3, 3, 3, 3], // ~12 frames
        expectedMove: 'wavedash',
        expectedSuccess: true
      },
      {
        name: 'KBD - Tight',
        inputs: ['b', 'b', 'db', 'b'],
        frameGaps: [2, 2, 2, 2],
        expectedMove: 'kbd',
        expectedSuccess: true
      },
      {
        name: 'Hellsweep - Good',
        inputs: ['f', 'n', 'd', 'df', '4'],
        frameGaps: [3, 2, 2, 3, 2],
        expectedMove: 'hellsweep',
        expectedSuccess: true
      }
    ];
  }

  /**
   * Negative test cases (should fail)
   */
  static generateNegativeTests() {
    return [
      {
        name: 'EWGF - Too Slow (20f)',
        inputs: ['f', 'n', 'd', 'df', '2'],
        frameGaps: [5, 5, 5, 5, 5], // ~25 frames
        expectedMove: 'ewgf',
        expectedSuccess: false
      },
      {
        name: 'EWGF - Wrong Input',
        inputs: ['f', 'n', 'd', 'd', '2'], // Missing df
        frameGaps: [2, 2, 2, 2, 2],
        expectedMove: null,
        expectedSuccess: false
      },
      {
        name: 'Wavedash - Incomplete',
        inputs: ['f', 'n', 'd'], // Missing df
        frameGaps: [3, 3, 3],
        expectedMove: null,
        expectedSuccess: false
      },
      {
        name: 'KBD - Out of Order',
        inputs: ['b', 'db', 'b', 'b'], // Wrong order
        frameGaps: [2, 2, 2, 2],
        expectedMove: null,
        expectedSuccess: false
      }
    ];
  }

  /**
   * Edge case tests
   */
  static generateEdgeTests() {
    return [
      {
        name: 'EWGF - Frame Perfect (13f exactly)',
        inputs: ['f', 'n', 'd', 'df', '2'],
        frameGaps: [2, 2, 2, 2, 3], // Exactly 13f
        expectedMove: 'ewgf',
        expectedSuccess: true
      },
      {
        name: 'EWGF - Just Over Limit (14f)',
        inputs: ['f', 'n', 'd', 'df', '2'],
        frameGaps: [3, 3, 3, 3, 3], // ~15f
        expectedMove: 'ewgf',
        expectedSuccess: false
      },
      {
        name: 'Perfect EWGF - Boundary (11f)',
        inputs: ['f', 'n', 'd', 'df', '2'],
        frameGaps: [2, 2, 2, 2, 2], // ~10-11f
        expectedMove: 'pewgf',
        expectedSuccess: true
      },
      {
        name: 'Wavedash - Max Speed',
        inputs: ['f', 'n', 'd', 'df'],
        frameGaps: [1, 1, 1, 1], // Fastest possible
        expectedMove: 'wavedash',
        expectedSuccess: true
      },
      {
        name: 'Inactivity Timeout',
        inputs: ['f', 'n', 'd', 'df', '2'],
        frameGaps: [2, 2, 2, 35, 2], // 35 frames = 583ms > 500ms
        expectedMove: null,
        expectedSuccess: false
      }
    ];
  }

  /**
   * Noisy test cases (with extra inputs)
   */
  static generateNoisyTests() {
    return [
      {
        name: 'EWGF - With Quick Neutral',
        inputs: ['f', 'n', 'n', 'd', 'df', '2'], // Extra neutral
        frameGaps: [2, 1, 1, 2, 2, 2],
        expectedMove: 'ewgf',
        expectedSuccess: true,
        note: 'Quick neutrals should be filtered'
      },
      {
        name: 'Wavedash - Multiple Neutrals',
        inputs: ['f', 'f', 'n', 'n', 'd', 'df'], // Double f and n
        frameGaps: [1, 2, 1, 1, 2, 2],
        expectedMove: 'wavedash',
        expectedSuccess: true,
        note: 'Duplicate inputs filtered'
      },
      {
        name: 'KBD - Button Mash',
        inputs: ['b', 'b', 'db', 'b', '1'], // Extra button
        frameGaps: [2, 2, 2, 2, 1],
        expectedMove: null,
        expectedSuccess: false,
        note: 'Extra inputs should break pattern'
      }
    ];
  }

  /**
   * Run a single test case
   */
  static runTest(testCase) {
    const evaluator = new TekkenInputEvaluator();
    const results = evaluator.addSequence(testCase.inputs, testCase.frameGaps);
    
    return {
      testName: testCase.name,
      testCase: testCase,
      results: results,
      passed: this.validateResults(results, testCase)
    };
  }

  /**
   * Validate test results
   */
  static validateResults(results, testCase) {
    if (!results && !testCase.expectedSuccess) {
      return true; // Expected to fail
    }
    
    if (!results && testCase.expectedSuccess) {
      return false; // Should have succeeded
    }

    if (results) {
      const matchingResult = results.find(r => r.moveKey === testCase.expectedMove);
      if (matchingResult) {
        return matchingResult.success === testCase.expectedSuccess;
      }
    }

    return false;
  }

  /**
   * Run all tests and generate report
   */
  static runAllTests() {
    const allTests = this.generateAllTests();
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: 0,
        passed: 0,
        failed: 0
      },
      categories: {}
    };

    for (const [category, tests] of Object.entries(allTests)) {
      const categoryResults = tests.map(test => this.runTest(test));
      
      report.categories[category] = {
        tests: categoryResults,
        passed: categoryResults.filter(r => r.passed).length,
        failed: categoryResults.filter(r => !r.passed).length
      };

      report.summary.total += tests.length;
      report.summary.passed += categoryResults.filter(r => r.passed).length;
      report.summary.failed += categoryResults.filter(r => !r.passed).length;
    }

    return report;
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TekkenInputEvaluator, TestCaseGenerator, MOVE_DEFINITIONS };
}

// Browser export
if (typeof window !== 'undefined') {
  window.TekkenInputEvaluator = TekkenInputEvaluator;
  window.TestCaseGenerator = TestCaseGenerator;
  window.MOVE_DEFINITIONS = MOVE_DEFINITIONS;
}

