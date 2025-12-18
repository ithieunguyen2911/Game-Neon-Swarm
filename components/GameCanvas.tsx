
import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import { MAP_PROGRESSION, DEFAULT_CONTROLS, COLOR_PALETTE } from '../constants';
import { GameState, GameMode, WeaponType } from '../types';
import { Target } from 'lucide-react';
import { InputHandler } from '../game/InputHandler';

// Import sub-components
import { PlayerHUD, PlayerHUDState } from './PlayerHUD';
import { GameMenu } from './GameMenu';
import { PauseOverlay } from './PauseOverlay';
import { GameOverOverlay } from './GameOverOverlay';

const engine = new GameEngine();

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputHandlerRef = useRef<InputHandler | null>(null);
  const [gameState, setGameState] = useState<GameState>(engine.gameState);
  const [score, setScore] = useState(0);
  const [mapIdx, setMapIdx] = useState(0);
  const [highScore, setHighScore] = useState(engine.highScore);
  
  // Customization states
  const [p1ColorIdx, setP1ColorIdx] = useState(0);
  const [p2ColorIdx, setP2ColorIdx] = useState(1);

  const [p1HUD, setP1HUD] = useState<PlayerHUDState>({ lives: 5, weaponLevel: 1, isDead: false, active: true, weaponType: WeaponType.BLASTER, primaryColor: COLOR_PALETTE[0].primary, glowColor: COLOR_PALETTE[0].glow });
  const [p2HUD, setP2HUD] = useState<PlayerHUDState>({ lives: 5, weaponLevel: 1, isDead: false, active: false, weaponType: WeaponType.BLASTER, primaryColor: COLOR_PALETTE[1].primary, glowColor: COLOR_PALETTE[1].glow });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    inputHandlerRef.current = new InputHandler(DEFAULT_CONTROLS, canvas);

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
      if (p1) setP1HUD({ lives: p1.lives, weaponLevel: p1.weaponLevel, isDead: p1.isDead, active: true, weaponType: p1.weaponType, primaryColor: p1.primaryColor, glowColor: p1.glowColor });

      const p2 = engine.players.get('p2');
      if (p2) setP2HUD({ lives: p2.lives, weaponLevel: p2.weaponLevel, isDead: p2.isDead, active: true, weaponType: p2.weaponType, primaryColor: p2.primaryColor, glowColor: p2.glowColor });
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

  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-black overflow-hidden font-sans">
      <canvas ref={canvasRef} width={1920} height={1080} className="max-w-full max-h-full object-contain" />

      {/* Main Game UI */}
      {(gameState === GameState.PLAYING || gameState === GameState.PAUSED) && (
        <>
          <div className="absolute top-8 left-8 text-white font-black italic z-10">
            <div className="text-cyan-400 text-sm tracking-widest mb-1">MISSION SECTOR {mapIdx + 1}/10</div>
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

          <PlayerHUD state={p1HUD} isLeft={true} label="PLAYER 1" />
          {p2HUD.active && <PlayerHUD state={p2HUD} isLeft={false} label="PLAYER 2" />}
        </>
      )}

      {/* Overlays and Menus */}
      {gameState === GameState.PAUSED && (
        <PauseOverlay 
            onResume={() => engine.togglePause()} 
            onQuit={() => engine.stopGame()} 
        />
      )}

      {gameState === GameState.MENU && (
        <GameMenu 
            highScore={highScore}
            p1ColorIdx={p1ColorIdx}
            p2ColorIdx={p2ColorIdx}
            setP1ColorIdx={setP1ColorIdx}
            setP2ColorIdx={setP2ColorIdx}
            onStartSolo={() => engine.startGame(GameMode.OFFLINE_SOLO, 0, COLOR_PALETTE[p1ColorIdx])}
            onStartCoop={() => engine.startGame(GameMode.OFFLINE_COOP, 0, COLOR_PALETTE[p1ColorIdx], COLOR_PALETTE[p2ColorIdx])}
        />
      )}

      {gameState === GameState.GAME_OVER && (
        <GameOverOverlay 
            score={score} 
            onRestart={() => engine.stopGame()} 
        />
      )}
    </div>
  );
};
