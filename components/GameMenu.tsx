
import React from 'react';
import { Play, Users, User } from 'lucide-react';
import { COLOR_PALETTE } from '../constants';

interface GameMenuProps {
    highScore: number;
    p1ColorIdx: number;
    p2ColorIdx: number;
    setP1ColorIdx: (idx: number) => void;
    setP2ColorIdx: (idx: number) => void;
    onStartSolo: () => void;
    onStartCoop: () => void;
}

export const GameMenu: React.FC<GameMenuProps> = ({
    highScore,
    p1ColorIdx,
    p2ColorIdx,
    setP1ColorIdx,
    setP2ColorIdx,
    onStartSolo,
    onStartCoop
}) => {
    return (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-white z-40 p-8">
            <div className="relative mb-8 text-center">
                <h1 className="text-[10rem] font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-white to-cyan-600 animate-pulse drop-shadow-[0_0_80px_rgba(6,182,212,0.5)] leading-tight">
                    NEON SWARM
                </h1>
                <div className="text-2xl font-light tracking-[0.8em] text-cyan-400/60 uppercase">OVERDRIVE ARCADE</div>
            </div>
            
            <div className="grid grid-cols-2 gap-12 max-w-6xl w-full">
                {/* P1 Section */}
                <div className="flex flex-col items-center p-8 bg-neutral-900/40 border border-neutral-800 rounded-[3rem] shadow-2xl backdrop-blur-md">
                    <div className="flex items-center gap-3 text-cyan-400 font-black italic text-2xl mb-6">
                        <User className="w-6 h-6" /> PLAYER 1 CONFIG
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 mb-8">
                        {COLOR_PALETTE.map((c, i) => (
                            <button 
                                key={i} 
                                onClick={() => setP1ColorIdx(i)}
                                className={`w-12 h-12 rounded-full border-2 transition-all hover:scale-110 ${p1ColorIdx === i ? 'border-white scale-125 shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'border-transparent opacity-50'}`}
                                style={{ backgroundColor: c.primary }}
                            />
                        ))}
                    </div>
                    <button 
                        onClick={onStartSolo}
                        className="w-full flex items-center justify-center gap-4 bg-cyan-600 text-white px-10 py-6 rounded-2xl font-black text-3xl hover:bg-cyan-500 transition-all hover:scale-105 shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                    >
                        <Play className="w-8 h-8 fill-white" /> SOLO MISSION
                    </button>
                </div>

                {/* P2 Section */}
                <div className="flex flex-col items-center p-8 bg-neutral-900/40 border border-neutral-800 rounded-[3rem] shadow-2xl backdrop-blur-md">
                    <div className="flex items-center gap-3 text-emerald-400 font-black italic text-2xl mb-6">
                        <Users className="w-6 h-6" /> PLAYER 2 CONFIG
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 mb-8">
                        {COLOR_PALETTE.map((c, i) => (
                            <button 
                                key={i} 
                                onClick={() => setP2ColorIdx(i)}
                                className={`w-12 h-12 rounded-full border-2 transition-all hover:scale-110 ${p2ColorIdx === i ? 'border-white scale-125 shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'border-transparent opacity-50'}`}
                                style={{ backgroundColor: c.primary }}
                            />
                        ))}
                    </div>
                    <button 
                        onClick={onStartCoop}
                        className="w-full flex items-center justify-center gap-4 bg-emerald-600 text-white px-10 py-6 rounded-2xl font-black text-3xl hover:bg-emerald-500 transition-all hover:scale-105 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                    >
                        <Users className="w-8 h-8 fill-white" /> CO-OP DEPLOY
                    </button>
                </div>
            </div>
            
            <div className="mt-12 text-neutral-600 font-mono text-sm uppercase tracking-[0.6em] animate-pulse">
                Current Record: {highScore.toLocaleString()} pts
            </div>
        </div>
    );
};
