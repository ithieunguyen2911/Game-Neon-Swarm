
import React from 'react';
import { User, Users, Skull, Heart, Zap, ThermometerSnowflake, AlertTriangle } from 'lucide-react';
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
    // Màu sắc thanh Overload dựa trên mức nhiệt
    const getOverloadColor = () => {
        if (state.isOverheated) return '#ef4444'; // Đỏ rực khi quá nhiệt
        if (state.overload > 70) return '#f97316'; // Cam khi sắp quá tải
        if (state.overload > 40) return '#facc15'; // Vàng khi nóng
        return '#22d3ee'; // Xanh cyan khi mát
    };

    const overloadColor = getOverloadColor();

    return (
        <div className={`absolute bottom-8 ${isLeft ? 'left-8' : 'right-8'} flex flex-col ${isLeft ? 'items-start' : 'items-end'} pointer-events-none z-10`}>
            <div className={`text-2xl font-black italic mb-2 flex items-center gap-2`} style={{ color: state.glowColor }}>
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
                                        className={`w-8 h-8 transition-all ${i < state.lives ? 'fill-current drop-shadow-[0_0_10px_rgba(239,68,68,0.7)]' : 'text-neutral-800'}`} 
                                        style={{ color: i < state.lives ? '#ef4444' : '' }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                                <span className="text-3xl font-black text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.7)]">
                                    {state.lives}
                                </span>
                                <span className="text-xl font-bold text-red-400">X</span>
                                <Heart className="w-10 h-10 text-red-500 fill-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.7)] animate-pulse" />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* Overload Bar (Thanh Quá Tải) */}
                        <div className={`flex flex-col ${isLeft ? 'items-start' : 'items-end'} gap-1 w-64`}>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                                {state.isOverheated ? (
                                    <span className="text-red-500 flex items-center gap-1 animate-pulse">
                                        <AlertTriangle className="w-3 h-3" /> SYSTEM OVERHEATED - RECOVERING
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1">
                                        <ThermometerSnowflake className="w-3 h-3" /> Weapon Heat Core
                                    </span>
                                )}
                            </div>
                            <div className="w-full h-3 bg-neutral-900 rounded-full border border-neutral-800 overflow-hidden relative shadow-inner">
                                <div 
                                    className={`h-full transition-all duration-75 ${state.isOverheated ? 'animate-pulse' : ''}`}
                                    style={{ 
                                        width: `${state.overload}%`, 
                                        backgroundColor: overloadColor,
                                        boxShadow: `0 0 15px ${overloadColor}88`
                                    }}
                                />
                            </div>
                        </div>

                        {/* Weapon Level Bar */}
                        <div className={`flex items-center gap-3 ${!isLeft ? 'flex-row-reverse' : ''}`}>
                            <Zap className={`w-5 h-5`} style={{ color: state.glowColor }} />
                            <span className="text-xl font-black italic mr-2" style={{ color: state.glowColor }}>WEP LV.{state.weaponLevel}</span>
                            <div className="flex gap-0.5">
                                {[...Array(MAX_WEAPON_LEVEL)].map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`w-2.5 h-4 rounded-sm transition-all ${i < state.weaponLevel ? 'shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'bg-neutral-800'}`} 
                                        style={{ backgroundColor: i < state.weaponLevel ? state.glowColor : '' }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className={`${isLeft ? 'text-left' : 'text-right'} text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] italic`}>
                            {state.weaponType} SYSTEMS OVERDRIVE
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
