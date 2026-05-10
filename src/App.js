import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Search, Info } from 'lucide-react';

const TekkenInputTrainer = () => {
  const [inputHistory, setInputHistory] = useState([]);
  const [detectedMove, setDetectedMove] = useState(null);
  const [lastPerfect, setLastPerfect] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestTimes, setBestTimes] = useState({});
  const [showSettings, setShowSettings] = useState(false);

  const [detectionMode, setDetectionMode] = useState('ewgf'); // Default to ewgf
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [keyBinds, setKeyBinds] = useState({
    up: 'KeyW',
    down: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
    btn1: 'KeyU',
    btn2: 'KeyI',
    btn3: 'KeyJ',
    btn4: 'KeyK'
  });
  const [editingKey, setEditingKey] = useState(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [flashSuccess, setFlashSuccess] = useState(false);
  

  const lastInputTime = useRef(Date.now());
  const pressedDirections = useRef(new Set());
  const pressedButtons = useRef(new Set());
  const lastState = useRef({ direction: null, buttons: [] });
  const inputBuffer = useRef([]);
  const moveStartTime = useRef(null);
  
  // Artificial Latency Queue
  const inputQueue = useRef([]);
  const animationFrameId = useRef(null);

  const moves = {
    ewgf: {
      name: 'EWGF',
      input: ['f', 'n', 'd', 'df', '2'],
      maxFrames: 13,
      description: 'Electric Wind God Fist',
      startup: 'i14',
      onBlock: '+8',
      onHit: '+22',
      damage: 25,
      characters: ['Kazuya', 'Devil Jin', 'Heihachi'],
      type: 'attacks',
      color: 'yellow'
    },
    pewgf: {
      name: 'PERFECT EWGF',
      input: ['f', 'n', 'd', 'df', '2'],
      maxFrames: 11,
      description: 'Just-frame Electric — 1F window',
      startup: 'i13',
      onBlock: '+5',
      onHit: 'Launch',
      damage: 25,
      characters: ['Kazuya'],
      type: 'just-frame',
      color: 'green'
    },
    wavedash: {
      name: 'WAVEDASH',
      input: ['f', 'n', 'd', 'df'],
      maxFrames: 15,
      description: 'Korean Backdash Cancel forward',
      startup: '--',
      onBlock: '--',
      onHit: '--',
      damage: 0,
      characters: ['Mishimas', 'Armor King', 'Bob'],
      type: 'movement',
      color: 'blue'
    },
    hellsweep: {
      name: 'HELLSWEEP',
      input: ['f', 'n', 'd', 'df', '4'],
      maxFrames: 16,
      description: 'Mishima low sweep',
      startup: 'i16',
      onBlock: '-23',
      onHit: 'KND',
      damage: 32,
      characters: ['Kazuya', 'Devil Jin'],
      type: 'attacks',
      color: 'red'
    },
    kbd: {
      name: 'KBD',
      input: ['b', 'n', 'b', 'db', 'b'],
      maxFrames: 12,
      description: 'Korean Backdash',
      startup: '--',
      onBlock: '--',
      onHit: '--',
      damage: 0,
      characters: ['All'],
      type: 'movement',
      color: 'purple'
    },
    run: {
      name: 'RUN',
      input: ['f', 'n', 'f', 'n', 'f'],
      maxFrames: 20,
      description: 'Forward run',
      startup: '--',
      onBlock: '--',
      onHit: '--',
      damage: 0,
      characters: ['All'],
      type: 'movement',
      color: 'gray'
    },
    command_throw: {
      name: 'COMMAND THROW',
      input: ['f', '1+2'],
      maxFrames: 10,
      description: 'Forward command grab',
      startup: 'i11',
      onBlock: '--',
      onHit: 'Throw',
      damage: 40,
      characters: ['All'],
      type: 'attacks',
      color: 'orange'
    },
    backdash: {
      name: 'BACKDASH',
      input: ['b', 'n', 'b'],
      maxFrames: 15,
      description: 'Quick back dash',
      startup: '--',
      onBlock: '--',
      onHit: '--',
      damage: 0,
      characters: ['All'],
      type: 'movement',
      color: 'gray'
    },
    sidestep_left: {
      name: 'SIDESTEP L',
      input: ['u'],
      maxFrames: 5,
      description: 'Step into background',
      startup: '--',
      onBlock: '--',
      onHit: '--',
      damage: 0,
      characters: ['All'],
      type: 'movement',
      color: 'gray'
    }
  };

  const notationMap = {
    'f': '→', 'b': '←', 'u': '↑', 'd': '↓',
    'df': '↘', 'db': '↙', 'uf': '↗', 'ub': '↖',
    'n': '★', '1': '1', '2': '2', '3': '3', '4': '4',
    '1+2': '1+2'
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
    
    const cleanedBuffer = [];
    for (let i = 0; i < buffer.length; i++) {
      const current = buffer[i];
      
      if (current.includes('+')) {
        const parts = current.split('+');
        if (cleanedBuffer.length === 0 || cleanedBuffer[cleanedBuffer.length - 1] !== parts[0]) {
          cleanedBuffer.push(parts[0]);
        }
        if (cleanedBuffer.length === 0 || cleanedBuffer[cleanedBuffer.length - 1] !== parts[1]) {
          cleanedBuffer.push(parts[1]);
        }
        continue;
      }
      
      if (current === 'n') {
        const prev = cleanedBuffer[cleanedBuffer.length - 1];
        const next = buffer[i + 1];
        
        if (next && next.includes('+')) {
          const nextDir = next.split('+')[0];
          if (prev === nextDir) continue;
        }
      }
      
      if (cleanedBuffer.length > 0 && cleanedBuffer[cleanedBuffer.length - 1] === current) {
        continue;
      }

      cleanedBuffer.push(current);
    }

    if (detectionMode !== 'auto') {
      const targetMove = moves[detectionMode];
      if (!targetMove) return;
      const required = targetMove.input;
      
      let matchCount = 0;
      for (let i = 0; i < cleanedBuffer.length && i < required.length; i++) {
        if (cleanedBuffer[i] === required[i]) {
          matchCount++;
        } else {
          setStreak(0);
          setCurrentProgress(0);
          inputBuffer.current = [];
          moveStartTime.current = null;
          return;
        }
      }
      
      setCurrentProgress(matchCount);
      
      if (cleanedBuffer.length > required.length) {
        setStreak(0);
        setCurrentProgress(0);
        inputBuffer.current = [];
        moveStartTime.current = null;
        return;
      }
      
      if (cleanedBuffer.length === required.length) {
        const matches = cleanedBuffer.every((inp, idx) => inp === required[idx]);
        
        if (matches) {
          const executionTime = now - moveStartTime.current;
          const frames = Math.round(executionTime / 16.67);
          
          const isPerfect = frames <= targetMove.maxFrames;
          
          setDetectedMove({ ...targetMove, frames, isPerfect });
          setLastPerfect(isPerfect);
          
          if (isPerfect) {
            setFlashSuccess(true);
            setTimeout(() => setFlashSuccess(false), 500);
            setStreak(prev => prev + 1);
            setBestTimes(prev => ({
              ...prev,
              [detectionMode]: !bestTimes[detectionMode] || frames < bestTimes[detectionMode] ? frames : bestTimes[detectionMode]
            }));
          } else {
            setStreak(prev => prev + 1);
          }
          
          inputBuffer.current = [];
          moveStartTime.current = null;
          setCurrentProgress(0);
          
          setTimeout(() => {
            setLastPerfect(false);
            setDetectedMove(null);
          }, 2000);
        }
      }
    }
  };

  const addInputToHistory = (input, now) => {
    setInputHistory(prev => {
      const newHistory = [...prev, { input, time: now }];
      return newHistory.slice(-50); // Keep more history for sidebar
    });
    
    if (inputBuffer.current.length === 0) {
      moveStartTime.current = now;
    }
    
    inputBuffer.current.push(input);
    checkMoves(now, input);
  };

  // Format key codes for display
  const formatKeyName = (code) => {
    return code.replace('Key', '').replace('Digit', '');
  };

  // Game Loop for Input Latency (33.3ms buffer)
  useEffect(() => {
    const loop = () => {
      const now = Date.now();
      let stateToProcess = null;

      // Dequeue all events that have matured (passed the 33.3ms latency threshold)
      while (inputQueue.current.length > 0) {
        const oldestEvent = inputQueue.current[0];
        if (now - oldestEvent.time >= 33.3) {
          stateToProcess = inputQueue.current.shift();
        } else {
          break; // Not enough time has passed for this event
        }
      }

      // If we dequeued events, process the latest one (inherent frame debounce)
      if (stateToProcess) {
        const directionChanged = stateToProcess.direction !== lastState.current.direction;
        const buttonsChanged = JSON.stringify(stateToProcess.buttons) !== JSON.stringify(lastState.current.buttons);

        if (directionChanged || buttonsChanged) {
          let inputToAdd = null;

          if (stateToProcess.direction && stateToProcess.buttons.length > 0) {
            const buttonsStr = stateToProcess.buttons.join('+');
            inputToAdd = `${stateToProcess.direction}+${buttonsStr}`;
          } else if (stateToProcess.direction) {
            inputToAdd = stateToProcess.direction;
          } else if (!stateToProcess.direction && stateToProcess.buttons.length === 0 && lastState.current.direction !== null) {
            inputToAdd = 'n';
          }

          if (inputToAdd) {
            addInputToHistory(inputToAdd, stateToProcess.time);
          }

          lastState.current = { direction: stateToProcess.direction, buttons: stateToProcess.buttons };
        }
      }

      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastInput = now - lastInputTime.current;
      
      if (timeSinceLastInput > 500) {
        if (streak > 0 && !flashSuccess && !detectedMove) {
          setStreak(0);
        }
        if (inputBuffer.current.length > 0) {
          inputBuffer.current = [];
          moveStartTime.current = null;
          setCurrentProgress(0);
        }
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [streak, flashSuccess, detectedMove]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (editingKey) {
        e.preventDefault();
        const code = e.code;
        if (e.key.toLowerCase() !== 'escape') {
          setKeyBinds(prev => ({ ...prev, [editingKey]: code }));
        }
        setEditingKey(null);
        return;
      }

      const code = e.code;
      const now = Date.now();
      const timeSinceLastInput = now - lastInputTime.current;
      
      if (timeSinceLastInput > 800) {
        inputBuffer.current = [];
        moveStartTime.current = null;
      }

      let wasPressed = false;

      const directionalKeys = [keyBinds.up, keyBinds.down, keyBinds.left, keyBinds.right];
      if (directionalKeys.includes(code)) {
        e.preventDefault();
        if (!pressedDirections.current.has(code)) {
          pressedDirections.current.add(code);
          wasPressed = true;
        }
      }
      else if (code === keyBinds.btn1 && !pressedButtons.current.has('1')) {
        e.preventDefault(); pressedButtons.current.add('1'); wasPressed = true;
      }
      else if (code === keyBinds.btn2 && !pressedButtons.current.has('2')) {
        e.preventDefault(); pressedButtons.current.add('2'); wasPressed = true;
      }
      else if (code === keyBinds.btn3 && !pressedButtons.current.has('3')) {
        e.preventDefault(); pressedButtons.current.add('3'); wasPressed = true;
      }
      else if (code === keyBinds.btn4 && !pressedButtons.current.has('4')) {
        e.preventDefault(); pressedButtons.current.add('4'); wasPressed = true;
      }

      if (wasPressed) {
        lastInputTime.current = now;
        inputQueue.current.push({
          time: now,
          direction: getCurrentDirection(),
          buttons: Array.from(pressedButtons.current).sort()
        });
      }
    };

    const handleKeyUp = (e) => {
      const code = e.code;
      const now = Date.now();
      
      let wasReleased = false;
      
      const directionalKeys = [keyBinds.up, keyBinds.down, keyBinds.left, keyBinds.right];
      if (directionalKeys.includes(code)) {
        e.preventDefault();
        if (pressedDirections.current.has(code)) {
          pressedDirections.current.delete(code);
          wasReleased = true;
        }
      }
      else if (code === keyBinds.btn1 && pressedButtons.current.has('1')) {
        e.preventDefault(); pressedButtons.current.delete('1'); wasReleased = true;
      }
      else if (code === keyBinds.btn2 && pressedButtons.current.has('2')) {
        e.preventDefault(); pressedButtons.current.delete('2'); wasReleased = true;
      }
      else if (code === keyBinds.btn3 && pressedButtons.current.has('3')) {
        e.preventDefault(); pressedButtons.current.delete('3'); wasReleased = true;
      }
      else if (code === keyBinds.btn4 && pressedButtons.current.has('4')) {
        e.preventDefault(); pressedButtons.current.delete('4'); wasReleased = true;
      }

      if (wasReleased) {
        lastInputTime.current = now;
        inputQueue.current.push({
          time: now,
          direction: getCurrentDirection(),
          buttons: Array.from(pressedButtons.current).sort()
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyBinds, editingKey]);

  useEffect(() => {
    setCurrentProgress(0);
    setDetectedMove(null);
    setLastPerfect(false);
    setFlashSuccess(false);
    inputBuffer.current = [];
    moveStartTime.current = null;
  }, [detectionMode]);

  const renderDrillSequence = (move) => {
    return move.input.map((inp, idx) => {
      const isActive = idx < currentProgress;
      const isButton = ['1','2','3','4','1+2'].some(b => inp.includes(b));
      
      if (isButton) {
        // Render combination of direction + button if any
        let dir = '';
        let btn = inp;
        if (inp.includes('+') && ['f','b','u','d','df','db','uf','ub'].includes(inp.split('+')[0])) {
           dir = inp.split('+')[0];
           btn = inp.split('+')[1];
        }

        return (
          <React.Fragment key={idx}>
            <div className="flex items-center gap-2">
              {dir && (
                 <div className={`w-12 h-12 flex items-center justify-center rounded-md border text-xl font-bold transition-all
                  ${isActive ? 'border-purple-500 text-purple-400 bg-purple-900/20' : 'border-[#2d2d3f] text-gray-400 bg-[#13131A]'}
                `}>
                  {notationMap[dir] || dir}
                </div>
              )}
              {dir && <span className="text-gray-600 text-xs">+</span>}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all
                ${isActive || flashSuccess ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'bg-gray-700 text-gray-400'}
              `}>
                {notationMap[btn] || btn}
              </div>
            </div>
            {idx < move.input.length - 1 && <span className="text-gray-600">→</span>}
          </React.Fragment>
        );
      }

      return (
        <React.Fragment key={idx}>
          <div className={`w-12 h-12 flex items-center justify-center rounded-md border text-xl font-bold transition-all
            ${isActive ? 'border-purple-500 text-purple-400 bg-purple-900/20' : 'border-[#2d2d3f] text-gray-400 bg-[#13131A]'}
          `}>
            {notationMap[inp] || inp}
          </div>
          {idx < move.input.length - 1 && <span className="text-gray-600">→</span>}
        </React.Fragment>
      );
    });
  };

  const renderMiniIcons = (inputArray) => {
    return (
      <div className="flex items-center gap-1">
        {inputArray.map((inp, i) => {
          const isBtn = ['1','2','3','4','1+2'].some(b => inp.includes(b));
          if (isBtn) {
            let dir = '';
            let btn = inp;
            if (inp.includes('+') && ['f','b','u','d','df','db','uf','ub'].includes(inp.split('+')[0])) {
               dir = inp.split('+')[0];
               btn = inp.split('+')[1];
            }
            return (
              <div key={i} className="flex items-center gap-1">
                {dir && <span className="w-5 h-5 flex items-center justify-center bg-[#1F1F2E] rounded border border-[#2D2D3F] text-[10px] text-gray-400">{notationMap[dir]}</span>}
                {dir && <span className="text-gray-600 text-[10px]">+</span>}
                <span className="w-5 h-5 flex items-center justify-center bg-yellow-400 text-black rounded-full font-bold text-[10px]">{notationMap[btn] || btn}</span>
              </div>
            );
          }
          return (
            <span key={i} className="w-5 h-5 flex items-center justify-center bg-[#1F1F2E] rounded border border-[#2D2D3F] text-[10px] text-gray-400">
              {notationMap[inp] || inp}
            </span>
          );
        })}
      </div>
    );
  };

  const filteredMoves = Object.entries(moves).filter(([key, move]) => {
    if (filterType !== 'all' && move.type !== filterType) return false;
    if (searchQuery && !move.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const activeMove = moves[detectionMode];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0d0d12] text-gray-200 font-sans flex flex-col">
      {/* Navbar */}
      <header className="h-16 border-b border-[#1A1A24] flex items-center justify-between px-6 bg-[#0d0d12] shrink-0">
        <div className="flex items-center gap-8">
          <div className="text-xl font-bold tracking-wider text-white">
            FRAME<span className="text-purple-500">LAB</span>
          </div>
          <nav className="flex items-center gap-2">
            <button className="px-4 py-2 text-sm text-gray-500 hover:text-gray-300 transition">practice</button>
            <button className="px-4 py-2 text-sm bg-[#1A1A24] text-gray-200 rounded-md">movedex</button>
            <button className="px-4 py-2 text-sm text-gray-500 hover:text-gray-300 transition">test runner</button>
            <button onClick={() => setShowSettings(true)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-300 transition">settings</button>
          </nav>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <div>session <span className="text-purple-400">--:--</span></div>
          <div><span className="text-gray-300">{inputHistory.length}</span> inputs</div>
          <div className="flex items-center gap-2 bg-[#1A1A24] px-3 py-1 rounded-full text-xs">
            <div className="w-2 h-2 rounded-full bg-gray-600"></div> no gamepad
          </div>
          <Info size={16} className="text-gray-500" />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar - MOVEDEX */}
        <div className="w-[320px] flex flex-col border-r border-[#1A1A24] bg-[#0d0d12]">
          <div className="p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-gray-500">MOVEDEX - {Object.keys(moves).length} MOVES</span>
              <div className="flex text-xs bg-[#1A1A24] rounded-md p-1">
                {['all', 'just-frame', 'movement', 'attacks'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-2 py-1 rounded ${filterType === type ? 'bg-[#2D2D3F] text-gray-200' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="search moves.." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#13131A] border border-[#1F1F2E] rounded-md py-2 pl-9 pr-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500 transition"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {filteredMoves.map(([key, move]) => (
              <button
                key={key}
                onClick={() => setDetectionMode(key)}
                className={`w-full text-left p-4 border-b border-[#1A1A24] transition flex flex-col gap-2 hover:bg-[#1A1625] ${detectionMode === key ? 'bg-[#1A1625] border-l-2 border-l-purple-500' : 'border-l-2 border-l-transparent'}`}
              >
                <div className="flex justify-between items-center">
                  <span className={`font-bold uppercase ${detectionMode === key ? 'text-purple-400' : 'text-gray-200'}`}>{move.name}</span>
                  <span className="text-[10px] bg-[#1A1A24] px-2 py-0.5 rounded border border-[#2D2D3F] text-gray-400 font-mono">{move.maxFrames}F window</span>
                </div>
                {renderMiniIcons(move.input)}
                <span className="text-xs text-gray-500">{move.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Center Content - MOVE DETAIL */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#0d0d12]">
          {activeMove ? (
            <div className="max-w-4xl mx-auto flex flex-col gap-8">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">MOVE DETAIL</span>
                <button className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-md text-sm font-semibold transition">
                  drill this move
                </button>
              </div>

              <div>
                <h1 className="text-6xl font-black tracking-tight mb-2 uppercase text-white font-['Oswald',sans-serif]">{activeMove.name}</h1>
                <p className="text-gray-400 text-lg">{activeMove.description}</p>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-[#13131A] border border-[#1A1A24] rounded-lg p-5">
                  <div className="text-xs font-bold text-gray-500 mb-2">WINDOW</div>
                  <div className="text-3xl font-bold text-purple-400">{activeMove.maxFrames}F</div>
                </div>
                <div className="bg-[#13131A] border border-[#1A1A24] rounded-lg p-5">
                  <div className="text-xs font-bold text-gray-500 mb-2">STARTUP</div>
                  <div className="text-3xl font-bold text-white">{activeMove.startup}</div>
                </div>
                <div className="bg-[#13131A] border border-[#1A1A24] rounded-lg p-5">
                  <div className="text-xs font-bold text-gray-500 mb-2">ON BLOCK</div>
                  <div className="text-3xl font-bold text-white">{activeMove.onBlock}</div>
                </div>
                <div className="bg-[#13131A] border border-[#1A1A24] rounded-lg p-5">
                  <div className="text-xs font-bold text-gray-500 mb-2">ON HIT</div>
                  <div className="text-3xl font-bold text-white">{activeMove.onHit}</div>
                </div>
              </div>

              <div className="flex items-center gap-8 py-2">
                <div>
                  <div className="text-xs font-bold text-gray-500 mb-2">CHARACTERS</div>
                  <div className="flex gap-2">
                    {activeMove.characters.map(char => (
                      <span key={char} className="px-3 py-1 bg-purple-900/10 border border-purple-500/30 text-purple-400 rounded-md text-xs">{char}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 mb-2">DAMAGE</div>
                  <div className="text-lg font-bold text-white">{activeMove.damage}</div>
                </div>
              </div>

              <div className="bg-[#0b0c10] border border-[#1A1A24] rounded-xl p-8 mt-4">
                <div className="text-xs font-bold tracking-wider text-gray-500 mb-6">DRILL</div>
                
                <div className="flex items-center gap-4 mb-8">
                  {renderDrillSequence(activeMove)}
                </div>

                <div className="text-xs text-gray-600 font-mono">
                  WASD - directions · U I J K - buttons 1 2 3 4
                </div>

                {/* Status Indicator */}
                <div className="mt-8 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">Streak: <span className="text-white font-bold">{streak}</span></span>
                    {lastPerfect && <span className="text-xs font-bold text-yellow-400 animate-pulse bg-yellow-400/10 px-2 py-1 rounded">PERFECT!</span>}
                    {detectedMove && !lastPerfect && <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">SUCCESS</span>}
                  </div>
                  {bestTimes[detectionMode] && (
                    <span className="text-sm text-gray-500">Best Time: <span className="text-green-400 font-bold">{bestTimes[detectionMode]}F</span></span>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-600">Select a move to drill</div>
          )}
        </div>

        {/* Right Sidebar - INPUT HISTORY */}
        <div className="w-[280px] bg-[#0d0d12] border-l border-[#1A1A24] flex flex-col">
          <div className="p-4 border-b border-[#1A1A24] flex justify-between items-center shrink-0">
            <span className="text-xs font-bold tracking-wider text-gray-500">INPUT HISTORY</span>
            <button onClick={() => { setInputHistory([]); setStreak(0); }} className="text-gray-500 hover:text-white transition">
              <RotateCcw size={14} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
            {inputHistory.length === 0 ? (
              <div className="text-xs text-gray-600 text-center mt-10">Waiting for input...</div>
            ) : (
              [...inputHistory].reverse().map((item, idx) => {
                const actualIndex = inputHistory.length - idx;
                const prevItem = inputHistory[inputHistory.length - idx - 2];
                const timeSincePrev = prevItem ? item.time - prevItem.time : 0;
                const frames = timeSincePrev > 2000 ? 0 : Math.round(timeSincePrev / 16.67);
                
                const isBtn = item.input.includes('1') || item.input.includes('2') || item.input.includes('3') || item.input.includes('4');
                const isNeutral = item.input === 'n';

                return (
                  <div key={actualIndex} className="flex items-center justify-between py-1.5 px-2 hover:bg-[#1A1A24] rounded group transition">
                    <div className="flex items-center gap-2">
                      {isNeutral ? (
                        <span className="w-5 h-5 flex items-center justify-center text-[10px] text-gray-600 font-bold">★</span>
                      ) : (
                        <span className={`text-sm font-bold ${isBtn ? 'text-yellow-400' : 'text-gray-300'}`}>
                          {item.input.split('+').map(i => notationMap[i] || i).join(' + ')}
                        </span>
                      )}
                    </div>
                    {frames > 0 && <span className="text-[10px] text-gray-500 font-mono opacity-50 group-hover:opacity-100">{frames}F</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#13131A] border border-[#1A1A24] rounded-lg p-6 w-[500px] shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-wider">Key Bindings</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-gray-500 text-xs font-bold tracking-wider mb-2">DIRECTIONAL</h3>
                {['up', 'down', 'left', 'right'].map(key => (
                  <button
                    key={key}
                    onClick={() => setEditingKey(key)}
                    className={`w-full flex justify-between items-center p-3 rounded-md border ${
                      editingKey === key 
                        ? 'border-purple-500 bg-purple-900/20 text-purple-400' 
                        : 'border-[#2D2D3F] bg-[#1A1A24] text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <span className="uppercase text-xs font-bold">{key}</span>
                    <span className="font-mono">{editingKey === key ? 'Press key...' : formatKeyName(keyBinds[key])}</span>
                  </button>
                ))}
              </div>
              
              <div className="space-y-3">
                <h3 className="text-gray-500 text-xs font-bold tracking-wider mb-2">ATTACK BUTTONS</h3>
                {['btn1', 'btn2', 'btn3', 'btn4'].map((key, idx) => (
                  <button
                    key={key}
                    onClick={() => setEditingKey(key)}
                    className={`w-full flex justify-between items-center p-3 rounded-md border ${
                      editingKey === key 
                        ? 'border-yellow-500 bg-yellow-900/20 text-yellow-400' 
                        : 'border-[#2D2D3F] bg-[#1A1A24] text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <span className="uppercase text-xs font-bold">Button {idx + 1}</span>
                    <span className="font-mono">{editingKey === key ? 'Press key...' : formatKeyName(keyBinds[key])}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-md font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TekkenInputTrainer;
