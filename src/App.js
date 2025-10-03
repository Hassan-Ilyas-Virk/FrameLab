import React, { useState, useEffect, useRef } from 'react';
import { Settings, Play, RotateCcw } from 'lucide-react';

const TekkenInputTrainer = () => {
  const [inputHistory, setInputHistory] = useState([]);
  const [detectedMove, setDetectedMove] = useState(null);
  const [lastPerfect, setLastPerfect] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestTimes, setBestTimes] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [detectionMode, setDetectionMode] = useState('auto'); // 'auto' or specific move key
  const [keyBinds, setKeyBinds] = useState({
    up: 'w',
    down: 's',
    left: 'a',
    right: 'd',
    btn1: 'u',
    btn2: 'i',
    btn3: 'j',
    btn4: 'k'
  });
  const [editingKey, setEditingKey] = useState(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [flashSuccess, setFlashSuccess] = useState(false);
  
  const sessionStartTime = useRef(Date.now());
  const lastInputTime = useRef(Date.now());
  const pressedDirections = useRef(new Set());
  const pressedButtons = useRef(new Set());
  const lastState = useRef({ direction: null, buttons: [] });
  const inputBuffer = useRef([]);
  const moveStartTime = useRef(null);
  const directionDebounceTimer = useRef(null);

  const moves = {
    ewgf: {
      name: 'EWGF',
      input: ['f', 'n', 'd', 'df', '2'],
      maxFrames: 13,
      color: 'yellow'
    },
    wavedash: {
      name: 'Wavedash',
      input: ['f', 'n', 'd', 'df'],
      maxFrames: 15,
      color: 'blue'
    },
    hellsweep: {
      name: 'Hellsweep',
      input: ['f', 'n', 'd', 'df', '4'],
      maxFrames: 16,
      color: 'red'
    },
    kbd: {
      name: 'KBD',
      input: ['b', 'b', 'db', 'b'],
      maxFrames: 12,
      color: 'purple'
    },
    pewgf: {
      name: 'Perfect EWGF',
      input: ['f', 'n', 'd', 'df', '2'],
      maxFrames: 11,
      color: 'green'
    },
    dragon_uppercut: {
      name: 'Dragon Uppercut',
      input: ['f', 'n', 'd', 'df', '1'],
      maxFrames: 14,
      color: 'orange'
    },
    spinning_demon: {
      name: 'Spinning Demon',
      input: ['f', 'n', 'd', 'df', '3'],
      maxFrames: 15,
      color: 'pink'
    },
    double_wavedash: {
      name: 'Double Wavedash',
      input: ['f', 'n', 'd', 'df', 'f', 'n', 'd', 'df'],
      maxFrames: 25,
      color: 'cyan'
    }
  };

  const notationMap = {
    'f': '→', 'b': '←', 'u': '↑', 'd': '↓',
    'df': '↘', 'db': '↙', 'uf': '↗', 'ub': '↖',
    'n': 'N', '1': '①', '2': '②', '3': '③', '4': '④',
    'd+2': '↓+②', 'df+2': '↘+②', 'd+1': '↓+①', 'df+1': '↘+①',
    'f+2': '→+②', 'b+2': '←+②', 'u+2': '↑+②',
    'd+3': '↓+③', 'df+3': '↘+③', 'd+4': '↓+④', 'df+4': '↘+④',
    'f+3': '→+③', 'b+3': '←+③', 'u+3': '↑+③',
    'f+4': '→+④', 'b+4': '←+④', 'u+4': '↑+④',
    'f+1': '→+①', 'b+1': '←+①', 'u+1': '↑+①',
    'uf+2': '↗+②', 'ub+2': '↖+②', 'db+2': '↙+②'
  };

  const getCurrentDirection = () => {
    const hasUp = pressedDirections.current.has(keyBinds.up);
    const hasDown = pressedDirections.current.has(keyBinds.down);
    const hasLeft = pressedDirections.current.has(keyBinds.left);
    const hasRight = pressedDirections.current.has(keyBinds.right);
    
    if (hasUp && hasRight) return 'uf';
    if (hasUp && hasLeft) return 'ub';
    if (hasDown && hasRight) return 'df';
    if (hasDown && hasLeft) return 'db';
    if (hasUp) return 'u';
    if (hasDown) return 'd';
    if (hasLeft) return 'b';
    if (hasRight) return 'f';
    
    return null;
  };

  const checkMoves = (now, input) => {
    const buffer = inputBuffer.current;
    
    // Clean buffer for move detection (remove quick neutrals, split combos)
    const cleanedBuffer = [];
    for (let i = 0; i < buffer.length; i++) {
      const current = buffer[i];
      
      if (current.includes('+')) {
        const parts = current.split('+');
        cleanedBuffer.push(parts[0]);
        cleanedBuffer.push(parts[1]);
        continue;
      }
      
      if (current === 'n') {
        const prev = cleanedBuffer[cleanedBuffer.length - 1];
        const next = buffer[i + 1];
        
        if (next && next.includes('+')) {
          const nextDir = next.split('+')[0];
          if (prev === nextDir) continue;
        } else if (prev && next && prev === next && ['f', 'b', 'u', 'd'].includes(prev)) {
          continue;
        }
      }
      
      cleanedBuffer.push(current);
    }

    console.log('🔍 checkMoves called:', {
      mode: detectionMode,
      buffer,
      cleanedBuffer,
      currentProgress
    });

    // ========== SPECIFIC MODE: ONLY CHECK SELECTED MOVE ==========
    if (detectionMode !== 'auto') {
      const targetMove = moves[detectionMode];
      const required = targetMove.input;
      
      console.log('📋 Target move:', targetMove.name, 'Required:', required);
      
      // Sequential matching: count consecutive matches from the start
      let matchCount = 0;
      for (let i = 0; i < cleanedBuffer.length && i < required.length; i++) {
        if (cleanedBuffer[i] === required[i]) {
          matchCount++;
        } else {
          // Mismatch found - break streak immediately
          console.log('❌ Mismatch at position', i, '- got', cleanedBuffer[i], 'expected', required[i]);
          setStreak(0);
          setCurrentProgress(0);
          inputBuffer.current = [];
          moveStartTime.current = null;
          return;
        }
      }
      
      console.log('✅ Match count:', matchCount, 'out of', required.length);
      
      // Update progress with consecutive matches
      setCurrentProgress(matchCount);
      
      // If buffer is longer than required, it's wrong
      if (cleanedBuffer.length > required.length) {
        setStreak(0);
        setCurrentProgress(0);
        inputBuffer.current = [];
        moveStartTime.current = null;
        return;
      }
      
      // ONLY detect if buffer exactly matches required length
      if (cleanedBuffer.length === required.length) {
        const matches = cleanedBuffer.every((inp, idx) => inp === required[idx]);
        
        if (matches) {
          const executionTime = now - moveStartTime.current;
          const frames = Math.round(executionTime / 16.67);
          
          const isPerfect = frames <= targetMove.maxFrames;
          
          setDetectedMove({ ...targetMove, frames, isPerfect });
          setLastPerfect(isPerfect);
          
          // Flash success animation
          if (isPerfect) {
            setFlashSuccess(true);
            setTimeout(() => setFlashSuccess(false), 500);
          }
          
          if (isPerfect) {
            setStreak(prev => prev + 1);
            setBestTimes(prev => ({
              ...prev,
              [detectionMode]: !bestTimes[detectionMode] || frames < bestTimes[detectionMode] ? frames : bestTimes[detectionMode]
            }));
          } else {
            setStreak(prev => prev + 1);
          }
          
          // Clear buffer and reset timer
          inputBuffer.current = [];
          moveStartTime.current = null;
          setCurrentProgress(0);
          
          setTimeout(() => {
            setLastPerfect(false);
            setDetectedMove(null);
          }, 2000);
        }
      }
      
      // Exit early - never check other moves in specific mode
      return;
    }
    
    // Auto mode: check all moves with sliding window
    const movesToCheck = Object.entries(moves);

    for (const [moveKey, move] of movesToCheck) {
      const required = move.input;
      
      if (cleanedBuffer.length < required.length) continue;

      const recent = cleanedBuffer.slice(-required.length);
      const matches = recent.every((inp, idx) => inp === required[idx]);
      
      if (matches) {
        const executionTime = now - moveStartTime.current;
        const frames = Math.round(executionTime / 16.67);
        
        const isPerfect = frames <= move.maxFrames;
        
        setDetectedMove({ ...move, frames, isPerfect });
        setLastPerfect(isPerfect);
        
        if (isPerfect) {
          setStreak(prev => prev + 1);
          setBestTimes(prev => ({
            ...prev,
            [moveKey]: !bestTimes[moveKey] || frames < bestTimes[moveKey] ? frames : bestTimes[moveKey]
          }));
        } else {
          setStreak(prev => prev + 1);
        }
        
        // Clear buffer and reset timer
        inputBuffer.current = [];
        moveStartTime.current = null;
        setCurrentProgress(0);
        
        setTimeout(() => {
          setLastPerfect(false);
          setDetectedMove(null);
        }, 2000);
        
        break;
      }
    }
  };

  const addInputToHistory = (input, now) => {
    console.log('📥 addInputToHistory called:', input, 'at', now);
    
    // Add to history with timestamp
    setInputHistory(prev => {
      const newHistory = [...prev, { input, time: now }];
      return newHistory.slice(-15);
    });
    
    // Add to buffer for move detection
    if (inputBuffer.current.length === 0) {
      moveStartTime.current = now;
    }
    
    inputBuffer.current.push(input);
    console.log('📦 Buffer now:', inputBuffer.current);
    checkMoves(now, input);
  };

  const processCurrentState = (now, isButtonPress = false) => {
    // Clear any pending debounce timer
    if (directionDebounceTimer.current) {
      clearTimeout(directionDebounceTimer.current);
      directionDebounceTimer.current = null;
    }
    
    // For button presses, process immediately
    if (isButtonPress) {
      const currentDirection = getCurrentDirection();
      const currentButtons = Array.from(pressedButtons.current).sort();
      
      lastInputTime.current = now;
      
      // Handle direction + buttons combination
      if (currentDirection && currentButtons.length > 0) {
        const combo = `${currentDirection}+${currentButtons[0]}`;
        addInputToHistory(combo, now);
        lastState.current = { direction: currentDirection, buttons: currentButtons };
        return;
      }
      // Handle buttons only
      else if (currentButtons.length > 0) {
        addInputToHistory(currentButtons[0], now);
        lastState.current = { direction: currentDirection, buttons: currentButtons };
        return;
      }
    }
    
    // For directional inputs, add a small debounce to stabilize diagonal inputs
    directionDebounceTimer.current = setTimeout(() => {
    const currentDirection = getCurrentDirection();
    const currentButtons = Array.from(pressedButtons.current).sort();
    
    const directionChanged = currentDirection !== lastState.current.direction;
    const buttonsChanged = JSON.stringify(currentButtons) !== JSON.stringify(lastState.current.buttons);
    
    if (!directionChanged && !buttonsChanged) return;
    
      lastInputTime.current = Date.now();
    
    let inputToAdd = null;
    
    // Handle direction + buttons combination
    if (currentDirection && currentButtons.length > 0) {
      const combo = `${currentDirection}+${currentButtons[0]}`;
      inputToAdd = combo;
    }
    // Handle direction only
    else if (currentDirection) {
      inputToAdd = currentDirection;
    }
    // Handle neutral
    else if (!currentDirection && currentButtons.length === 0 && lastState.current.direction !== null) {
      inputToAdd = 'n';
    }
    
    if (inputToAdd) {
        addInputToHistory(inputToAdd, Date.now());
    }
    
    lastState.current = { direction: currentDirection, buttons: currentButtons };
    }, 16); // 16ms debounce (about 1 frame)
  };

  // 0.5-second timeout to break streak and clear buffer on inactivity
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastInput = now - lastInputTime.current;
      
      // If 0.5 seconds have passed since last input, clear buffer and break streak
      if (timeSinceLastInput > 500) {
        if (streak > 0) {
          setStreak(0);
        }
        if (inputBuffer.current.length > 0) {
          inputBuffer.current = [];
          moveStartTime.current = null;
          setCurrentProgress(0);
        }
      }
    }, 100); // Check every 100ms
    
    return () => clearInterval(interval);
  }, [streak]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (editingKey) {
        e.preventDefault();
        const key = e.key.toLowerCase();
        if (key !== 'escape') {
          setKeyBinds(prev => ({ ...prev, [editingKey]: key }));
        }
        setEditingKey(null);
        return;
      }

      const key = e.key.toLowerCase();
      const now = Date.now();
      const timeSinceLastInput = now - lastInputTime.current;
      
      console.log('⌨️ Key pressed:', key, 'Mode:', detectionMode);
      
      if (timeSinceLastInput > 800) {
        inputBuffer.current = [];
        moveStartTime.current = null;
      }

      let wasPressed = false;
      let isButton = false;

      const directionalKeys = [keyBinds.up, keyBinds.down, keyBinds.left, keyBinds.right];
      if (directionalKeys.includes(key)) {
        console.log('🎮 Directional key detected:', key);
        e.preventDefault();
        if (!pressedDirections.current.has(key)) {
          pressedDirections.current.add(key);
          wasPressed = true;
        }
      }
      else if (key === keyBinds.btn1) {
        e.preventDefault();
        if (!pressedButtons.current.has('1')) {
          pressedButtons.current.add('1');
          wasPressed = true;
          isButton = true;
        }
      }
      else if (key === keyBinds.btn2) {
        e.preventDefault();
        if (!pressedButtons.current.has('2')) {
          pressedButtons.current.add('2');
          wasPressed = true;
          isButton = true;
        }
      }
      else if (key === keyBinds.btn3) {
        e.preventDefault();
        if (!pressedButtons.current.has('3')) {
          pressedButtons.current.add('3');
          wasPressed = true;
          isButton = true;
        }
      }
      else if (key === keyBinds.btn4) {
        e.preventDefault();
        if (!pressedButtons.current.has('4')) {
          pressedButtons.current.add('4');
          wasPressed = true;
          isButton = true;
        }
      }

      if (wasPressed) {
        processCurrentState(now, isButton);
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      const now = Date.now();
      
      let wasReleased = false;
      
      const directionalKeys = [keyBinds.up, keyBinds.down, keyBinds.left, keyBinds.right];
      if (directionalKeys.includes(key)) {
        e.preventDefault();
        if (pressedDirections.current.has(key)) {
          pressedDirections.current.delete(key);
          wasReleased = true;
        }
      }
      else if (key === keyBinds.btn1 && pressedButtons.current.has('1')) {
        e.preventDefault();
        pressedButtons.current.delete('1');
        wasReleased = true;
      }
      else if (key === keyBinds.btn2 && pressedButtons.current.has('2')) {
        e.preventDefault();
        pressedButtons.current.delete('2');
        wasReleased = true;
      }
      else if (key === keyBinds.btn3 && pressedButtons.current.has('3')) {
        e.preventDefault();
        pressedButtons.current.delete('3');
        wasReleased = true;
      }
      else if (key === keyBinds.btn4 && pressedButtons.current.has('4')) {
        e.preventDefault();
        pressedButtons.current.delete('4');
        wasReleased = true;
      }

      if (wasReleased) {
        processCurrentState(now);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (directionDebounceTimer.current) {
        clearTimeout(directionDebounceTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyBinds, editingKey]);

  const resetSession = () => {
    setInputHistory([]);
    setStreak(0);
    setBestTimes({});
    setDetectedMove(null);
    setLastPerfect(false);
    setCurrentProgress(0);
    setFlashSuccess(false);
    inputBuffer.current = [];
    moveStartTime.current = null;
    sessionStartTime.current = Date.now();
    pressedDirections.current.clear();
    pressedButtons.current.clear();
    lastState.current = { direction: null, buttons: [] };
    if (directionDebounceTimer.current) {
      clearTimeout(directionDebounceTimer.current);
      directionDebounceTimer.current = null;
    }
  };

  const startRebind = (keyName) => {
    setEditingKey(keyName);
  };

  // Reset progress when switching detection modes
  useEffect(() => {
    setCurrentProgress(0);
    setDetectedMove(null);
    setLastPerfect(false);
    setFlashSuccess(false);
    inputBuffer.current = [];
    moveStartTime.current = null;
    if (directionDebounceTimer.current) {
      clearTimeout(directionDebounceTimer.current);
      directionDebounceTimer.current = null;
    }
  }, [detectionMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto flex gap-4">
        {/* Left Sidebar - Input History */}
        <div className="w-80 bg-slate-800 rounded-lg border-2 border-cyan-500 p-4 flex flex-col h-screen sticky top-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Input History</h2>
            <button
              onClick={resetSession}
              className="bg-red-600 hover:bg-red-700 p-2 rounded transition"
              title="Reset Session"
            >
              <RotateCcw className="text-white" size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-auto space-y-2 bg-black rounded-lg p-3 flex flex-col">
            {inputHistory.length === 0 ? (
              <div className="text-gray-500 text-center text-sm py-8">
                No inputs yet...
              </div>
            ) : (
              [...inputHistory].reverse().map((item, idx) => {
                const actualIndex = inputHistory.length - idx;
                // Calculate frames since previous input
                const prevItem = inputHistory[inputHistory.length - idx - 2];
                const timeSincePrev = prevItem ? item.time - prevItem.time : 0;
                const frames = timeSincePrev > 2000 ? 0 : Math.round(timeSincePrev / 16.67);
                
                return (
                  <div
                    key={actualIndex}
                    className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      {item.input === 'n' ? (
                        <span className="w-8 h-8 border-2 border-gray-600 rounded"></span>
                      ) : (
                      <span className={`text-2xl ${item.input.includes('+') ? 'text-orange-400' : 'text-purple-400'}`}>
                        {notationMap[item.input] || item.input}
                      </span>
                      )}
                    </div>
                    <span className="text-green-400 text-xs font-mono">{frames}f</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-yellow-400">TEKKEN INPUT TRAINER</h1>
              <p className="text-gray-300 text-sm">Frame-perfect execution practice</p>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-slate-700 hover:bg-slate-600 p-3 rounded-lg transition"
            >
              <Settings className="text-white" size={24} />
            </button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="bg-slate-800 border-2 border-purple-500 rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">Settings</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h3 className="text-yellow-400 font-semibold">Directional</h3>
                  {['up', 'down', 'left', 'right'].map(key => (
                    <button
                      key={key}
                      onClick={() => startRebind(key)}
                      className={`w-full p-2 rounded text-sm ${
                        editingKey === key 
                          ? 'bg-yellow-500 text-black animate-pulse' 
                          : 'bg-slate-700 text-white hover:bg-slate-600'
                      }`}
                    >
                      {key.toUpperCase()}: {editingKey === key ? 'Press...' : keyBinds[key].toUpperCase()}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  <h3 className="text-yellow-400 font-semibold">Buttons</h3>
                  {['btn1', 'btn2', 'btn3', 'btn4'].map(key => (
                    <button
                      key={key}
                      onClick={() => startRebind(key)}
                      className={`w-full p-2 rounded text-sm ${
                        editingKey === key 
                          ? 'bg-yellow-500 text-black animate-pulse' 
                          : 'bg-slate-700 text-white hover:bg-slate-600'
                      }`}
                    >
                      {key.toUpperCase()}: {editingKey === key ? 'Press...' : keyBinds[key].toUpperCase()}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  <h3 className="text-yellow-400 font-semibold">Actions</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="w-full p-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Detection Mode Selection */}
          <div className="bg-slate-800 rounded-lg p-6 mb-6 border-2 border-blue-500">
            <h2 className="text-xl font-bold text-white mb-4">Detection Mode</h2>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setDetectionMode('auto')}
                className={`p-3 rounded-lg font-semibold transition ${
                  detectionMode === 'auto'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                Auto Detect All
              </button>
              {Object.keys(moves).map(moveKey => (
                <button
                  key={moveKey}
                  onClick={() => setDetectionMode(moveKey)}
                  className={`p-3 rounded-lg font-semibold text-sm transition ${
                    detectionMode === moveKey
                      ? 'bg-yellow-500 text-black'
                      : 'bg-slate-700 text-white hover:bg-slate-600'
                  }`}
                >
                  {moves[moveKey].name}
                </button>
              ))}
            </div>
          </div>

          {/* Perfect Indicator Box */}
          <div className="bg-slate-800 rounded-lg p-8 mb-6 border-2 border-pink-500 min-h-48 flex items-center justify-center">
            {lastPerfect ? (
              <div className="text-center">
                <div className="text-9xl mb-4 animate-bounce">⚡</div>
                <div className="text-4xl font-bold text-yellow-400">PERFECT!</div>
                <div className="text-2xl text-white mt-2">{detectedMove?.name}</div>
                <div className="text-xl text-green-400 mt-2">{detectedMove?.frames} frames</div>
              </div>
            ) : detectedMove ? (
              <div className="text-center">
                <div className="text-7xl mb-4">✓</div>
                <div className="text-3xl font-bold text-blue-400">SUCCESS</div>
                <div className="text-xl text-white mt-2">{detectedMove?.name}</div>
                <div className="text-lg text-yellow-400 mt-2">{detectedMove?.frames} frames</div>
              </div>
            ) : detectionMode !== 'auto' ? (
              <div className="text-center">
                <div className="text-2xl text-gray-400 mb-6">{moves[detectionMode].name}</div>
                <div className="text-sm text-gray-500 mb-2">
                  Progress: {currentProgress}/{moves[detectionMode].input.length} | Flash: {flashSuccess ? 'Yes' : 'No'}
                </div>
                <div className="flex items-center justify-center gap-4">
                  {moves[detectionMode].input.map((inp, idx) => (
                    <span
                      key={idx}
                      className={`text-7xl font-bold transition-all duration-300 ${
                        flashSuccess
                          ? 'text-yellow-400 scale-125'
                          : idx < currentProgress
                          ? 'text-white scale-110'
                          : 'text-gray-600'
                      }`}
                      style={{
                        textShadow: flashSuccess
                          ? '0 0 30px rgba(250, 204, 21, 0.9), 0 0 60px rgba(250, 204, 21, 0.6), 0 0 90px rgba(250, 204, 21, 0.4)'
                          : idx < currentProgress
                          ? '0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 255, 255, 0.5)'
                          : 'none'
                      }}
                    >
                      {notationMap[inp] || inp}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <Play className="mx-auto mb-4" size={64} />
                <div className="text-2xl">Start practicing...</div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800 border-2 border-yellow-500 rounded-lg p-4 text-center">
              <div className="text-yellow-400 text-sm uppercase font-bold">Streak</div>
              <div className="text-5xl font-bold text-white">{streak}</div>
            </div>
            <div className="bg-slate-800 border-2 border-green-500 rounded-lg p-4 text-center">
              <div className="text-green-400 text-sm uppercase font-bold">Total Inputs</div>
              <div className="text-5xl font-bold text-white">{inputHistory.length}</div>
            </div>
          </div>

          {/* Move List & Best Times */}
          <div className="bg-slate-800 rounded-lg p-6 border-2 border-purple-500">
            <h2 className="text-xl font-bold text-white mb-4">Best Times</h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(moves).map(([key, move]) => (
                <div
                  key={key}
                  className="bg-slate-900 p-3 rounded-lg border-2 border-slate-700"
                >
                  <div className={`text-${move.color}-400 font-bold`}>{move.name}</div>
                  <div className="text-gray-400 text-xs mb-1">
                    {move.input.map(i => notationMap[i] || i).join(' ')}
                  </div>
                  <div className="text-gray-500 text-xs">Target: ≤{move.maxFrames}f</div>
                  <div className="text-green-400 font-bold text-lg mt-1">
                    Best: {bestTimes[key] ? `${bestTimes[key]}f` : '--'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TekkenInputTrainer;