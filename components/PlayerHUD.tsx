
import React from 'react';
import { User, Heart, ThermometerSnowflake, Zap } from 'lucide-react';
import { WeaponType } from '../types';
import { MAX_WEAPON_LEVEL } from '../constants';

export interface PlayerHUDState {
    lives: number;
    weaponLevel: number;
    isDead: boolean;
    active: boolean;
    weaponType: WeaponType;
    primaryColor: string;
    glowColor: string;
    overload: number;
    isOverheated: boolean;
}

interface PlayerHUDProps {
    state: PlayerHUDState;
    isLeft: boolean;
    label: string;
}

export const PlayerHUD: React.FC<PlayerHUDProps> = ({ state, isLeft, label }) => {
    if (!state.active) return null;

    return (
        <div className={`absolute bottom-10 ${isLeft ? 'left-10' : 'right-10'} flex flex-col ${isLeft ? 'items-start' : 'items-end'} pointer-events-none z-10 select-none`}>
            {/* Player Name */}
            <div className="flex items-center gap-3 text-cyan-400 font-black italic text-2xl mb-1 uppercase tracking-tighter">
                <User className="w-6 h-6" /> {label}
            </div>

            {state.isDead ? (
                <div className="text-red-500 font-black text-4xl italic animate-pulse">CRITICAL FAILURE</div>
            ) : (
                <div className="flex flex-col gap-4">
                    {/* Lives Counter: 14 x [Heart] */}
                    <div className="flex items-center gap-3">
                        <span className="text-4xl font-black text-red-500 italic drop-shadow-lg">
                            {state.lives} x
                        </span>
                        <Heart className="w-10 h-10 text-red-500 fill-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                    </div>

                    {/* Weapon Heat Core Bar */}
                    <div className="flex flex-col gap-1 w-72">
                        <div className="flex items-center gap-2 text-[11px] font-black text-cyan-400/80 uppercase tracking-widest italic">
                           <ThermometerSnowflake className="w-3 h-3" /> Weapon Heat Core
                        </div>
                        <div className="h-4 w-full bg-neutral-900/80 border-2 border-neutral-800 overflow-hidden relative">
                            <div 
                                className={`h-full transition-all duration-100 ${state.isOverheated ? 'bg-red-500 animate-pulse' : 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]'}`}
                                style={{ width: `${state.overload}%` }}
                            />
                        </div>
                    </div>

                    {/* Weapon Level: Segmented dots */}
                    <div className="flex flex-col gap-1 w-72">
                        <div className="flex items-center gap-2 text-cyan-400 font-black italic text-xl">
                           <Zap className="w-5 h-5 fill-cyan-400" /> WEP LV.{state.weaponLevel}
                        </div>
                        <div className="flex gap-1.5 mt-1">
                            {[...Array(MAX_WEAPON_LEVEL)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`w-4 h-5 border border-white/5 transition-all ${i < state.weaponLevel ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]' : 'bg-neutral-900/50'}`} 
                                />
                            ))}
                        </div>
                    </div>

                    {/* Sub-label */}
                    <div className="text-[12px] font-black text-neutral-500 uppercase italic tracking-widest mt-1">
                        {state.weaponType} SYSTEMS OVERDRIVE
                    </div>
                </div>
            )}
        </div>
    );
};
