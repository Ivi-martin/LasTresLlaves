import React, { useEffect, useState } from 'react';
import { EquippedCosmetics, PlayerStats } from '../types/game';
import { sound } from '../utils/audio';
import { StorageManager, DEFAULT_SKINS, DEFAULT_HATS } from '../utils/storage';

interface TitleScreenProps {
  stats: PlayerStats;
  equipped: EquippedCosmetics;
  onStartGame: (phase?: number) => void;
  onOpenDailyRewards: () => void;
  onOpenAvatarCustomizer: () => void;
  onOpenLeaderboard: () => void;
  onOpenWeeklyChallenges: () => void;
  onOpenSettings: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  stats,
  equipped,
  onStartGame,
  onOpenDailyRewards,
  onOpenAvatarCustomizer,
  onOpenLeaderboard,
  onOpenWeeklyChallenges,
  onOpenSettings,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const { canClaim } = StorageManager.canClaimDailyReward();
  const [selectedPhase, setSelectedPhase] = useState<number>(1);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        sound.click();
        onStartGame(selectedPhase);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onStartGame, selectedPhase]);

  const currentSkin = DEFAULT_SKINS.find((s) => s.id === equipped.skinId) || DEFAULT_SKINS[0];
  const currentHat = DEFAULT_HATS.find((h) => h.id === equipped.hatId);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-6 md:p-10 bg-[#0e130f] select-none overflow-hidden">
      {/* Ambient Animated Background Grid & Particles */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#c2410c_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0e130f] via-transparent to-[#162016]/40" />

      {/* Top Bar: Stats Cluster & Offline Indicator */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-between">
        {/* Player Profile Preview */}
        <div className="flex items-center gap-3 bg-black/60 border border-amber-600/40 rounded-xl p-2 px-3.5 backdrop-blur-xs shadow-lg">
          <div
            className="w-10 h-10 rounded-lg border border-amber-500/50 flex items-center justify-center text-lg shadow-md shrink-0"
            style={{ backgroundColor: currentSkin.secondaryColor }}
          >
            {currentHat?.drawType === 'crown' ? '👑' : currentHat?.drawType === 'horns' ? '🪖' : '🤠'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-300">{StorageManager.getPlayerName()}</span>
              <span className="text-[10px] bg-purple-900/60 text-purple-300 border border-purple-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                Nv. {stats.level}
              </span>
            </div>
            {/* XP progress bar */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-400"
                  style={{ width: `${Math.min(100, (stats.xp / stats.xpToNextLevel) * 100)}%` }}
                />
              </div>
              <span className="text-[9px] font-mono text-slate-400 tabular-nums">
                {stats.xp}/{stats.xpToNextLevel} XP
              </span>
            </div>
          </div>
        </div>

        {/* Currency & Network Status */}
        <div className="flex items-center gap-3">
          <div className="bg-black/60 border border-amber-500/40 rounded-xl px-3.5 py-2 text-sm font-mono text-amber-300 flex items-center gap-1.5 shadow-lg">
            <span>🪙</span>
            <span className="font-extrabold">{stats.gold.toLocaleString()}</span>
          </div>

          <div
            className={`px-3 py-2 rounded-xl border text-xs font-mono flex items-center gap-2 shadow-lg backdrop-blur-xs ${
              isOnline
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : 'bg-amber-950/40 border-amber-500/50 text-amber-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="hidden sm:inline font-bold">
              {isOnline ? 'En línea' : 'Modo Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Hero Centerpiece: Bespoke SVG Title Lockup */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto max-w-3xl">
        {/* Title Lockup Graphic */}
        <div className="mb-4">
          <svg className="w-56 h-16 md:w-80 md:h-20 filter drop-shadow-[0_4px_16px_rgba(255,176,32,0.4)]" viewBox="0 0 320 80">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff275" />
                <stop offset="50%" stopColor="#ffb020" />
                <stop offset="100%" stopColor="#c2410c" />
              </linearGradient>
            </defs>
            {/* Three key icons */}
            <path
              d="M30 40 C30 25 42 15 55 15 C68 15 80 25 80 40 C80 50 74 58 65 62 L65 70 L55 70 L55 64 L45 64 L45 60 C36 56 30 48 30 40 Z"
              fill="url(#goldGrad)"
              opacity="0.8"
              transform="scale(0.35) translate(40, 20)"
            />
            <text
              x="160"
              y="52"
              textAnchor="middle"
              className="font-serif font-black tracking-widest fill-[url(#goldGrad)]"
              style={{ fontSize: '38px', letterSpacing: '4px' }}
            >
              LAS TRES LLAVES
            </text>
            <text
              x="160"
              y="74"
              textAnchor="middle"
              className="font-mono font-bold tracking-widest fill-amber-200/80"
              style={{ fontSize: '12px', letterSpacing: '6px' }}
            >
              EDICIÓN DEFINITIVA
            </text>
          </svg>
        </div>

        <p className="text-sm md:text-base text-slate-300 max-w-xl mb-6 font-medium leading-relaxed drop-shadow">
          Explora los reinos del Bosque, la Cripta Sombría y la Fortaleza de Magma. Reúne las tres llaves sagradas,
          desbloquea la casa de los titanes y derrota a los tres colosos.
        </p>

        {/* Phase Quick Selector */}
        <div className="flex items-center gap-2 mb-6 bg-black/60 border border-slate-800 p-1.5 rounded-xl">
          <span className="text-xs text-slate-400 font-mono ml-2 mr-1">Fase Inicial:</span>
          {[
            { num: 1, label: '1. Bosque' },
            { num: 2, label: '2. Cripta' },
            { num: 3, label: '3. Magma' },
          ].map((p) => (
            <button
              key={p.num}
              onClick={() => {
                sound.click();
                setSelectedPhase(p.num);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                selectedPhase === p.num
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Primary Start CTA */}
        <button
          onClick={() => {
            sound.click();
            onStartGame(selectedPhase);
          }}
          className="group relative px-10 py-4 bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 hover:from-amber-500 hover:to-orange-500 active:scale-95 text-slate-950 font-black font-mono text-lg md:text-xl rounded-2xl shadow-[0_0_35px_rgba(245,158,11,0.4)] border-2 border-amber-300 tracking-wider transition-all duration-200 cursor-pointer mb-3"
        >
          <span className="flex items-center gap-3">
            <span>⚔️</span>
            <span>INICIAR AVENTURA</span>
            <span className="text-xs font-normal opacity-75 hidden sm:inline">[ENTER / ESPACIO]</span>
          </span>
        </button>

        {/* Control Hint Line */}
        <div className="text-xs font-mono text-slate-400 tracking-wide">
          WASD Moverse · Ratón Apuntar · Espacio/Clic Disparar · Q Cambiar Arma · R Bomba · E Entrar
        </div>
      </div>

      {/* Bottom Feature Navigation Deck */}
      <div className="relative z-10 w-full max-w-4xl grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4">
        {/* Daily Rewards Button with Unread Badge */}
        <button
          onClick={() => {
            sound.click();
            onOpenDailyRewards();
          }}
          className="relative bg-slate-900/80 hover:bg-slate-800 border border-amber-600/40 rounded-xl p-3 flex flex-col items-center justify-center gap-1 transition active:scale-95 cursor-pointer shadow-md group"
        >
          {canClaim && (
            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full animate-ping" />
          )}
          {canClaim && (
            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-slate-950" />
          )}
          <span className="text-2xl group-hover:scale-110 transition">🎁</span>
          <span className="text-xs font-bold text-amber-300">Racha Diaria</span>
          <span className="text-[10px] text-slate-400">{canClaim ? '¡Reclama Hoy!' : 'Racha Activa'}</span>
        </button>

        {/* Avatar Customizer */}
        <button
          onClick={() => {
            sound.click();
            onOpenAvatarCustomizer();
          }}
          className="bg-slate-900/80 hover:bg-slate-800 border border-amber-600/40 rounded-xl p-3 flex flex-col items-center justify-center gap-1 transition active:scale-95 cursor-pointer shadow-md group"
        >
          <span className="text-2xl group-hover:scale-110 transition">🪖</span>
          <span className="text-xs font-bold text-amber-300">Armario Avatar</span>
          <span className="text-[10px] text-slate-400">Trajes y Cascos</span>
        </button>

        {/* Weekly Challenges */}
        <button
          onClick={() => {
            sound.click();
            onOpenWeeklyChallenges();
          }}
          className="bg-slate-900/80 hover:bg-slate-800 border border-amber-600/40 rounded-xl p-3 flex flex-col items-center justify-center gap-1 transition active:scale-95 cursor-pointer shadow-md group"
        >
          <span className="text-2xl group-hover:scale-110 transition">🎯</span>
          <span className="text-xs font-bold text-amber-300">Desafíos</span>
          <span className="text-[10px] text-slate-400">Pruebas Semanales</span>
        </button>

        {/* Global Leaderboards */}
        <button
          onClick={() => {
            sound.click();
            onOpenLeaderboard();
          }}
          className="bg-slate-900/80 hover:bg-slate-800 border border-amber-600/40 rounded-xl p-3 flex flex-col items-center justify-center gap-1 transition active:scale-95 cursor-pointer shadow-md group"
        >
          <span className="text-2xl group-hover:scale-110 transition">🏆</span>
          <span className="text-xs font-bold text-amber-300">Clasificación</span>
          <span className="text-[10px] text-slate-400">Récords Mundiales</span>
        </button>

        {/* Settings & Optimizations */}
        <button
          onClick={() => {
            sound.click();
            onOpenSettings();
          }}
          className="col-span-2 sm:col-span-1 bg-slate-900/80 hover:bg-slate-800 border border-amber-600/40 rounded-xl p-3 flex flex-col items-center justify-center gap-1 transition active:scale-95 cursor-pointer shadow-md group"
        >
          <span className="text-2xl group-hover:scale-110 transition">⚙️</span>
          <span className="text-xs font-bold text-amber-300">Ajustes</span>
          <span className="text-[10px] text-slate-400">Gama Baja & Audio</span>
        </button>
      </div>
    </div>
  );
};
