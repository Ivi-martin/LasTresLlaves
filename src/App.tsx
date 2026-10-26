/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { TitleScreen } from './components/TitleScreen';
import { GameCanvas } from './components/GameCanvas';
import { DailyRewardsModal } from './components/DailyRewardsModal';
import { AvatarCustomizerModal } from './components/AvatarCustomizerModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { WeeklyChallengesModal } from './components/WeeklyChallengesModal';
import { SettingsModal } from './components/SettingsModal';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';
import { AdminModal } from './components/AdminModal';
import { ToastOverlay } from './components/ToastOverlay';
import {
  EquippedCosmetics,
  GameSettings,
  PlayerStats,
} from './types/game';
import { StorageManager } from './utils/storage';
import { sound } from './utils/audio';
import { notificationService } from './utils/notifications';

export default function App() {
  const [view, setView] = useState<'title' | 'playing'>('title');
  const [startPhase, setStartPhase] = useState<number>(1);
  const [startAtBoss, setStartAtBoss] = useState<boolean>(false);

  // Profile and Settings state
  const [stats, setStats] = useState<PlayerStats>(StorageManager.getStats());
  const [equipped, setEquipped] = useState<EquippedCosmetics>(StorageManager.getEquipped());
  const [settings, setSettings] = useState<GameSettings>(StorageManager.getSettings());

  // Modal states
  const [dailyModalOpen, setDailyModalOpen] = useState<boolean>(false);
  const [wardrobeModalOpen, setWardrobeModalOpen] = useState<boolean>(false);
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState<boolean>(false);
  const [weeklyModalOpen, setWeeklyModalOpen] = useState<boolean>(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [adminModalOpen, setAdminModalOpen] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // End game dialogs
  const [gameOverData, setGameOverData] = useState<{ score: number; phase: number; kills: number } | null>(null);
  const [victoryData, setVictoryData] = useState<{ score: number; kills: number } | null>(null);

  // Initial sound sync and daily check
  useEffect(() => {
    sound.setEnabled(settings.soundEnabled);
    sound.setVolume(settings.soundVolume);

    // Check if daily reward can be claimed
    const { canClaim, streak } = StorageManager.canClaimDailyReward();
    if (canClaim) {
      setTimeout(() => {
        notificationService.sendDailyStreakReminder(streak + 1);
      }, 1200);
    }
  }, [settings.soundEnabled, settings.soundVolume]);

  const handleStartGame = (phase: number = 1, atBoss: boolean = false) => {
    setStartPhase(phase);
    setStartAtBoss(atBoss);
    setGameOverData(null);
    setVictoryData(null);
    setIsPaused(false);
    setView('playing');
  };

  const handlePause = () => {
    if (view === 'playing' && !gameOverData && !victoryData) {
      setIsPaused((prev) => !prev);
    }
  };

  const handleGameOver = (finalScore: number, phase: number, kills: number) => {
    setGameOverData({ score: finalScore, phase, kills });
  };

  const handleVictory = (finalScore: number, kills: number) => {
    setVictoryData({ score: finalScore, kills });
  };

  const handlePhaseAdvance = (nextPhase: number) => {
    const updated = StorageManager.unlockPhase(nextPhase);
    setStats(updated);
    setStartPhase(nextPhase);
    setStartAtBoss(false);
    notificationService.emitToast(
      `¡FASE ${nextPhase} ALCANZADA!`,
      `Entrando al siguiente reino sagrado.`,
      'reward'
    );
  };

  const handleExitToMenu = () => {
    setIsPaused(false);
    setGameOverData(null);
    setVictoryData(null);
    setStartAtBoss(false);
    setView('title');
  };

  const handleRetry = () => {
    setGameOverData(null);
    setVictoryData(null);
    setIsPaused(false);
    setView('title');
    setTimeout(() => {
      setView('playing');
    }, 10);
  };

  // Admin / Dev Panel Actions (Default PIN: 1234)
  const handleAdminSelectPhase = (phase: number) => {
    const updated = StorageManager.unlockPhase(phase);
    setStats(updated);
    setStartPhase(phase);
    setStartAtBoss(false);
    setIsPaused(false);
    setAdminModalOpen(false);
    if (view === 'title') {
      handleStartGame(phase);
    } else {
      setView('title');
      setTimeout(() => {
        setView('playing');
      }, 20);
    }
  };

  const handleAdminEnterBossCave = () => {
    if (view === 'playing' && (window as any).__martinDevApi?.enterBossCave) {
      (window as any).__martinDevApi.enterBossCave();
      setIsPaused(false);
      setAdminModalOpen(false);
    } else {
      setStartAtBoss(true);
      setAdminModalOpen(false);
      handleStartGame(startPhase, true);
    }
  };

  const handleAdminInstantKeys = () => {
    if ((window as any).__martinDevApi?.instantKeys) {
      (window as any).__martinDevApi.instantKeys();
    }
  };

  const handleAdminUnlockAllPhases = () => {
    const updated = StorageManager.unlockAllPhases();
    setStats(updated);
    notificationService.emitToast(
      'Modo Desarrollador',
      '¡Fases 1, 2 y 3 desbloqueadas para selección!',
      'reward'
    );
  };

  const handleAdminAddCheats = () => {
    if ((window as any).__martinDevApi?.addCheats) {
      (window as any).__martinDevApi.addCheats();
    }
  };

  const handleAdminKillBoss = () => {
    if ((window as any).__martinDevApi?.killBoss) {
      (window as any).__martinDevApi.killBoss();
    }
  };

  const handleAdminToggleGodMode = (enabled: boolean) => {
    if ((window as any).__martinDevApi?.toggleGodMode) {
      (window as any).__martinDevApi.toggleGodMode(enabled);
    }
  };

  const handleRewardClaimed = useCallback((rewardText: string, goldAdded: number) => {
    const updated = StorageManager.getStats();
    setStats(updated);
  }, []);

  const handleWeeklyRewardClaimed = useCallback((rewardGold: number, rewardXp: number) => {
    const updated = StorageManager.getStats();
    setStats(updated);
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0e130f] text-slate-100 flex flex-col items-center justify-center font-sans select-none relative">
      {/* Toast Notification Container */}
      <ToastOverlay />

      {/* Main Viewport Shell */}
      {view === 'title' ? (
        <TitleScreen
          stats={stats}
          equipped={equipped}
          onStartGame={handleStartGame}
          onOpenDailyRewards={() => setDailyModalOpen(true)}
          onOpenAvatarCustomizer={() => setWardrobeModalOpen(true)}
          onOpenLeaderboard={() => setLeaderboardModalOpen(true)}
          onOpenWeeklyChallenges={() => setWeeklyModalOpen(true)}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onOpenAdmin={() => setAdminModalOpen(true)}
        />
      ) : (
        <GameCanvas
          key={`canvas_phase_${startPhase}_${startAtBoss ? 'boss' : 'field'}`}
          initialPhase={startPhase}
          startAtBoss={startAtBoss}
          equipped={equipped}
          settings={settings}
          stats={stats}
          onGameOver={handleGameOver}
          onVictory={handleVictory}
          onPhaseAdvance={handlePhaseAdvance}
          onPause={handlePause}
          onOpenAdmin={() => setAdminModalOpen(true)}
          onStatsUpdate={(newStats) => setStats(newStats)}
          isPaused={isPaused || !!gameOverData || !!victoryData}
        />
      )}

      {/* Modals and Overlays */}
      {dailyModalOpen && (
        <DailyRewardsModal
          onClose={() => setDailyModalOpen(false)}
          onRewardClaimed={handleRewardClaimed}
        />
      )}

      {wardrobeModalOpen && (
        <AvatarCustomizerModal
          equipped={equipped}
          stats={stats}
          onEquippedChange={(newEq) => setEquipped(newEq)}
          onStatsChange={(newSt) => setStats(newSt)}
          onClose={() => setWardrobeModalOpen(false)}
        />
      )}

      {leaderboardModalOpen && (
        <LeaderboardModal onClose={() => setLeaderboardModalOpen(false)} />
      )}

      {weeklyModalOpen && (
        <WeeklyChallengesModal
          onClose={() => setWeeklyModalOpen(false)}
          onRewardClaimed={handleWeeklyRewardClaimed}
        />
      )}

      {settingsModalOpen && (
        <SettingsModal
          settings={settings}
          stats={stats}
          onSettingsChange={(newSet) => setSettings(newSet)}
          onStatsChange={(newSt) => setStats(newSt)}
          onClose={() => setSettingsModalOpen(false)}
        />
      )}

      {/* Admin / Dev Panel Modal (PIN: 1234) */}
      <AdminModal
        currentPhase={startPhase}
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onSelectPhase={handleAdminSelectPhase}
        onEnterBossCave={handleAdminEnterBossCave}
        onInstantKeys={handleAdminInstantKeys}
        onToggleGodMode={handleAdminToggleGodMode}
        onUnlockAllPhases={handleAdminUnlockAllPhases}
        onAddCheats={handleAdminAddCheats}
        onKillBoss={handleAdminKillBoss}
      />

      {/* In-Game State Modals */}
      {isPaused && (
        <PauseModal
          onResume={() => setIsPaused(false)}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onOpenAdmin={() => setAdminModalOpen(true)}
          onExitToMenu={handleExitToMenu}
        />
      )}

      {gameOverData && (
        <GameOverModal
          score={gameOverData.score}
          phase={gameOverData.phase}
          kills={gameOverData.kills}
          onRetry={handleRetry}
          onExitToMenu={handleExitToMenu}
        />
      )}

      {victoryData && (
        <VictoryModal
          score={victoryData.score}
          kills={victoryData.kills}
          onPlayAgain={() => handleStartGame(1)}
          onExitToMenu={handleExitToMenu}
        />
      )}
    </div>
  );
}

