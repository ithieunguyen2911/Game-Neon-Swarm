
import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import { MAP_PROGRESSION, DEFAULT_CONTROLS, MAX_WEAPON_LEVEL } from '../constants';
import { GameState, GameMode, WeaponType } from '../types';
import { Play, RotateCcw, Trophy, Users, User, Heart, Target, Skull, Zap, Pause } from 'lucide-react';
import { InputHandler } from '../game/InputHandler';

const engine = new GameEngine();

interface PlayerHUDState {
    lives: number;
    weaponLevel: number;
    isDead: boolean;
    active: boolean;
    weaponType: WeaponType;
}

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputHandlerRef = useRef<InputHandler | null>(null);
  const [gameState, setGameState] = useState<GameState>(engine.gameState);
  const [score, setScore] = useState(0);
  const [mapIdx, setMapIdx] = useState(0);
  const [highScore, setHighScore] = useState(engine.highScore);
  
  const [p1HUD, setP1HUD] = useState<PlayerHUDState>({ lives: 5, weaponLevel: 1, isDead: false, active: true, weaponType: WeaponType.BLASTER });
  const [p2HUD, setP2HUD] = useState<PlayerHUDState>({ lives: 5, weaponLevel: 1, isDead: false, active: false, weaponType: WeaponType.BLASTER });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    inputHandlerRef.current = new InputHandler(DEFAULT_CONTROLS, canvas);

    // Escape Key Listener for Pause
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Escape') {
            engine.togglePause();
            setGameState(engine.gameState);
        }
    };
    window.addEventListener('keydown', handleKeyDown);

    let animationFrameId: number;
    const loop = () => {
      engine.update(1/60, inputHandlerRef.current!.state);
      engine.draw(ctx);
      
      setGameState(engine.gameState);
      setScore(engine.score);
      setMapIdx(engine.currentMapIndex);
      setHighScore(engine.highScore);

      const p1 = engine.players.get('p1');
      if (p1) setP1HUD({ lives: p1.lives, weaponLevel: p1.weaponLevel, isDead: p1.isDead, active: true, weaponType: p1.weaponType });

      const p2 = engine.players.get('p2');
      if (p2) setP2HUD({ lives: p2.lives, weaponLevel: p2.weaponLevel, isDead: p2.isDead, active: true, weaponType: p2.weaponType });
      else setP2HUD(prev => ({ ...prev, active: false }));

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const currentMap = MAP_PROGRESSION[mapIdx] || MAP_PROGRESSION[0];

  const renderPlayerHUD = (state: PlayerHUDState, isLeft: boolean, label: string) => (
    <div className={`absolute bottom-8 ${isLeft ? 'left-8' : 'right-8'} flex flex-col ${isLeft ? 'items-start' : 'items-end'} pointer-events-none z-10`}>
        <div className={`text-2xl font-black italic mb-2 ${isLeft ? 'text-blue-400' : 'text-green-400'} flex items-center gap-2`}>
            {isLeft ? <User className="w-6 h-6" /> : <Users className="w-6 h-6" />}
            {label}
        </div>
        {state.isDead ? (
            <div className="flex flex-col items-center animate-pulse">
                <span className="flex items-center gap-2 text-red-500 font-black text-xl mb-1"><Skull /> DESTROYED</span>
            </div>
        ) : (
            <>
                <div className="flex items-center gap-2 mb-3">
                    {state.lives <= 5 ? (
                         <div className="flex gap-1.5">
                            {[...Array(5)].map((_, i) => (
                                <Heart 
                                    key={i} 
                                    className={`w-8 h-8 transition-all ${i < state.lives ? 'text-red-500 fill-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.7)]' : 'text-neutral-800'}`} 
                                />
                            ))}
                         </div>
                    ) : (
                        <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-red-500/30">
                            <span className="text-3xl font-black text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.7)]">
                                {state.lives}
                            </span>
                            <span className="text-xl font-bold text-red-400">+</span>
                            <Heart className="w-10 h-10 text-red-500 fill-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.7)] animate-pulse" />
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <Zap className={`w-5 h-5 ${isLeft ? 'text-blue-400' : 'text-green-400'}`} />
                        <div className="flex gap-0.5">
                            {[...Array(MAX_WEAPON_LEVEL)].map((_, i) => {
                                const l = i + 1;
                                return (
                                    <div 
                                        key={l} 
                                        className={`w-2.5 h-4 rounded-sm transition-all ${l <= state.weaponLevel ? (isLeft ? 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.8)]') : 'bg-neutral-800'}`} 
                                    />
                                );
                            })}
                        </div>
                    </div>
                    <div className={`${isLeft ? 'text-left' : 'text-right'} text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em]`}>
                        {state.weaponType} OVERDRIVE Lvl.{state.weaponLevel}
                    </div>
                </div>
            </>
        )}
    </div>
  );

  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-black overflow-hidden font-sans">
      <canvas ref={canvasRef} width={1920} height={1080} className="max-w-full max-h-full object-contain" />

      {(gameState === GameState.PLAYING || gameState === GameState.PAUSED) && (
        <>
          <div className="absolute top-8 left-8 text-white font-black italic z-10">
            <div className="text-blue-400 text-sm tracking-widest mb-1">MISSION SECTOR {mapIdx + 1}/10</div>
            <div className="text-6xl tracking-tighter drop-shadow-2xl">{currentMap.name}</div>
          </div>

          <div className="absolute top-8 right-8 text-white text-right font-black italic z-10">
            <div className="text-neutral-500 text-sm tracking-widest mb-1 uppercase">WORLD RECORD: {highScore.toLocaleString()}</div>
            <div className="text-7xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-400 leading-none drop-shadow-2xl">
                {score.toLocaleString()}
            </div>
          </div>

          {engine.boss && (
            <div className="absolute top-44 left-1/2 -translate-x-1/2 w-[600px] text-center z-10 animate-in fade-in slide-in-from-top duration-700">
                <div className="text-cyan-400 text-sm font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 mb-3">
                    <Target className="w-6 h-6 animate-spin-slow" /> PILOT INTELLIGENCE
                </div>
                <div className="text-white text-2xl italic font-black bg-black/80 px-10 py-5 rounded-3xl border-2 border-cyan-500/40 backdrop-blur-2xl shadow-[0_0_50px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/20">
                    "{currentMap.bossLogic.toUpperCase()}"
                </div>
            </div>
          )}

          {renderPlayerHUD(p1HUD, true, "PLAYER 1")}
          {p2HUD.active && renderPlayerHUD(p2HUD, false, "PLAYER 2")}
        </>
      )}

      {gameState === GameState.PAUSED && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in duration-300">
            <div className="flex items-center gap-4 text-white mb-12">
                <Pause className="w-16 h-16 text-blue-400 fill-blue-400" />
                <h2 className="text-8xl font-black italic tracking-tighter">PAUSED</h2>
            </div>
            <div className="flex flex-col gap-6">
                <button 
                    onClick={() => engine.togglePause()}
                    className="flex items-center justify-center gap-4 bg-blue-600 text-white px-20 py-6 rounded-2xl font-black text-3xl hover:bg-blue-500 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                >
                    <Play className="w-8 h-8 fill-white" /> RESUME MISSION
                </button>
                <button 
                    onClick={() => engine.stopGame()}
                    className="flex items-center justify-center gap-4 bg-neutral-900 border border-neutral-700 text-neutral-400 px-20 py-6 rounded-2xl font-black text-2xl hover:bg-neutral-800 transition-all"
                >
                    <RotateCcw className="w-6 h-6" /> QUIT TO MENU
                </button>
            </div>
        </div>
      )}

      {gameState === GameState.MENU && (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-white z-40 p-8">
          <div className="relative mb-16">
            <h1 className="text-[12rem] font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 animate-pulse drop-shadow-[0_0_80px_rgba(59,130,246,0.5)]">
                NEON SWARM
            </h1>
            <div className="absolute -bottom-6 right-0 text-3xl font-light tracking-[0.8em] text-blue-400/60 uppercase">OVERDRIVE</div>
          </div>
          
          <div className="flex gap-16 mt-12">
            <button 
              onClick={() => engine.startGame(GameMode.OFFLINE_SOLO)}
              className="group flex flex-col items-center p-12 bg-neutral-900/40 border-2 border-neutral-800 hover:border-blue-500 rounded-[4rem] transition-all hover:scale-105 active:scale-95 shadow-2xl backdrop-blur-md"
            >
              <div className="w-28 h-28 bg-blue-500/10 rounded-full flex items-center justify-center mb-8 group-hover:bg-blue-500/30 transition-colors shadow-inner">
                <User className="w-14 h-14 text-blue-400" />
              </div>
              <span className="font-black text-3xl italic tracking-tight">SINGLE PILOT</span>
              <span className="text-xs text-neutral-500 mt-3 uppercase tracking-[0.3em]">Arcade Mission</span>
            </button>
            <button 
              onClick={() => engine.startGame(GameMode.OFFLINE_COOP)}
              className="group flex flex-col items-center p-12 bg-neutral-900/40 border-2 border-neutral-800 hover:border-green-500 rounded-[4rem] transition-all hover:scale-105 active:scale-95 shadow-2xl backdrop-blur-md"
            >
              <div className="w-28 h-28 bg-green-500/10 rounded-full flex items-center justify-center mb-8 group-hover:bg-green-500/30 transition-colors shadow-inner">
                <Users className="w-14 h-14 text-green-400" />
              </div>
              <span className="font-black text-3xl italic tracking-tight">WINGMAN CO-OP</span>
              <span className="text-xs text-neutral-500 mt-3 uppercase tracking-[0.3em]">Shared Victory</span>
            </button>
          </div>
          
          <div className="mt-24 text-neutral-600 font-mono text-sm uppercase tracking-[0.6em] animate-pulse">
             High Score Record: {highScore.toLocaleString()}
          </div>
        </div>
      )}

      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 bg-red-950/98 flex flex-col items-center justify-center text-white z-50 animate-in fade-in duration-1000">
          <div className="text-red-500 mb-6 animate-bounce drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]"><Skull className="w-28 h-28" /></div>
          <h2 className="text-[10rem] font-black italic mb-2 tracking-tighter drop-shadow-2xl">MISSION FAILED</h2>
          <p className="text-neutral-400 uppercase tracking-[0.6em] mb-16 text-2xl font-light">System Critical • Pilot Eliminated</p>
          <div className="text-center mb-20 bg-black/40 px-20 py-10 rounded-3xl border border-red-500/20 backdrop-blur-xl">
            <div className="text-neutral-500 text-lg uppercase mb-3 tracking-widest">Final Score</div>
            <div className="text-8xl font-black font-mono tracking-tighter text-red-500">{score.toLocaleString()}</div>
          </div>
          <button 
            onClick={() => engine.stopGame()}
            className="group flex items-center gap-6 bg-white text-black px-24 py-8 rounded-full font-black text-4xl hover:bg-neutral-200 transition-all hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.3)]"
          >
            <RotateCcw className="w-10 h-10 group-hover:rotate-180 transition-transform duration-700" /> RESTART MISSION
          </button>
        </div>
      )}

      {gameState === GameState.LEVEL_COMPLETE && (
        <div className="absolute inset-0 bg-blue-600/98 flex flex-col items-center justify-center text-white z-50">
          <Trophy className="w-40 h-40 text-yellow-400 mb-10 animate-bounce drop-shadow-[0_0_60px_rgba(250,204,21,0.6)]" />
          <h2 className="text-[12rem] font-black italic mb-6 tracking-tighter drop-shadow-2xl">GALAXY SAVED</h2>
          <div className="text-4xl font-light uppercase tracking-[1em] mb-20 text-blue-100 animate-pulse">The Swarm is Decimated</div>
          <button 
            onClick={() => engine.stopGame()}
            className="bg-white text-black px-28 py-10 rounded-full font-black text-5xl hover:bg-neutral-200 transition-all shadow-[0_0_80px_rgba(255,255,255,0.4)]"
          >
            RETURN AS HERO
          </button>
        </div>
      )}
    </div>
  );
};
