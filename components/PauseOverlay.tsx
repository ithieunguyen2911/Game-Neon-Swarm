
import React from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';

interface PauseOverlayProps {
    onResume: () => void;
    onQuit: () => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({ onResume, onQuit }) => {
    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in duration-300">
            <div className="flex items-center gap-4 text-white mb-12">
                <Pause className="w-16 h-16 text-cyan-400 fill-cyan-400" />
                <h2 className="text-8xl font-black italic tracking-tighter">PAUSED</h2>
            </div>
            <div className="flex flex-col gap-6">
                <button 
                    onClick={onResume}
                    className="flex items-center justify-center gap-4 bg-cyan-600 text-white px-20 py-6 rounded-2xl font-black text-3xl hover:bg-cyan-500 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(6,182,212,0.4)]"
                >
                    <Play className="w-8 h-8 fill-white" /> RESUME MISSION
                </button>
                <button 
                    onClick={onQuit}
                    className="flex items-center justify-center gap-4 bg-neutral-900 border border-neutral-700 text-neutral-400 px-20 py-6 rounded-2xl font-black text-2xl hover:bg-neutral-800 transition-all"
                >
                    <RotateCcw className="w-6 h-6" /> QUIT TO MENU
                </button>
            </div>
        </div>
    );
};
