
import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import { GameState, GameMode, ZoneType, ControlSettings, PlayerKeyMap } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, ZONE_CONFIGS, DEFAULT_CONTROLS } from '../constants';
import { Play, RotateCcw, Trophy, MousePointer2, ArrowRight, Zap, Cloud, Flame, Users, User, Gamepad2, Settings, X, Keyboard, Heart, Pause, Skull } from 'lucide-react';
import { InputHandler } from '../game/InputHandler';

const engine = new GameEngine();

interface PlayerStateUI {
    lives: number;
    weaponLevel: number;
    isDead: boolean;
    active: boolean;
}

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputHandlerRef = useRef<InputHandler | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timer, setTimer] = useState(0);
  const [highScore, setHighScore] = useState(engine.highScore);
  
  const [p1State, setP1State] = useState<PlayerStateUI>({ lives: 5, weaponLevel: 1, isDead: false, active: true });
  const [p2State, setP2State] = useState<PlayerStateUI>({ lives: 5, weaponLevel: 1, isDead: false, active: false });

  const [controls, setControls] = useState<ControlSettings>(DEFAULT_CONTROLS);
  const [rebinding, setRebinding] = useState<{ player: 'p1' | 'p2', action: keyof PlayerKeyMap } | null>(null);

  useEffect(() => {
    const savedControls = localStorage.getItem('neon_swarm_controls');
    if (savedControls) {
      try { setControls(JSON.parse(savedControls)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('neon_swarm_controls', JSON.stringify(controls));
  }, [controls]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    inputHandlerRef.current = new InputHandler(controls, canvas);

    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (gameState !== GameState.SETTINGS && gameState !== GameState.PAUSED && inputHandlerRef.current) {
          engine.update(dt, inputHandlerRef.current.state);
      }
      engine.draw(ctx);

      if (engine.gameState !== gameState && gameState !== GameState.SETTINGS) {
           setGameState(engine.gameState);
      }
      
      if (engine.score !== score) setScore(engine.score);
      if (engine.highScore !== highScore) setHighScore(engine.highScore);
      
      const p1 = engine.players.get('p1');
      if (p1) setP1State({ lives: p1.lives, weaponLevel: p1.weaponLevel, isDead: p1.isDead, active: true });

      const p2 = engine.players.get('p2');
      if (p2) setP2State({ lives: p2.lives, weaponLevel: p2.weaponLevel, isDead: p2.isDead, active: true });
      else setP2State(prev => ({ ...prev, active: false }));
      
      if (engine.level !== level) setLevel(engine.level);
      setTimer(Math.ceil(engine.levelTimer));

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, score, highScore, level, controls]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (rebinding) {
        e.preventDefault();
        setControls(prev => ({ ...prev, [rebinding.player]: { ...prev[rebinding.player], [rebinding.action]: e.code } }));
        setRebinding(null);
        return;
      }
      if (e.code === 'Escape') {
          const next = gameState === GameState.PLAYING ? GameState.PAUSED : GameState.PLAYING;
          setGameState(next); engine.gameState = next;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, rebinding]);

  const renderPlayerHUD = (state: PlayerStateUI, isLeft: boolean, label: string) => (
    <div className={`absolute bottom-6 ${isLeft ? 'left-6' : 'right-6'} flex flex-col ${isLeft ? 'items-start' : 'items-end'} pointer-events-none z-10`}>
        <div className={`text-2xl font-black italic mb-1 ${isLeft ? 'text-blue-400' : 'text-green-400'}`}>{label}</div>
        {state.isDead ? (
            <div className="flex flex-col items-center animate-bounce">
                <span className="flex items-center gap-2 text-red-500 font-bold mb-1"><Skull /> DESTROYED</span>
                {p1State.active && p2State.active && <span className="text-white bg-red-600 px-2 py-1 rounded text-xs font-bold">PRESS SHOOT TO REVIVE</span>}
            </div>
        ) : (
            <>
                <div className="flex gap-1 mb-2">
                     {[...Array(5)].map((_, i) => <Heart key={i} className={`w-6 h-6 ${i < state.lives ? 'text-red-500 fill-red-500' : 'text-neutral-800 fill-neutral-800'}`} />)}
                </div>
                <div className="flex gap-1">
                    {[1,2,3,4,5].map(l => <div key={l} className={`w-4 h-2 rounded-sm ${l <= state.weaponLevel ? (isLeft ? 'bg-blue-400' : 'bg-green-400') : 'bg-neutral-800'}`} />)}
                </div>
            </>
        )}
    </div>
  );

  return (
    <div className="relative flex justify-center items-center h-screen bg-neutral-950">
      {(gameState === GameState.PLAYING || gameState === GameState.PAUSED) && (
        <div className="absolute top-4 left-4 right-4 flex justify-between text-white pointer-events-none z-10 font-mono">
          <div><span className="text-xs text-neutral-400 font-bold block">SCORE</span><span className="text-2xl font-bold tracking-tight">{score.toLocaleString()}</span></div>
          <div className="flex flex-col items-center"><span className="text-4xl font-black italic text-neutral-700">{timer}</span></div>
          <div className="flex flex-col items-end">
             <div className="flex items-center gap-2 mb-1">
                {engine.gameMode === GameMode.OFFLINE_COOP ? <Users className="w-4 h-4 text-green-400" /> : <User className="w-4 h-4 text-yellow-400" />}
                <span className="text-xs text-neutral-400">{engine.gameMode.replace('OFFLINE_', '')}</span>
             </div>
             <span className="text-xs text-neutral-500 mt-1">{ZONE_CONFIGS[engine.currentZone].name}</span>
          </div>
        </div>
      )}
      {(gameState === GameState.PLAYING || gameState === GameState.PAUSED) && (
          <> {renderPlayerHUD(p1State, true, "PLAYER 1")} {p2State.active && renderPlayerHUD(p2State, false, "PLAYER 2")} </>
      )}
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="max-w-full max-h-full border border-neutral-800 shadow-2xl bg-black" style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }} />
      {gameState === GameState.PAUSED && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white z-40">
           <div className="flex flex-col items-center animate-bounce mb-8"><Pause className="w-16 h-16 mb-2" /><h2 className="text-4xl font-black tracking-widest">PAUSED</h2></div>
           <p className="text-neutral-400 font-mono">PRESS [ESC] TO RESUME</p>
           <button onClick={() => { engine.stopGame(); setGameState(GameState.MENU); }} className="mt-8 px-6 py-3 border border-neutral-600 rounded hover:bg-neutral-800 transition-colors">QUIT TO MENU</button>
        </div>
      )}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md text-white z-20">
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-2 italic tracking-tighter">NEON SWARM</h1>
          <h2 className="text-2xl font-light tracking-widest text-blue-200 mb-12">OVERDRIVE</h2>
          <div className="flex gap-6 w-full max-w-2xl px-8 justify-center">
              <button onClick={() => { engine.startGame(GameMode.OFFLINE_SOLO); setGameState(GameState.PLAYING); }} className="flex flex-col items-center p-6 bg-neutral-900 border border-neutral-800 hover:border-yellow-500 rounded-xl transition-all group w-48">
                  <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4 text-yellow-400 group-hover:scale-110 transition-transform"><User className="w-8 h-8" /></div>
                  <h3 className="text-xl font-bold mb-2">SOLO PILOT</h3>
                  <p className="text-xs text-neutral-500 text-center">Standard Arcade Mode</p>
              </button>
              <button onClick={() => { engine.startGame(GameMode.OFFLINE_COOP); setGameState(GameState.PLAYING); }} className="flex flex-col items-center p-6 bg-neutral-900 border border-neutral-800 hover:border-green-500 rounded-xl transition-all group w-48">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 text-green-400 group-hover:scale-110 transition-transform"><Gamepad2 className="w-8 h-8" /></div>
                  <h3 className="text-xl font-bold mb-2">LOCAL CO-OP</h3>
                  <p className="text-xs text-neutral-500 text-center">2 Players 1 Screen</p>
              </button>
          </div>
          <button onClick={() => setGameState(GameState.SETTINGS)} className="absolute top-8 right-8 p-2 text-neutral-500 hover:text-white transition-colors flex items-center gap-2"><Settings className="w-6 h-6" /><span>CONTROLS</span></button>
        </div>
      )}
      {gameState === GameState.SETTINGS && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/95 backdrop-blur-xl z-30 text-white animate-in fade-in duration-200">
              <div className="w-full max-w-4xl p-8">
                  <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
                      <div className="flex items-center gap-3"><Keyboard className="w-8 h-8 text-blue-400" /><h2 className="text-3xl font-bold">FLIGHT CONTROLS</h2></div>
                      <button onClick={() => setGameState(GameState.MENU)} className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white"><X className="w-8 h-8" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-12">
                      {['p1', 'p2'].map(p => (
                          <div key={p}>
                              <h3 className={`text-xl font-bold ${p === 'p1' ? 'text-blue-400' : 'text-green-400'} mb-4 flex items-center gap-2`}>{p === 'p1' ? <User /> : <Gamepad2 />} PLAYER {p === 'p1' ? '1' : '2'}</h3>
                              <div className="space-y-3">
                                  {['up', 'down', 'left', 'right', 'shoot'].map(action => (
                                      <div key={action} className="flex items-center justify-between bg-neutral-900/50 p-3 rounded-lg border border-neutral-800">
                                          <span className="text-neutral-400 font-bold text-sm uppercase">{action}</span>
                                          <button onClick={() => setRebinding({ player: p as any, action: action as any })} className={`px-4 py-2 rounded font-mono font-bold min-w-[100px] text-center transition-all ${rebinding?.player === p && rebinding?.action === action ? 'bg-red-500 animate-pulse' : 'bg-neutral-800 text-blue-400 hover:bg-neutral-700'}`}>
                                              {rebinding?.player === p && rebinding?.action === action ? 'PRESS KEY' : controls[p as 'p1'|'p2'][action as keyof PlayerKeyMap].replace('Key', '').replace('Arrow', '')}
                                          </button>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
                  <div className="mt-12 flex justify-between items-center text-sm text-neutral-500">
                      <p>Click a button then press any key to rebind. Press ESC to cancel/return.</p>
                      <button onClick={() => setControls(DEFAULT_CONTROLS)} className="flex items-center gap-2 px-4 py-2 border border-neutral-700 rounded hover:bg-neutral-800 text-neutral-300 transition-colors"><RotateCcw className="w-4 h-4" /> RESET DEFAULTS</button>
                  </div>
              </div>
          </div>
      )}
      {gameState === GameState.LEVEL_COMPLETE && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md text-white z-20">
           <h2 className="text-3xl font-black italic text-green-400 mb-2">ZONE CLEARED</h2>
           <p className="text-neutral-400 mb-8">Prepare for the next sector...</p>
           <div className="grid grid-cols-2 gap-4 w-full max-w-2xl px-8">
              <button onClick={() => { engine.startGame(engine.gameMode, ZoneType.SKY, false); setGameState(GameState.PLAYING); }} className="flex flex-col items-center p-6 bg-slate-900 border border-slate-700 hover:border-blue-400 rounded-xl group transition-all">
                 <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform"><Cloud /></div>
                 <h3 className="text-xl font-bold mb-1">AERO PEAKS</h3>
                 <p className="text-xs text-neutral-500">High Winds • Open Space</p>
              </button>
              <button onClick={() => { engine.startGame(engine.gameMode, ZoneType.VOLCANO, false); setGameState(GameState.PLAYING); }} className="flex flex-col items-center p-6 bg-red-950 border border-red-900 hover:border-red-500 rounded-xl group transition-all">
                 <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4 text-red-400 group-hover:scale-110 transition-transform"><Flame /></div>
                 <h3 className="text-xl font-bold mb-1">MAGMA CORE</h3>
                 <p className="text-xs text-neutral-500">Heat Updrafts • Curved Shots</p>
              </button>
           </div>
        </div>
      )}
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/80 backdrop-blur-sm text-white z-20">
          <h2 className="text-5xl font-black text-red-500 mb-2 tracking-widest uppercase">CRITICAL FAILURE</h2>
          <div className="text-center mb-8"><p className="text-neutral-300 text-lg">FINAL SCORE</p><p className="text-4xl font-mono font-bold">{score.toLocaleString()}</p></div>
          {score >= highScore && score > 0 && <div className="flex items-center gap-2 text-yellow-400 mb-8 animate-bounce"><Trophy /><span className="font-bold">NEW HIGH SCORE!</span></div>}
          <div className="flex gap-4">
              <button onClick={() => { engine.stopGame(); setGameState(GameState.MENU); }} className="px-8 py-4 bg-neutral-800 hover:bg-neutral-700 font-bold rounded-lg transition-all">MAIN MENU</button>
              <button onClick={() => { engine.startGame(engine.gameMode); setGameState(GameState.PLAYING); }} className="px-8 py-4 bg-white text-black hover:bg-neutral-200 font-bold rounded-lg transition-all flex items-center gap-2"><RotateCcw /> RETRY</button>
          </div>
        </div>
      )}
    </div>
  );
};
