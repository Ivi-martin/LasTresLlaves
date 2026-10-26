import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types/game';
import { StorageManager, DEFAULT_SKINS, DEFAULT_HATS } from '../utils/storage';
import { sound } from '../utils/audio';

interface LeaderboardModalProps {
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ onClose }) => {
  const [tab, setTab] = useState<'global' | 'weekly' | 'friends'>('global');
  const [entries, setEntries] = useState<LeaderboardEntry[]>(StorageManager.getLeaderboard());
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [playerName, setPlayerName] = useState<string>(StorageManager.getPlayerName());
  const [isEditingName, setIsEditingName] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSaveName = () => {
    sound.click();
    StorageManager.setPlayerName(playerName);
    setIsEditingName(false);
    setEntries(StorageManager.getLeaderboard());
  };

  const getFilteredEntries = () => {
    if (tab === 'weekly') {
      return entries.filter((_, idx) => idx % 2 === 0);
    }
    if (tab === 'friends') {
      return entries.filter((e) => e.isPlayer || ['SombrasX', 'Artemisa_Pro', 'TitanHunter'].includes(e.name));
    }
    return entries;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-gradient-to-b from-[#1b221a] to-[#0e130f] border-2 border-amber-600 rounded-2xl p-6 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-600/30 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-amber-400 tracking-wide">
                TABLA DE CLASIFICACIÓN GLOBAL
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className="text-xs text-slate-400 font-mono">
                  {isOnline ? '🟢 Conectado a la Red Global' : '🟡 Modo Offline (Sincronización Local Activa)'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              sound.click();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Player Profile Alias bar */}
        <div className="flex items-center justify-between bg-black/40 border border-slate-800 rounded-xl p-3 px-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Tu Alias en el Ranking:</span>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={15}
                  className="bg-slate-900 border border-amber-500 rounded px-2.5 py-0.5 text-sm text-white font-bold outline-none"
                />
                <button
                  onClick={handleSaveName}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-2.5 py-1 rounded cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-amber-300">{playerName}</span>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Editar
                </button>
              </div>
            )}
          </div>
          <span className="text-xs font-mono text-purple-300">
            Mejor Puntuación: {StorageManager.getStats().highScore.toLocaleString()}
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-4">
          <button
            onClick={() => {
              sound.click();
              setTab('global');
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              tab === 'global' ? 'bg-amber-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white'
            }`}
          >
            🌍 Global (Histórico)
          </button>
          <button
            onClick={() => {
              sound.click();
              setTab('weekly');
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              tab === 'weekly' ? 'bg-amber-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Desafío Semanal
          </button>
          <button
            onClick={() => {
              sound.click();
              setTab('friends');
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              tab === 'friends' ? 'bg-amber-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white'
            }`}
          >
            👥 Amigos y Rivales
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="w-full space-y-2">
            {getFilteredEntries().map((entry, idx) => {
              const skin = DEFAULT_SKINS.find((s) => s.id === entry.avatarSkin) || DEFAULT_SKINS[0];
              const hat = DEFAULT_HATS.find((h) => h.id === entry.avatarHat);
              const isTop3 = idx < 3;

              return (
                <div
                  key={entry.id || idx}
                  className={`flex items-center justify-between p-3 rounded-xl border transition ${
                    entry.isPlayer
                      ? 'bg-amber-600/20 border-amber-400 ring-2 ring-amber-400/40'
                      : isTop3
                      ? 'bg-slate-900/80 border-amber-500/40 shadow-md'
                      : 'bg-slate-900/40 border-slate-800'
                  }`}
                >
                  {/* Left: Rank & Player info */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                        idx === 0
                          ? 'bg-yellow-500 text-slate-950 shadow-yellow-500/50 shadow-lg'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-950'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400 font-mono'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg border border-slate-700 flex items-center justify-center text-xs shrink-0"
                        style={{ backgroundColor: skin.secondaryColor }}
                      >
                        {hat?.drawType === 'crown' ? '👑' : hat?.drawType === 'horns' ? '🪖' : '🤠'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-bold ${
                              entry.isPlayer ? 'text-amber-300' : 'text-slate-200'
                            }`}
                          >
                            {entry.name}
                          </span>
                          {entry.isPlayer && (
                            <span className="text-[10px] bg-amber-500/30 text-amber-300 px-1.5 py-0.2 rounded font-mono font-bold">
                              TÚ
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Nivel {entry.level} · Fase {entry.phaseReached} · {entry.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Score */}
                  <div className="text-right">
                    <span className="text-base font-black font-mono text-amber-400 block tabular-nums">
                      {entry.score.toLocaleString()} pts
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      ⏱️ {Math.floor(entry.timeSeconds / 60)}m {entry.timeSeconds % 60}s
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Las puntuaciones se guardan localmente y se sincronizan al volver a conectar.</span>
          <button
            onClick={() => {
              sound.click();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
