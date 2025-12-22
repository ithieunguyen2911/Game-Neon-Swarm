
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../game/GameEngine';
import { DEFAULT_CONTROLS, COLOR_PALETTE, COLORS } from '../constants';
import { GameState, GameMode, WeaponType, PlayerState } from '../types';
import { ScrollText } from 'lucide-react';
import { InputHandler } from '../game/InputHandler';
import { audio } from '../services/AudioSynthesizer';
import { PixiRenderer } from '../game/PixiRenderer';

// Import sub-components
import { PlayerHUD, PlayerHUDState } from './PlayerHUD';
import { GameMenu } from './GameMenu';
import { PauseOverlay } from './PauseOverlay';
import { GameOverOverlay } from './GameOverOverlay';
import { LevelCompleteOverlay } from './LevelCompleteOverlay';
import { BossBestiary } from './BossBestiary';

const engine = new GameEngine();

export const GameCanvas: React.FC = () => {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const hudCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  
  const inputHandlerRef = useRef<InputHandler | null>(null);
  const loopRef = useRef<number | null>(null);
  const isPlaying = useRef(false);
  
  const [gameState, setGameState] = useState<GameState>(engine.gameState);
  const [score, setScore] = useState(0);
  const [mapIdx, setMapIdx] = useState(0);
  
  const [p1ColorIdx, setP1ColorIdx] = useState(0);
  const [p2ColorIdx, setP2ColorIdx] = useState(1);
  const [showBestiary, setShowBestiary] = useState(false);

  const [p1HUD, setP1HUD] = useState<PlayerHUDState>({ 
    lives: 5, weaponLevel: 1, isDead: false, active: true, 
    weaponType: WeaponType.BLASTER, 
    primaryColor: COLOR_PALETTE[0].primary, 
    glowColor: COLOR_PALETTE[0].glow, 
    overload: 0, isOverheated: false 
  });

  const [p2HUD, setP2HUD] = useState<PlayerHUDState>({ 
    lives: 5, weaponLevel: 1, isDead: false, active: false, 
    weaponType: WeaponType.BLASTER, 
    primaryColor: COLOR_PALETTE[1].primary, 
    glowColor: COLOR_PALETTE[1].glow, 
    overload: 0, isOverheated: false 
  });

  const stopGameLoop = useCallback(() => {
    if (loopRef.current !== null) {
      cancelAnimationFrame(loopRef.current);
      loopRef.current = null;
    }
    isPlaying.current = false;
  }, []);

  const clearResources = useCallback(() => {
    stopGameLoop();
    if (inputHandlerRef.current) {
        inputHandlerRef.current.destroy();
        inputHandlerRef.current = null;
    }
    engine.cleanup();
    PixiRenderer.getInstance().reset();
    audio.suspend();
    
    if (pixiContainerRef.current) {
        pixiContainerRef.current.innerHTML = '';
    }
  }, [stopGameLoop]);

  const initPixi = async () => {
    await engine.initRenderer();
    const pixiApp = PixiRenderer.getInstance().app;
    if (pixiContainerRef.current && pixiApp) {
        pixiContainerRef.current.innerHTML = ''; 
        const pixiCanvas = pixiApp.canvas;
        pixiCanvas.style.position = 'absolute';
        pixiCanvas.style.top = '0';
        pixiCanvas.style.left = '0';
        pixiCanvas.style.width = '100%';
        pixiCanvas.style.height = '100%';
        pixiCanvas.style.objectFit = 'contain';
        pixiCanvas.style.pointerEvents = 'none';
        pixiContainerRef.current.appendChild(pixiCanvas);
    }
  };

  const handleStartSolo = async () => {
    COLORS.p1Primary = COLOR_PALETTE[p1ColorIdx].primary;
    COLORS.p1Glow = COLOR_PALETTE[p1ColorIdx].glow;
    await initPixi();
    engine.startGame(GameMode.OFFLINE_SOLO, 0);
    setGameState(GameState.PLAYING);
    containerRef.current?.focus();
  };

  const handleStartCoop = async () => {
    COLORS.p1Primary = COLOR_PALETTE[p1ColorIdx].primary;
    COLORS.p1Glow = COLOR_PALETTE[p1ColorIdx].glow;
    COLORS.p2Primary = COLOR_PALETTE[p2ColorIdx].primary;
    COLORS.p2Glow = COLOR_PALETTE[p2ColorIdx].glow;
    await initPixi();
    engine.startGame(GameMode.OFFLINE_COOP, 0);
    setGameState(GameState.PLAYING);
    containerRef.current?.focus();
  };

  const handleResume = () => {
    engine.gameState = GameState.PLAYING;
    setGameState(GameState.PLAYING);
    containerRef.current?.focus();
  };

  const handleQuit = () => {
    clearResources();
    engine.reset();
    setGameState(GameState.MENU);
  };

  const handleRestart = () => {
    const mode = engine.players.size > 1 ? GameMode.OFFLINE_COOP : GameMode.OFFLINE_SOLO;
    engine.startGame(mode, 0);
    setGameState(GameState.PLAYING);
    containerRef.current?.focus();
  };

  const handleNextLevel = () => {
    engine.startNextLevel();
    setGameState(GameState.PLAYING);
    containerRef.current?.focus();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
        if (e.code === 'Escape' || e.code === 'KeyP') {
            if (engine.gameState === GameState.PLAYING) {
                engine.gameState = GameState.PAUSED;
                setGameState(GameState.PAUSED);
            } else if (engine.gameState === GameState.PAUSED) {
                engine.gameState = GameState.PLAYING;
                setGameState(GameState.PLAYING);
            }
        }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (gameState !== GameState.PLAYING && gameState !== GameState.PAUSED && gameState !== GameState.LEVEL_COMPLETE) {
        return;
    }

    const hudCanvas = hudCanvasRef.current;
    const bgCanvas = bgCanvasRef.current;
    if (!hudCanvas || !bgCanvas) return;
    
    const hudCtx = hudCanvas.getContext('2d');
    const bgCtx = bgCanvas.getContext('2d');
    if (!hudCtx || !bgCtx) return;

    const startGameLoop = () => {
        if (isPlaying.current) return;
        isPlaying.current = true;

        if (!inputHandlerRef.current) {
            inputHandlerRef.current = new InputHandler(DEFAULT_CONTROLS, hudCanvas);
        }

        const loop = () => {
            if (!isPlaying.current) return;
            
            if (engine.gameState === GameState.PLAYING) {
                engine.update(1/60, inputHandlerRef.current!.state);
            }
            
            bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
            hudCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
            engine.drawSplit(bgCtx, hudCtx);
            
            if (engine.gameState !== gameState) {
                setGameState(engine.gameState);
            }
            
            setScore(engine.score);
            setMapIdx(engine.currentMapIndex);

            const p1 = engine.players.get('p1');
            if (p1) {
                setP1HUD({ 
                    lives: p1.lives, weaponLevel: p1.weaponLevel, isDead: p1.state === PlayerState.DEAD, active: true, 
                    weaponType: p1.weaponType, primaryColor: p1.primaryColor, glowColor: p1.glowColor, 
                    overload: p1.overloadValue, isOverheated: p1.isOverheated 
                });
            }

            const p2 = engine.players.get('p2');
            if (p2) {
                setP2HUD({ 
                    lives: p2.lives, weaponLevel: p2.weaponLevel, isDead: p2.state === PlayerState.DEAD, active: true, 
                    weaponType: p2.weaponType, primaryColor: p2.primaryColor, glowColor: p2.glowColor, 
                    overload: p2.overloadValue, isOverheated: p2.isOverheated 
                });
            } else {
                setP2HUD(prev => ({ ...prev, active: false }));
            }

            loopRef.current = requestAnimationFrame(loop);
        };
        loopRef.current = requestAnimationFrame(loop);
    };

    startGameLoop();
    return () => stopGameLoop();
  }, [gameState, stopGameLoop]);

  return (
    <div 
      ref={containerRef} 
      tabIndex={0}
      className="relative w-full h-screen flex items-center justify-center bg-black overflow-hidden font-sans outline-none"
    >
      <canvas 
        ref={bgCanvasRef} 
        width={1920} height={1080} 
        className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0" 
      />
      <div 
        ref={pixiContainerRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />
      <canvas 
        ref={hudCanvasRef} 
        width={1920} height={1080} 
        className="absolute inset-0 w-full h-full object-contain pointer-events-auto z-20" 
      />

      {(gameState === GameState.PLAYING || gameState === GameState.LEVEL_COMPLETE) && (
        <>
          <div className="absolute top-40 left-60 max-w-sm z-30 pointer-events-none opacity-60">
             <p className="text-cyan-400 text-xs italic font-medium uppercase tracking-widest mb-1 flex items-center gap-2">
                <ScrollText className="w-3 h-3" /> Encrypted Comms
             </p>
             <p className="text-white/50 text-sm leading-tight">
                {engine.currentVersion.maps[mapIdx]?.storySnippet}
             </p>
          </div>

          <PlayerHUD state={p1HUD} isLeft={true} label="PLAYER 1" />
          {p2HUD.active && <PlayerHUD state={p2HUD} isLeft={false} label="PLAYER 2" />}
        </>
      )}

      {gameState === GameState.PAUSED && (
        <PauseOverlay onResume={handleResume} onQuit={handleQuit} />
      )}

      {gameState === GameState.MENU && (
        <GameMenu 
            highScore={engine.highScore}
            p1ColorIdx={p1ColorIdx} p2ColorIdx={p2ColorIdx}
            setP1ColorIdx={setP1ColorIdx} setP2ColorIdx={setP2ColorIdx}
            onStartSolo={handleStartSolo}
            onStartCoop={handleStartCoop} 
            onOpenGallery={() => setShowBestiary(true)}
        />
      )}

      {gameState === GameState.GAME_OVER && (
        <GameOverOverlay score={score} onRestart={handleRestart} />
      )}

      {gameState === GameState.LEVEL_COMPLETE && (
        <LevelCompleteOverlay 
            sector={mapIdx + 1} 
            score={score} 
            onNextLevel={handleNextLevel} 
        />
      )}

      {showBestiary && (
        <BossBestiary onClose={() => setShowBestiary(false)} />
      )}
    </div>
  );
};
