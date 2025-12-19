
import React, { useEffect, useRef, useState } from 'react';
// Changed import to include BossChickenKing as Boss is abstract
import { Boss, BossChickenKing } from '../game/entities/Boss';
import { MAP_PROGRESSION, CANVAS_WIDTH, CANVAS_HEIGHT, WEAPON_CONFIGS } from '../constants';
import { WeaponType, ZoneType } from '../types';
import { ChevronLeft, ChevronRight, X, ShieldAlert, Zap, Target } from 'lucide-react';

interface BossBestiaryProps {
    onClose: () => void;
}

export const BossBestiary: React.FC<BossBestiaryProps> = ({ onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const requestRef = useRef<number>(null);

    const themeColors = ['#22d3ee', '#f97316', '#22c55e', '#ffffff', '#a855f7', '#10b981', '#fb7185', '#fbbf24', '#f87171', '#ffffff'];
    const bossWeapons = [WeaponType.BLASTER, WeaponType.SHOTGUN, WeaponType.HELIX, WeaponType.ROCKET, WeaponType.LASER, WeaponType.BLASTER, WeaponType.SHOTGUN, WeaponType.HELIX, WeaponType.ROCKET, WeaponType.LASER];

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const map = MAP_PROGRESSION[currentIndex];
        const themeColor = themeColors[currentIndex % themeColors.length];
        const weapon = bossWeapons[currentIndex % bossWeapons.length];
        
        // FIX: Use BossChickenKing instead of abstract Boss class
        const boss = new BossChickenKing(
            { x: canvas.width / 2, y: canvas.height / 2 + 50 },
            1000,
            map.bossName,
            map.zone,
            themeColor
        );
        // FIX: Removed boss.bossWeapon = weapon; as bossWeapon is not a property of Boss
        boss.isVulnerable = Math.sin(Date.now() / 1000) > 0;

        const render = () => {
            ctx.fillStyle = '#020617';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Vẽ background grid mờ cho giống Cyber
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            for(let i=0; i<canvas.width; i+=50) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
            }
            for(let j=0; j<canvas.height; j+=50) {
                ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke();
            }

            boss.stateTimer += 0.016;
            boss.wingFlap += 0.15;
            boss.isVulnerable = Math.sin(boss.stateTimer * 2) > 0;
            
            // Override position để giữ boss cố định trong preview
            boss.position = { x: canvas.width / 2, y: canvas.height / 2 + 30 };
            
            boss.draw(ctx);

            requestRef.current = requestAnimationFrame(render);
        };

        requestRef.current = requestAnimationFrame(render);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [currentIndex]);

    const currentMap = MAP_PROGRESSION[currentIndex];
    const currentWeapon = bossWeapons[currentIndex];
    const weaponInfo = WEAPON_CONFIGS[currentWeapon];

    return (
        <div className="absolute inset-0 bg-black/98 z-[100] flex flex-col items-center justify-center p-12 animate-in fade-in zoom-in duration-300">
            <button 
                onClick={onClose}
                className="absolute top-12 right-12 text-neutral-500 hover:text-white transition-colors"
            >
                <X className="w-12 h-12" />
            </button>

            <div className="text-center mb-8">
                <div className="text-cyan-400 font-black tracking-[0.5em] text-sm mb-2">INTELLIGENCE REPORT: BOSS SECTOR {currentIndex + 1}</div>
                <h2 className="text-8xl font-black italic tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                    {currentMap.bossName}
                </h2>
            </div>

            <div className="flex items-center gap-12 w-full max-w-7xl">
                <button 
                    onClick={() => setCurrentIndex(prev => (prev > 0 ? prev - 1 : 9))}
                    className="p-4 bg-white/5 rounded-full hover:bg-white/10 text-white transition-all"
                >
                    <ChevronLeft className="w-16 h-16" />
                </button>

                <div className="flex-1 relative aspect-video bg-neutral-900/50 rounded-[4rem] border-4 border-neutral-800 overflow-hidden shadow-inner group">
                    <canvas ref={canvasRef} width={1200} height={800} className="w-full h-full object-contain" />
                    
                    {/* Boss Stats Overlay */}
                    <div className="absolute bottom-12 left-12 flex flex-col gap-4">
                        <div className="flex items-center gap-4 bg-black/60 backdrop-blur-xl px-8 py-4 rounded-3xl border border-white/10">
                            <Zap className="w-8 h-8 text-yellow-400" />
                            <div>
                                <div className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Armament</div>
                                <div className="text-2xl font-black italic text-white">{weaponInfo.name}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-black/60 backdrop-blur-xl px-8 py-4 rounded-3xl border border-white/10">
                            <Target className="w-8 h-8 text-red-500" />
                            <div>
                                <div className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Tactical Note</div>
                                <div className="text-lg font-bold italic text-neutral-300">{currentMap.bossLogic}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => setCurrentIndex(prev => (prev < 9 ? prev + 1 : 0))}
                    className="p-4 bg-white/5 rounded-full hover:bg-white/10 text-white transition-all"
                >
                    <ChevronRight className="w-16 h-16" />
                </button>
            </div>

            <div className="mt-12 flex gap-3">
                {MAP_PROGRESSION.map((_, i) => (
                    <button 
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`w-4 h-4 rounded-full transition-all ${i === currentIndex ? 'bg-white scale-150 shadow-[0_0_15px_white]' : 'bg-neutral-800'}`}
                    />
                ))}
            </div>
        </div>
    );
};
