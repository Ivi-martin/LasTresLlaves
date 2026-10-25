import React from 'react';
import { sound } from '../utils/audio';

interface GameOverModalProps {
  score: number;
  phase: number;
  kills: number;
  onRetry: () => void;
  onExitToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  phase,
  kills,
  onRetry,
  onExitToMenu,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-gradient-to-b from-[#241315] to-[#12090a] border-2 border-red-600 rounded-2xl p-6 shadow-2xl text-center text-slate-100 space-y-4">
        <div className="text-4xl">💀</div>
        <h2 className="text-2xl md:text-3xl font-black text-red-500 font-mono tracking-widest uppercase">
          HAS CAÍDO EN COMBATE
        </h2>
        <p className="text-xs text-slate-400">
          Los guardianes de las llaves reclaman tu alma. Pero la experiencia y el oro que has ganado perduran.
        </p>

        {/* Stats summary */}
        <div className="bg-black/60 border border-red-900/40 rounded-xl p-3.5 space-y-2 text-left font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Fase Alcanzada:</span>
            <span className="font-bold text-amber-400">Fase {phase}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Enemigos Eliminados:</span>
            <span className="font-bold text-red-300">{kills}</span>
          </div>
          <div className="flex justify-between border-t border-slate-800 pt-1.5">
            <span className="text-slate-400">Puntuación Final:</span>
            <span className="font-black text-sm text-yellow-300">{score.toLocaleString()} pts</span>
          </div>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => {
              sound.click();
              onRetry();
            }}
            className="w-full py-3 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black font-mono text-sm rounded-xl shadow-lg transition cursor-pointer"
          >
            🔄 REINTENTAR FASE
          </button>

          <button
            onClick={() => {
              sound.click();
              onExitToMenu();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold font-mono text-xs rounded-xl border border-slate-700 transition cursor-pointer"
          >
            🚪 VOLVER AL MENÚ PRINCIPAL
          </button>
        </div>
      </div>
    </div>
  );
};
