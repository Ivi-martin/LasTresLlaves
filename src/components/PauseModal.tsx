import React from 'react';
import { sound } from '../utils/audio';

interface PauseModalProps {
  onResume: () => void;
  onOpenSettings: () => void;
  onExitToMenu: () => void;
  onOpenAdmin?: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onOpenSettings,
  onExitToMenu,
  onOpenAdmin,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-gradient-to-b from-[#1b221a] to-[#0e130f] border-2 border-amber-600 rounded-2xl p-6 shadow-2xl text-center text-slate-100 space-y-4">
        <h2 className="text-2xl font-black text-amber-400 font-mono tracking-widest uppercase">
          JUEGO EN PAUSA
        </h2>
        <p className="text-xs text-slate-400">
          La partida está congelada. Ajusta tus opciones o regresa cuando quieras.
        </p>

        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => {
              sound.click();
              onResume();
            }}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black font-mono text-sm rounded-xl shadow-lg transition cursor-pointer"
          >
            ▶️ REANUDAR PARTIDA [ESC]
          </button>

          <button
            onClick={() => {
              sound.click();
              onOpenSettings();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold font-mono text-xs rounded-xl border border-slate-700 transition cursor-pointer"
          >
            ⚙️ AJUSTES Y RENDIMIENTO
          </button>

          {onOpenAdmin && (
            <button
              onClick={() => {
                sound.click();
                onOpenAdmin();
              }}
              className="w-full py-2.5 bg-amber-950/70 hover:bg-amber-900/90 active:scale-95 text-amber-300 font-bold font-mono text-xs rounded-xl border border-amber-600/60 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>🛠️</span>
              <span>MODO ADMIN / DEV (1234)</span>
            </button>
          )}

          <button
            onClick={() => {
              sound.click();
              onExitToMenu();
            }}
            className="w-full py-2.5 bg-red-950/60 hover:bg-red-900/80 active:scale-95 text-red-300 font-bold font-mono text-xs rounded-xl border border-red-800/60 transition cursor-pointer"
          >
            🚪 SALIR AL MENÚ PRINCIPAL
          </button>
        </div>
      </div>
    </div>
  );
};
