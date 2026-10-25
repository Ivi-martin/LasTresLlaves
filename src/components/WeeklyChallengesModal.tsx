import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { WeeklyChallenge } from '../types/game';
import { StorageManager } from '../utils/storage';
import { sound } from '../utils/audio';
import { notificationService } from '../utils/notifications';

interface WeeklyChallengesModalProps {
  onClose: () => void;
  onRewardClaimed: (rewardGold: number, rewardXp: number) => void;
}

export const WeeklyChallengesModal: React.FC<WeeklyChallengesModalProps> = ({
  onClose,
  onRewardClaimed,
}) => {
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>(StorageManager.getWeeklyChallenges());

  const handleClaim = (challenge: WeeklyChallenge) => {
    if (!challenge.completed || challenge.claimed) return;

    sound.purchase();
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });

    const updated = challenges.map((c) => (c.id === challenge.id ? { ...c, claimed: true } : c));
    setChallenges(updated);
    StorageManager.saveWeeklyChallenges(updated);

    StorageManager.addXpAndGold(challenge.rewardXp, challenge.rewardGold);
    onRewardClaimed(challenge.rewardGold, challenge.rewardXp);

    notificationService.emitToast(
      '¡Desafío Semanal Completado!',
      `Has ganado ${challenge.rewardGold} Oro y ${challenge.rewardXp} XP por: "${challenge.title}"`,
      'challenge'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-gradient-to-b from-[#1b221a] to-[#0e130f] border-2 border-amber-600 rounded-2xl p-6 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-600/30 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎯</span>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-amber-400 tracking-wide">
                DESAFÍOS SEMANALES
              </h2>
              <p className="text-xs md:text-sm text-slate-400">
                Supera pruebas especiales cada semana para ganar grandes botes de oro y experiencia.
              </p>
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

        {/* Reset Countdown Bar */}
        <div className="flex items-center justify-between bg-black/40 border border-slate-800 rounded-xl p-3 px-4 mb-5">
          <span className="text-xs font-mono text-slate-400">
            ⏳ Próximo reinicio de desafíos: <strong className="text-amber-400">En 3 días y 14 horas</strong>
          </span>
          <span className="text-xs font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
            Temporada 1
          </span>
        </div>

        {/* Challenge List */}
        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
          {challenges.map((c) => {
            const pct = Math.min(100, Math.round((c.current / c.target) * 100));

            return (
              <div
                key={c.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                  c.claimed
                    ? 'bg-slate-900/40 border-slate-800 opacity-60'
                    : c.completed
                    ? 'bg-emerald-950/30 border-emerald-500/60 ring-1 ring-emerald-500/40'
                    : 'bg-slate-900/70 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-200">{c.title}</h4>
                      {c.completed && !c.claimed && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.2 rounded font-bold">
                          ¡COMPLETO!
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-amber-400 block">
                      +{c.rewardGold} 🪙 · +{c.rewardXp} XP
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 mt-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Progreso:</span>
                    <span className="text-slate-200 font-bold tabular-nums">
                      {c.current} / {c.target} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        c.completed
                          ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                          : 'bg-gradient-to-r from-amber-600 to-yellow-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Claim Button */}
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex justify-end">
                  {c.claimed ? (
                    <span className="text-xs font-bold font-mono text-slate-500">✓ Recompensa Reclamada</span>
                  ) : c.completed ? (
                    <button
                      onClick={() => handleClaim(c)}
                      className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition active:scale-95 shadow-md cursor-pointer"
                    >
                      🎁 RECLAMAR RECOMPENSA
                    </button>
                  ) : (
                    <span className="text-xs font-mono text-slate-500">En progreso...</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
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
