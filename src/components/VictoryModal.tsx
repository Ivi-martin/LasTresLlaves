import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';

interface VictoryModalProps {
  score: number;
  kills: number;
  onPlayAgain: () => void;
  onExitToMenu: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  score,
  kills,
  onPlayAgain,
  onExitToMenu,
}) => {
  useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-gradient-to-b from-[#1b261b] to-[#0c140c] border-2 border-emerald-500 rounded-2xl p-6 shadow-2xl text-center text-slate-100 space-y-4">
        <div className="text-5xl animate-bounce">👑</div>
        <h2 className="text-2xl md:text-3xl font-black text-emerald-400 font-mono tracking-widest uppercase">
          ¡VICTORIA TOTAL!
        </h2>
        <p className="text-xs text-slate-300">
          ¡Has derrotado a los tres titanes ancestrales y conquistado las tres llaves! Tu nombre será grabado en los anales de la historia.
        </p>

        {/* Stats summary */}
        <div className="bg-black/60 border border-emerald-900/40 rounded-xl p-3.5 space-y-2 text-left font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Reinos Conquistados:</span>
            <span className="font-bold text-emerald-400">Bosque, Cripta y Magma</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Bajas de Monstruos:</span>
            <span className="font-bold text-amber-300">{kills}</span>
          </div>
          <div className="flex justify-between border-t border-slate-800 pt-1.5">
            <span className="text-slate-400">Puntuación de Leyenda:</span>
            <span className="font-black text-sm text-yellow-300">{score.toLocaleString()} pts</span>
          </div>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => {
              sound.click();
              onPlayAgain();
            }}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black font-mono text-sm rounded-xl shadow-lg transition cursor-pointer"
          >
            🔥 JUGAR DE NUEVO (NUEVA DIFICULTAD)
          </button>

          <button
            onClick={() => {
              sound.click();
              onExitToMenu();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold font-mono text-xs rounded-xl border border-slate-700 transition cursor-pointer"
          >
            🏆 SALIR AL MENÚ PRINCIPAL
          </button>
        </div>
      </div>
    </div>
  );
};
