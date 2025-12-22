
import React from 'react';
import { Trophy, ChevronRight } from 'lucide-react';

interface LevelCompleteOverlayProps {
    sector: number;
    score: number;
    onNextLevel: () => void;
}

export const LevelCompleteOverlay: React.FC<LevelCompleteOverlayProps> = ({ sector, score, onNextLevel }) => {
    return (
        <div className="absolute inset-0 bg-cyan-950/95 flex flex-col items-center justify-center text-white z-50 animate-in fade-in duration-700">
            <div className="text-yellow-400 mb-6 animate-bounce drop-shadow-[0_0_40px_rgba(250,204,21,0.6)]">
                <Trophy className="w-32 h-32" />
            </div>
            
            <h2 className="text-[6rem] font-black italic mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-300 drop-shadow-2xl">
                SECTOR {sector} CLEARED
            </h2>
            
            <div className="text-center mb-12 bg-black/40 px-24 py-12 rounded-[3rem] border-2 border-cyan-500/30 backdrop-blur-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)]">
                <div className="text-sm font-black uppercase tracking-[0.4em] text-cyan-400 mb-2">Operation Score</div>
                <div className="text-8xl font-black font-mono tracking-tighter text-white">
                    {score.toLocaleString()}
                </div>
            </div>

            <button 
                onClick={onNextLevel}
                className="group flex items-center gap-6 bg-cyan-500 text-black px-24 py-8 rounded-full font-black text-4xl hover:bg-white transition-all hover:scale-110 active:scale-95 shadow-[0_0_40px_rgba(6,182,212,0.5)]"
            >
                PROCEED TO NEXT SECTOR <ChevronRight className="w-10 h-10 group-hover:translate-x-3 transition-transform" />
            </button>
        </div>
    );
};
