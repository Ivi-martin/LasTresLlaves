import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { DailyRewardsState } from '../types/game';
import { StorageManager } from '../utils/storage';
import { sound } from '../utils/audio';
import { notificationService } from '../utils/notifications';

interface DailyRewardsModalProps {
  onClose: () => void;
  onRewardClaimed: (rewardText: string, goldAdded: number) => void;
}

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({ onClose, onRewardClaimed }) => {
  const [dailyState, setDailyState] = useState<DailyRewardsState>(StorageManager.getDailyRewards());
  const { canClaim, nextDayIndex, streak } = StorageManager.canClaimDailyReward();
  const [claimResult, setClaimResult] = useState<string | null>(null);

  const handleClaim = () => {
    const res = StorageManager.claimDailyReward();
    if (res.success) {
      sound.purchase();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      setDailyState(StorageManager.getDailyRewards());
      setClaimResult(`¡Reclamado: ${res.rewardText}!`);
      onRewardClaimed(res.rewardText, res.goldAdded);

      notificationService.emitToast(
        '¡Recompensa Reclamada!',
        `Has avanzado tu racha a ${streak + 1} días consecutivos.`,
        'reward'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-gradient-to-b from-[#1b221a] to-[#0e130f] border-2 border-amber-600 rounded-2xl p-6 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-600/30 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎁</span>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-amber-400 tracking-wide">
                RECOMPENSAS DIARIAS
              </h2>
              <p className="text-xs md:text-sm text-slate-400">
                Inicia sesión cada día para mantener tu racha y desbloquear accesorios exclusivos.
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

        {/* Streak Counter */}
        <div className="flex items-center justify-between bg-black/40 border border-amber-500/30 rounded-xl p-3 px-4 mb-5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <span className="text-xs text-slate-400 uppercase font-bold">Racha Actual</span>
              <p className="text-lg font-black text-amber-300">{dailyState.currentStreak} Días Consecutivos</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase font-bold">Estado Hoy</span>
            <p className={`text-sm font-bold ${canClaim ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`}>
              {canClaim ? '¡Disponible para reclamar!' : 'Ya reclamado hoy'}
            </p>
          </div>
        </div>

        {/* 7 Days Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 mb-6 overflow-y-auto">
          {dailyState.days.map((item, index) => {
            const isToday = index === nextDayIndex && canClaim;
            const isCompleted = item.claimed;
            const isUpcoming = index > nextDayIndex || (!canClaim && index === nextDayIndex);

            return (
              <div
                key={item.day}
                className={`flex flex-col items-center justify-between p-3 rounded-xl border text-center transition ${
                  isToday
                    ? 'bg-amber-600/20 border-amber-400 ring-2 ring-amber-400/50 shadow-lg scale-105'
                    : isCompleted
                    ? 'bg-slate-900/60 border-emerald-500/40 opacity-75'
                    : 'bg-slate-900/30 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[10px] font-mono font-bold text-slate-400">{item.title}</span>
                  {isCompleted && <span className="text-emerald-400 text-xs">✓</span>}
                </div>

                <div className="my-2 text-2xl">
                  {item.rewardType === 'gold' && '🪙'}
                  {item.rewardType === 'item' && '🪖'}
                  {item.rewardType === 'skin' && '👑'}
                </div>

                <p className="text-xs font-bold text-amber-200 line-clamp-2 leading-tight">
                  {item.itemText}
                </p>

                <div className="mt-2 text-[10px] font-mono">
                  {isCompleted ? (
                    <span className="text-emerald-400">Reclamado</span>
                  ) : isToday ? (
                    <span className="text-amber-400 font-bold animate-pulse">¡Hoy!</span>
                  ) : (
                    <span className="text-slate-500">Próximo</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Claim Action */}
        <div className="mt-auto pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {claimResult ? (
            <p className="text-emerald-400 text-sm font-bold">{claimResult}</p>
          ) : (
            <p className="text-xs text-slate-400">
              {canClaim
                ? '¡Tienes una recompensa esperándote hoy!'
                : 'Vuelve mañana para continuar tu racha de premios.'}
            </p>
          )}

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleClaim}
              disabled={!canClaim}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold font-mono text-sm tracking-wide transition cursor-pointer ${
                canClaim
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg hover:shadow-amber-500/25 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {canClaim ? '🎁 RECLAMAR RECOMPENSA DE HOY' : 'RECOMPENSA RECLAMADA'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
