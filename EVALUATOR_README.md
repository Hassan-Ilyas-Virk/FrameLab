# Tekken Input Evaluator

A comprehensive 60FPS input testing and evaluation system for Tekken moves with frame-perfect timing analysis.

## Features

- ⚡ **60FPS Frame Analysis** - 16.67ms per frame precision
- 🎯 **3-Frame Buffer** - Default buffer window for input sequences
- 🔥 **Just-Frame Windows** - 1-frame perfect execution detection
- 🔄 **Auto-Reset** - 500ms inactivity timeout
- 📊 **Detailed JSON Output** - moveDetected, success, timingOffset, bufferUsed, executionFrame, reason, replayInputs
- 🧪 **Test Cases** - Positive, negative, edge, and noisy scenarios
- 💡 **Failure Tips** - One-line advice for failed attempts

## Supported Moves

| Move | Input | Max Frames | Description |
|------|-------|------------|-------------|
| **EWGF** | f, n, d, df, 2 | 13f | Electric Wind God Fist |
| **Perfect EWGF** | f, n, d, df, 2 | 11f | Perfect Electric (Just-Frame) |
| **Wavedash** | f, n, d, df | 15f | Korean Backdash Cancel |
| **Hellsweep** | f, n, d, df, 4 | 16f | Mishima Low Sweep |
| **KBD** | b, b, db, b | 12f | Korean Backdash |
| **Run** | f, f, f | 20f | Forward Run |
| **Command Throw** | f, 1+2 | 10f | Forward Throw |
| **Backdash** | b, b | 15f | Back Dash |
| **Sidestep Left** | u | 5f | Step into background |
| **Sidestep Right** | d | 5f | Step into foreground |

## Usage

### Option 1: Node.js CLI

Run the test suite from the command line:

```bash
node src/runInputTests.js
```

This will:
- Run all test cases (positive, negative, edge, noisy)
- Display colored terminal output with results
- Show interactive demos
- Print move definitions

### Option 2: Browser Demo

Open the HTML demo in a browser:

```bash
# From project root
open public/evaluator-demo.html
```

Features:
- Visual test results with color coding
- Filter by test category
- JSON output display
- Real-time statistics

### Option 3: Programmatic Usage

```javascript
const { TekkenInputEvaluator } = require('./TekkenInputEvaluator');

const evaluator = new TekkenInputEvaluator();

// Add inputs with timestamps
evaluator.addInput('f', 0);
evaluator.addInput('n', 33.34);   // 2 frames later
evaluator.addInput('d', 66.68);   // 2 frames later
evaluator.addInput('df', 100.02); // 2 frames later
const result = evaluator.addInput('2', 133.36); // 2 frames later

console.log(JSON.stringify(result, null, 2));
```

### Option 4: Sequence Input

```javascript
const evaluator = new TekkenInputEvaluator();

// Add sequence with frame gaps
const inputs = ['f', 'n', 'd', 'df', '2'];
const frameGaps = [2, 2, 2, 2, 2]; // Frames between each input

const results = evaluator.addSequence(inputs, frameGaps);
console.log(results);
```

## JSON Output Format

```json
{
  "moveDetected": "EWGF",
  "moveKey": "ewgf",
  "success": true,
  "perfect": true,
  "timingOffset": -2,
  "bufferUsed": 2,
  "executionFrame": 11,
  "targetFrame": 13,
  "reason": "Perfect execution!",
  "tip": "⚡ Perfect!",
  "replayInputs": [
    { "input": "f", "frame": 0 },
    { "input": "n", "frame": 2 },
    { "input": "d", "frame": 4 },
    { "input": "df", "frame": 6 },
    { "input": "2", "frame": 8 }
  ]
}
```

### Output Fields

- **moveDetected**: Name of the detected move
- **moveKey**: Internal move identifier
- **success**: Whether execution was within frame window
- **perfect**: Whether execution was just-frame perfect
- **timingOffset**: Frames early (negative) or late (positive) from target
- **bufferUsed**: Average frames between inputs
- **executionFrame**: Total frames from first to last input
- **targetFrame**: Maximum allowed frames for success
- **reason**: Human-readable explanation
- **tip**: Coaching advice for failed attempts
- **replayInputs**: Frame-by-frame input sequence

## Test Categories

### 1. Positive Tests ✅
Tests that should succeed with good execution:
- Perfect timing EWGFs
- Clean wavedashes
- Tight KBDs

### 2. Negative Tests ❌
Tests that should fail:
- Too slow inputs
- Wrong input sequences
- Incomplete patterns

### 3. Edge Cases 🎯
Boundary condition tests:
- Frame-perfect (exactly on limit)
- Just over limit
- Maximum speed inputs
- Inactivity timeout

### 4. Noisy Tests 🔊
Real-world scenarios with extra inputs:
- Multiple neutrals
- Button mashing
- Duplicate directions

## Example Output

```
🎮 TEKKEN INPUT EVALUATOR TEST REPORT
================================================================================

Summary:
  Total Tests: 15
  ✓ Passed: 13
  ✗ Failed: 2
  Success Rate: 86.7%

POSITIVE TESTS (5/5)
--------------------------------------------------------------------------------

✓ EWGF - Perfect Timing (13f)
  Inputs: f → n → d → df → 2
  Frame Gaps: [2, 2, 2, 2, 2]

  Result:
    Move: EWGF ⚡
    Success: ✓ true
    Execution: 11f / 13f
    Timing Offset: -2f
    Buffer Usage: 2f avg
    Reason: Perfect execution!

✗ EWGF - Too Slow (20f)
  Inputs: f → n → d → df → 2
  Frame Gaps: [5, 5, 5, 5, 5]

  Result:
    Move: EWGF
    Success: ✗ false
    Execution: 25f / 13f
    Timing Offset: +12f
    Buffer Usage: 5f avg
    Reason: Too slow by 12 frames
    💡 Tip: Speed up your inputs - aim for 13f or less
```

## Tips for Perfect Execution

### EWGF/Perfect EWGF
- Keep inputs tight (2-3 frames between each)
- Don't hesitate on the final button press
- Perfect EWGF requires 11f or less

### Wavedash
- Smooth, flowing motion
- Don't pause on neutral
- Aim for 3-4 frames per input

### KBD
- Quick double-tap back
- db should be instant
- Final back completes the dash

### General Tips
- Practice with a rhythm
- Use the frame data as feedback
- Buffer windows help but tighter is better
- Watch for inactivity timeouts

## Development

### Adding New Moves

Edit `TekkenInputEvaluator.js`:

```javascript
MOVE_DEFINITIONS.your_move = {
  name: 'Your Move Name',
  input: ['f', 'n', 'd', 'df', '1'],
  maxFrames: 14,
  justFrame: false, // Set true for just-frame moves
  description: 'Move description'
};
```

### Adding Test Cases

Edit test generators in `TestCaseGenerator` class:

```javascript
static generateCustomTests() {
  return [
    {
      name: 'My Test',
      inputs: ['f', 'n', 'd', 'df'],
      frameGaps: [2, 2, 2, 2],
      expectedMove: 'wavedash',
      expectedSuccess: true
    }
  ];
}
```

## Technical Details

- **Frame Rate**: 60 FPS (16.67ms per frame)
- **Buffer Window**: 3 frames (~50ms)
- **Just-Frame**: 1 frame (~16.67ms)
- **Inactivity Reset**: 500ms
- **Input Cleaning**: Filters quick neutrals, splits combos
- **Evaluation**: Sequential pattern matching with timing analysis

## License

MIT License - Feel free to use and modify!

---

**Made with ⚡ for frame-perfect execution practice**

