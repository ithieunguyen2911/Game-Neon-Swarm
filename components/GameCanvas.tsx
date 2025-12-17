import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import { GameState, GameMode, InputState, ZoneType, WeaponType, ControlSettings, PlayerKeyMap } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, ZONE_CONFIGS, DEFAULT_CONTROLS } from '../constants';
import { Play, RotateCcw, Trophy, MousePointer2, ArrowRight, Zap, Cloud, Flame, Users, Globe, User, Gamepad2, Settings, X, Keyboard, Heart, Pause, Skull } from 'lucide-react';
// import { multiplayer } from '../services/MultiplayerService'; // COMMENTED OUT ONLINE

const engine = new GameEngine();

interface PlayerStateUI {
    lives: number;
    weaponLevel: number;
    isDead: boolean;
    active: boolean;
}

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timer, setTimer] = useState(0);
  const [highScore, setHighScore] = useState(engine.highScore);
  
  // Separate states for UI rendering
  const [p1State, setP1State] = useState<PlayerStateUI>({ lives: 5, weaponLevel: 1, isDead: false, active: true });
  const [p2State, setP2State] = useState<PlayerStateUI>({ lives: 5, weaponLevel: 1, isDead: false, active: false });

  // Controls State
  const [controls, setControls] = useState<ControlSettings>(DEFAULT_CONTROLS);
  const [rebinding, setRebinding] = useState<{ player: 'p1' | 'p2', action: keyof PlayerKeyMap } | null>(null);

  const inputRef = useRef<InputState>({
    p1: { left: false, right: false, up: false, down: false, shooting: false, usePointer: false, pointer: {x: 0, y: 0} },
    p2: { left: false, right: false, up: false, down: false, shooting: false, usePointer: false }
  });

  // Load controls from local storage
  useEffect(() => {
    const savedControls = localStorage.getItem('neon_swarm_controls');
    if (savedControls) {
      try {
        setControls(JSON.parse(savedControls));
      } catch (e) {
        console.error("Failed to parse controls", e);
      }
    }
  }, []);

  // Save controls when changed
  useEffect(() => {
    localStorage.setItem('neon_swarm_controls', JSON.stringify(controls));
  }, [controls]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no transparency
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1); // Cap dt to prevent huge jumps
      lastTime = time;

      try {
        // Only update engine if NOT in settings or paused
        if (gameState !== GameState.SETTINGS && gameState !== GameState.PAUSED) {
            engine.update(dt, inputRef.current);
        }
        engine.draw(ctx);
      } catch (e) {
        console.error("Game Loop Error:", e);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      // Sync React State with Engine
      // REMOVED: gameState !== GameState.PAUSED check which was causing the override bug
      if (engine.gameState !== gameState && gameState !== GameState.SETTINGS) {
           setGameState(engine.gameState);
      }
      
      if (engine.score !== score) setScore(engine.score);
      if (engine.highScore !== highScore) setHighScore(engine.highScore);
      
      // Update P1 UI State
      const p1 = engine.players.get('p1');
      if (p1) {
          setP1State({ lives: p1.lives, weaponLevel: p1.weaponLevel, isDead: p1.isDead, active: true });
      }

      // Update P2 UI State
      const p2 = engine.players.get('p2');
      if (p2) {
          setP2State({ lives: p2.lives, weaponLevel: p2.weaponLevel, isDead: p2.isDead, active: true });
      } else {
          setP2State(prev => ({ ...prev, active: false }));
      }
      
      if (engine.level !== level) setLevel(engine.level);
      setTimer(Math.ceil(engine.levelTimer));

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, score, highScore, level]);

  // Handle Input with Dynamic Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Rebinding Logic
      if (rebinding) {
        e.preventDefault();
        setControls(prev => ({
          ...prev,
          [rebinding.player]: {
            ...prev[rebinding.player],
            [rebinding.action]: e.code
          }
        }));
        setRebinding(null);
        return;
      }

      // Game Logic (Dynamic Mapping)
      const code = e.code;
      
      // Pause Toggle
      if (code === 'Escape') {
          if (gameState === GameState.PLAYING) {
              setGameState(GameState.PAUSED);
              engine.gameState = GameState.PAUSED;
          } else if (gameState === GameState.PAUSED) {
              setGameState(GameState.PLAYING);
              engine.gameState = GameState.PLAYING;
          } else if (gameState === GameState.SETTINGS) {
              setGameState(GameState.MENU); // Back to menu from settings
              engine.gameState = GameState.MENU;
          }
          return;
      }
      
      // P1
      if (code === controls.p1.left) inputRef.current.p1.left = true;
      if (code === controls.p1.right) inputRef.current.p1.right = true;
      if (code === controls.p1.up) inputRef.current.p1.up = true;
      if (code === controls.p1.down) inputRef.current.p1.down = true;
      if (code === controls.p1.shoot) inputRef.current.p1.shooting = true;

      // P2
      if (code === controls.p2.left) inputRef.current.p2.left = true;
      if (code === controls.p2.right) inputRef.current.p2.right = true;
      if (code === controls.p2.up) inputRef.current.p2.up = true;
      if (code === controls.p2.down) inputRef.current.p2.down = true;
      if (code === controls.p2.shoot) inputRef.current.p2.shooting = true;
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      
      // P1
      if (code === controls.p1.left) inputRef.current.p1.left = false;
      if (code === controls.p1.right) inputRef.current.p1.right = false;
      if (code === controls.p1.up) inputRef.current.p1.up = false;
      if (code === controls.p1.down) inputRef.current.p1.down = false;
      if (code === controls.p1.shoot) inputRef.current.p1.shooting = false;

      // P2
      if (code === controls.p2.left) inputRef.current.p2.left = false;
      if (code === controls.p2.right) inputRef.current.p2.right = false;
      if (code === controls.p2.up) inputRef.current.p2.up = false;
      if (code === controls.p2.down) inputRef.current.p2.down = false;
      if (code === controls.p2.shoot) inputRef.current.p2.shooting = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current || gameState === GameState.SETTINGS || gameState === GameState.PAUSED) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      
      inputRef.current.p1.pointer = {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY
      };
      inputRef.current.p1.usePointer = true;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!canvasRef.current || gameState === GameState.SETTINGS || gameState === GameState.PAUSED) return;
      e.preventDefault(); 
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      
      inputRef.current.p1.pointer = {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY
      };
      inputRef.current.p1.usePointer = true;
      inputRef.current.p1.shooting = true; 
    };

    const handleMouseDown = () => { if (gameState === GameState.PLAYING) inputRef.current.p1.shooting = true; };
    const handleMouseUp = () => { inputRef.current.p1.shooting = false; };
    const handleTouchEnd = () => { inputRef.current.p1.shooting = false; inputRef.current.p1.usePointer = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchstart', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchstart', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [controls, rebinding, gameState]);

  const handleStart = (mode: GameMode) => {
    engine.startGame(mode, ZoneType.SKY, true);
    setGameState(GameState.PLAYING);
  };

  const handleNextLevel = (zone: ZoneType) => {
      // Logic for keeping weapon is handled in GameEngine.startGame (resetScore = false)
      engine.startGame(engine.gameMode, zone, false); 
      setGameState(GameState.PLAYING);
  };

  const handleQuitToMenu = () => {
      engine.stopGame();
      setGameState(GameState.MENU);
  };

  const formatKey = (code: string) => {
      return code.replace('Key', '').replace('Arrow', '');
  }

  const renderKeyButton = (player: 'p1'|'p2', action: keyof PlayerKeyMap, label: string) => {
      const isRebinding = rebinding?.player === player && rebinding?.action === action;
      const keyDisplay = formatKey(controls[player][action]);

      return (
          <div className="flex items-center justify-between bg-neutral-900/50 p-3 rounded-lg border border-neutral-800">
              <span className="text-neutral-400 font-bold text-sm uppercase">{label}</span>
              <button
                onClick={() => setRebinding({ player, action })}
                className={`
                    px-4 py-2 rounded font-mono font-bold min-w-[100px] text-center transition-all
                    ${isRebinding 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-neutral-800 text-blue-400 hover:bg-neutral-700 hover:text-blue-300'}
                `}
              >
                  {isRebinding ? 'PRESS KEY' : keyDisplay}
              </button>
          </div>
      );
  }

  const renderPlayerHUD = (state: PlayerStateUI, isLeft: boolean, label: string) => {
      return (
        <div className={`absolute bottom-6 ${isLeft ? 'left-6' : 'right-6'} flex flex-col ${isLeft ? 'items-start' : 'items-end'}`}>
            <div className={`text-2xl font-black italic mb-1 ${isLeft ? 'text-blue-400' : 'text-green-400'}`}>
                {label}
            </div>
            
            {state.isDead ? (
                <div className="flex flex-col items-center animate-bounce">
                    <span className="flex items-center gap-2 text-red-500 font-bold mb-1">
                        <Skull className="w-6 h-6" /> DESTROYED
                    </span>
                    {/* Only show revive hint if we are in Coop mode, assuming donor exists */}
                    {p1State.active && p2State.active && (
                       <span className="text-white bg-red-600 px-2 py-1 rounded text-xs font-bold">PRESS SHOOT TO REVIVE</span>
                    )}
                </div>
            ) : (
                <div className="flex gap-1 mb-2">
                     {[...Array(5)].map((_, i) => (
                        <Heart 
                            key={i} 
                            className={`w-6 h-6 ${i < state.lives ? 'text-red-500 fill-red-500' : 'text-neutral-800 fill-neutral-800'}`} 
                        />
                    ))}
                </div>
            )}
            
            {!state.isDead && (
                <div className="flex gap-1">
                    {[1,2,3,4,5].map(l => (
                         <div key={l} className={`w-4 h-2 rounded-sm ${l <= state.weaponLevel ? (isLeft ? 'bg-blue-400' : 'bg-green-400') : 'bg-neutral-800'}`} />
                    ))}
                </div>
            )}
        </div>
      );
  };

  return (
    <div className="relative flex justify-center items-center h-screen bg-neutral-950">
      
      {/* HUD TOP */}
      {(gameState === GameState.PLAYING || gameState === GameState.PAUSED) && (
        <div className="absolute top-4 left-4 right-4 flex justify-between text-white pointer-events-none z-10 font-mono">
          <div className="flex flex-col gap-2">
            <div>
                <span className="text-xs text-neutral-400 font-bold block">SCORE</span>
                <span className="text-2xl font-bold tracking-tight text-white">{score.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-center">
             <span className="text-4xl font-black italic text-neutral-700">{timer}</span>
          </div>

          <div className="flex flex-col items-end">
             <div className="flex items-center gap-2 mb-1">
                {engine.gameMode === GameMode.OFFLINE_COOP && <Users className="w-4 h-4 text-green-400" />}
                {engine.gameMode === GameMode.OFFLINE_SOLO && <User className="w-4 h-4 text-yellow-400" />}
                <span className="text-xs text-neutral-400">
                    {engine.gameMode.replace('OFFLINE_', '')}
                </span>
             </div>
             <span className="text-xs text-neutral-500 mt-1">{ZONE_CONFIGS[engine.currentZone].name}</span>
          </div>
        </div>
      )}

      {/* HUD BOTTOM - PLAYER STATUS */}
      {(gameState === GameState.PLAYING || gameState === GameState.PAUSED) && (
          <div className="pointer-events-none z-10">
              {p1State.active && renderPlayerHUD(p1State, true, "PLAYER 1")}
              {p2State.active && renderPlayerHUD(p2State, false, "PLAYER 2")}
          </div>
      )}

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="max-w-full max-h-full border border-neutral-800 shadow-2xl shadow-blue-900/20 bg-black"
        style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
      />

      {/* PAUSE OVERLAY */}
      {gameState === GameState.PAUSED && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white z-40">
           <div className="flex flex-col items-center animate-bounce mb-8">
               <Pause className="w-16 h-16 text-white mb-2" />
               <h2 className="text-4xl font-black tracking-widest">PAUSED</h2>
           </div>
           <p className="text-neutral-400 font-mono">PRESS [ESC] TO RESUME</p>
           <button 
                onClick={handleQuitToMenu}
                className="mt-8 px-6 py-3 border border-neutral-600 rounded hover:bg-neutral-800 transition-colors"
           >
               QUIT TO MENU
           </button>
        </div>
      )}

      {/* Menu Overlay */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md text-white z-20">
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-2 italic tracking-tighter">
            NEON SWARM
          </h1>
          <h2 className="text-2xl font-light tracking-widest text-blue-200 mb-12">OVERDRIVE</h2>
          
          <div className="flex gap-6 w-full max-w-2xl px-8 justify-center">
              {/* OFFLINE SOLO */}
              <button 
                onClick={() => handleStart(GameMode.OFFLINE_SOLO)}
                className="flex flex-col items-center p-6 bg-neutral-900 border border-neutral-800 hover:border-yellow-500 hover:bg-neutral-800 rounded-xl transition-all group w-48"
              >
                  <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4 text-yellow-400 group-hover:scale-110 transition-transform">
                     <User className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">SOLO PILOT</h3>
                  <p className="text-xs text-neutral-500 text-center">Standard Arcade Mode</p>
                  <div className="mt-4 text-xs text-neutral-600 font-mono">WASD / MOUSE</div>
              </button>

              {/* OFFLINE COOP */}
              <button 
                onClick={() => handleStart(GameMode.OFFLINE_COOP)}
                className="flex flex-col items-center p-6 bg-neutral-900 border border-neutral-800 hover:border-green-500 hover:bg-neutral-800 rounded-xl transition-all group w-48"
              >
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 text-green-400 group-hover:scale-110 transition-transform">
                     <Gamepad2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">LOCAL CO-OP</h3>
                  <p className="text-xs text-neutral-500 text-center">2 Players on 1 Screen</p>
                  <div className="mt-4 text-xs text-neutral-600 font-mono">P1: Mouse • P2: Space</div>
              </button>
          </div>

          <button 
            onClick={() => setGameState(GameState.SETTINGS)}
            className="absolute top-8 right-8 p-2 text-neutral-500 hover:text-white transition-colors flex items-center gap-2"
          >
              <Settings className="w-6 h-6" />
              <span>CONTROLS</span>
          </button>
        </div>
      )}

      {/* Settings / Controls Overlay */}
      {gameState === GameState.SETTINGS && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/95 backdrop-blur-xl z-30 text-white animate-in fade-in duration-200">
              <div className="w-full max-w-4xl p-8">
                  <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
                      <div className="flex items-center gap-3">
                          <Keyboard className="w-8 h-8 text-blue-400" />
                          <h2 className="text-3xl font-bold">FLIGHT CONTROLS</h2>
                      </div>
                      <button 
                        onClick={() => setGameState(engine.gameState === GameState.PLAYING ? GameState.PLAYING : GameState.MENU)}
                        className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white"
                      >
                          <X className="w-8 h-8" />
                      </button>
                  </div>

                  <div className="grid grid-cols-2 gap-12">
                      {/* Player 1 Column */}
                      <div>
                          <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                              <User className="w-5 h-5" /> PLAYER 1
                          </h3>
                          <div className="space-y-3">
                              {renderKeyButton('p1', 'up', 'Move Up')}
                              {renderKeyButton('p1', 'down', 'Move Down')}
                              {renderKeyButton('p1', 'left', 'Move Left')}
                              {renderKeyButton('p1', 'right', 'Move Right')}
                              {renderKeyButton('p1', 'shoot', 'Fire Weapon')}
                          </div>
                          <p className="text-xs text-neutral-500 mt-2 italic">* Mouse aiming always active for P1</p>
                      </div>

                      {/* Player 2 Column */}
                      <div>
                          <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                              <Gamepad2 className="w-5 h-5" /> PLAYER 2
                          </h3>
                          <div className="space-y-3">
                              {renderKeyButton('p2', 'up', 'Move Up')}
                              {renderKeyButton('p2', 'down', 'Move Down')}
                              {renderKeyButton('p2', 'left', 'Move Left')}
                              {renderKeyButton('p2', 'right', 'Move Right')}
                              {renderKeyButton('p2', 'shoot', 'Fire Weapon')}
                          </div>
                      </div>
                  </div>

                  <div className="mt-12 flex justify-between items-center text-sm text-neutral-500">
                      <p>Click a button then press any key to rebind. Press ESC to cancel/return.</p>
                      <button 
                        onClick={() => setControls(DEFAULT_CONTROLS)}
                        className="flex items-center gap-2 px-4 py-2 border border-neutral-700 rounded hover:bg-neutral-800 text-neutral-300 transition-colors"
                      >
                          <RotateCcw className="w-4 h-4" /> RESET DEFAULTS
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Level Complete / Shop Overlay */}
      {gameState === GameState.LEVEL_COMPLETE && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md text-white z-20 animate-in fade-in duration-300">
           <h2 className="text-3xl font-black italic text-green-400 mb-2">ZONE CLEARED</h2>
           <p className="text-neutral-400 mb-8">Prepare for the next sector...</p>

           <div className="grid grid-cols-2 gap-4 w-full max-w-2xl px-8">
              <button 
                onClick={() => handleNextLevel(ZoneType.SKY)}
                className="flex flex-col items-center p-6 bg-slate-900 border border-slate-700 hover:border-blue-400 hover:bg-slate-800 rounded-xl transition-all group"
              >
                 <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform">
                    <Cloud className="w-6 h-6" />
                 </div>
                 <h3 className="text-xl font-bold mb-1">AERO PEAKS</h3>
                 <p className="text-xs text-neutral-500 mb-4">High Winds • Open Space</p>
              </button>

              <button 
                onClick={() => handleNextLevel(ZoneType.VOLCANO)}
                className="flex flex-col items-center p-6 bg-red-950 border border-red-900 hover:border-red-500 hover:bg-red-900 rounded-xl transition-all group"
              >
                 <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4 text-red-400 group-hover:scale-110 transition-transform">
                    <Flame className="w-6 h-6" />
                 </div>
                 <h3 className="text-xl font-bold mb-1">MAGMA CORE</h3>
                 <p className="text-xs text-neutral-500 mb-4">Heat Updrafts • Curved Shots</p>
              </button>
           </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/80 backdrop-blur-sm text-white z-20 animate-in fade-in duration-300">
          <h2 className="text-5xl font-black text-red-500 mb-2 tracking-widest">CRITICAL FAILURE</h2>
          <div className="text-center mb-8">
            <p className="text-neutral-300 text-lg">FINAL SCORE</p>
            <p className="text-4xl font-mono font-bold text-white">{score.toLocaleString()}</p>
          </div>
          
          {score >= highScore && score > 0 && (
             <div className="flex items-center gap-2 text-yellow-400 mb-8 animate-bounce">
                <Trophy className="w-6 h-6" />
                <span className="font-bold">NEW HIGH SCORE!</span>
             </div>
          )}

          <div className="flex gap-4">
              <button 
                onClick={handleQuitToMenu}
                className="px-8 py-4 bg-neutral-800 text-white hover:bg-neutral-700 font-bold rounded-lg transition-all"
              >
                MAIN MENU
              </button>
              <button 
                onClick={() => handleStart(engine.gameMode)} // Restart same mode
                className="px-8 py-4 bg-white text-black hover:bg-neutral-200 font-bold rounded-lg transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                RETRY
              </button>
          </div>
        </div>
      )}
    </div>
  );
};