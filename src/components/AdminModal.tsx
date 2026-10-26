import React, { useState } from 'react';
import { sound } from '../utils/audio';

interface AdminModalProps {
  currentPhase: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectPhase: (phase: number) => void;
  onEnterBossCave?: () => void;
  onInstantKeys?: () => void;
  onToggleGodMode?: (enabled: boolean) => void;
  isGodMode?: boolean;
  onUnlockAllPhases?: () => void;
  onAddCheats?: () => void;
  onKillBoss?: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  currentPhase,
  isOpen,
  onClose,
  onSelectPhase,
  onEnterBossCave,
  onInstantKeys,
  onToggleGodMode,
  isGodMode = false,
  onUnlockAllPhases,
  onAddCheats,
  onKillBoss,
}) => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('martin_admin_auth') === 'true';
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === '1234') {
      sound.levelUp();
      setIsAuthenticated(true);
      sessionStorage.setItem('martin_admin_auth', 'true');
      setErrorMsg('');
      setFeedbackMsg('Acceso de Administrador autorizado.');
    } else {
      sound.hurt();
      setErrorMsg('Clave incorrecta. La clave por defecto es 1234.');
    }
  };

  const notifyAction = (msg: string) => {
    sound.click();
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-gradient-to-b from-[#1c1d24] via-[#12131a] to-[#0a0b10] border-2 border-amber-500/80 rounded-2xl p-6 shadow-[0_0_40px_rgba(245,158,11,0.25)] text-slate-100 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛠️</span>
            <div>
              <h2 className="text-lg font-black text-amber-400 font-mono tracking-wider uppercase">
                Panel Administrador / Dev
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                {isAuthenticated ? 'Sesión Autorizada · Modo Desarrollador' : 'Clave requerida por defecto: 1234'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Login Form if not authenticated */}
        {!isAuthenticated ? (
          <form onSubmit={handleLogin} className="space-y-4 py-2">
            <p className="text-xs text-slate-300 leading-relaxed">
              Ingresa la clave de administrador para acceder a la selección libre de fases y herramientas de desarrollo.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-amber-300 uppercase tracking-wider block font-bold">
                Clave de Acceso (Por defecto: 1234)
              </label>
              <div className="relative">
                <input
                  type="password"
                  autoFocus
                  maxLength={10}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Ingresa 1234..."
                  className="w-full px-4 py-2.5 bg-slate-950/90 border border-amber-500/50 focus:border-amber-400 rounded-xl font-mono text-center text-lg tracking-widest text-amber-300 outline-none shadow-inner"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="text-xs text-red-400 font-mono bg-red-950/60 border border-red-800/80 rounded-lg p-2 text-center">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black font-mono text-xs rounded-xl shadow-lg transition cursor-pointer"
              >
                INGRESAR AL PANEL
              </button>
              <button
                type="button"
                onClick={() => setPin('1234')}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-mono rounded-xl border border-slate-700 transition cursor-pointer"
                title="Rellenar 1234"
              >
                Autocompletar
              </button>
            </div>
          </form>
        ) : (
          /* Authenticated Dev Controls */
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {feedbackMsg && (
              <div className="text-xs text-emerald-300 font-mono bg-emerald-950/60 border border-emerald-600/60 rounded-lg p-2 text-center animate-fade-in">
                ✓ {feedbackMsg}
              </div>
            )}

            {/* Phase Selector */}
            <div className="bg-black/50 border border-amber-500/30 rounded-xl p-3 space-y-2">
              <span className="text-[11px] font-bold text-amber-300 font-mono uppercase tracking-wider block">
                🚀 Salto Directo a Fase:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { phase: 1, name: '1. Bosque', icon: '🌲' },
                  { phase: 2, name: '2. Cripta', icon: '🏛️' },
                  { phase: 3, name: '3. Magma', icon: '🌋' },
                ].map((item) => (
                  <button
                    key={item.phase}
                    onClick={() => {
                      onSelectPhase(item.phase);
                      notifyAction(`Saltando a la Fase ${item.phase}`);
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-mono font-bold flex flex-col items-center gap-1 border transition cursor-pointer active:scale-95 ${
                      currentPhase === item.phase
                        ? 'bg-amber-600/80 border-amber-400 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Boss Cave Warp Section */}
            {onEnterBossCave && (
              <div className="bg-black/50 border border-purple-500/40 rounded-xl p-3 space-y-2">
                <span className="text-[11px] font-bold text-purple-300 font-mono uppercase tracking-wider block">
                  🚪 Acceso Directo a la Cueva del Jefe:
                </span>
                <p className="text-[11px] text-slate-400">
                  Entra inmediatamente en la casa / cueva del jefe de la fase actual sin necesidad de recolectar las 3 llaves.
                </p>
                <button
                  onClick={() => {
                    onEnterBossCave();
                    notifyAction('Teletransportando adentro de la Cueva del Jefe...');
                    onClose();
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 active:scale-95 text-white font-black font-mono text-xs rounded-xl shadow-lg border border-purple-400/50 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>⚔️</span>
                  <span>ENTRAR DIRECTO A LA CUEVA / CASA DEL JEFE</span>
                </button>
              </div>
            )}

            {/* Gameplay Test Tools */}
            <div className="bg-black/50 border border-slate-800 rounded-xl p-3 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 font-mono uppercase tracking-wider block">
                ⚡ Herramientas de Testeo y Desarrollo:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {onToggleGodMode && (
                  <button
                    onClick={() => {
                      onToggleGodMode(!isGodMode);
                      notifyAction(isGodMode ? 'Modo Dios desactivado' : 'Modo Dios activado (Inmortal)');
                    }}
                    className={`p-2 rounded-xl border font-bold transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 ${
                      isGodMode
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>🛡️</span>
                    <span>Modo Dios: {isGodMode ? 'ON' : 'OFF'}</span>
                  </button>
                )}

                {onInstantKeys && (
                  <button
                    onClick={() => {
                      onInstantKeys();
                      notifyAction('¡Las 3 llaves recogidas al instante!');
                    }}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-600/50 text-amber-300 font-bold transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>🗝️</span>
                    <span>3 Llaves al Instante</span>
                  </button>
                )}

                {onUnlockAllPhases && (
                  <button
                    onClick={() => {
                      onUnlockAllPhases();
                      notifyAction('¡Fases 1, 2 y 3 desbloqueadas permanentemente!');
                    }}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-blue-600/50 text-blue-300 font-bold transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>🔓</span>
                    <span>Desbloquear Todo</span>
                  </button>
                )}

                {onAddCheats && (
                  <button
                    onClick={() => {
                      onAddCheats();
                      notifyAction('+10 Bombas y +1000 Monedas otorgadas');
                    }}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-yellow-600/50 text-yellow-300 font-bold transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>💣</span>
                    <span>+10 Bombas & Oro</span>
                  </button>
                )}

                {onKillBoss && (
                  <button
                    onClick={() => {
                      onKillBoss();
                      notifyAction('Jefe derrotado al instante');
                      onClose();
                    }}
                    className="col-span-2 p-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-700/60 text-red-300 font-bold transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>💀</span>
                    <span>Derrotar Jefe Actual al Instante</span>
                  </button>
                )}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold font-mono text-xs rounded-xl border border-slate-700 transition cursor-pointer"
            >
              CERRAR PANEL
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
