
import React from 'react';
import { Skull, RotateCcw } from 'lucide-react';

interface GameOverOverlayProps {
    score: number;
    onRestart: () => void;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({ score, onRestart }) => {
    return (
        <div className="absolute inset-0 bg-red-950/98 flex flex-col items-center justify-center text-white z-50 animate-in fade-in duration-1000">
            <div className="text-red-500 mb-6 animate-bounce drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                <Skull className="w-28 h-28" />
            </div>
            <h2 className="text-[8rem] font-black italic mb-2 tracking-tighter drop-shadow-2xl">MISSION FAILED</h2>
            <div className="text-center mb-12 bg-black/40 px-20 py-10 rounded-3xl border border-red-500/20 backdrop-blur-xl">
                <div className="text-8xl font-black font-mono tracking-tighter text-red-500">{score.toLocaleString()}</div>
            </div>
            <button 
                onClick={onRestart}
                className="group flex items-center gap-6 bg-white text-black px-20 py-6 rounded-full font-black text-3xl hover:bg-neutral-200 transition-all hover:scale-105 active:scale-95"
            >
                <RotateCcw className="w-8 h-8 group-hover:rotate-180 transition-transform duration-700" /> RESTART MISSION
            </button>
        </div>
    );
};
