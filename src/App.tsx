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

  const handleStartGame = (phase: number = 1) => {
    setStartPhase(phase);
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

  const handleExitToMenu = () => {
    setIsPaused(false);
    setGameOverData(null);
    setVictoryData(null);
    setView('title');
  };

  const handleRetry = () => {
    setGameOverData(null);
    setVictoryData(null);
    setIsPaused(false);
    // Restart current phase
    setView('title');
    setTimeout(() => {
      setView('playing');
    }, 10);
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
        />
      ) : (
        <GameCanvas
          key={`canvas_phase_${startPhase}`}
          initialPhase={startPhase}
          equipped={equipped}
          settings={settings}
          stats={stats}
          onGameOver={handleGameOver}
          onVictory={handleVictory}
          onPause={handlePause}
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

      {/* In-Game State Modals */}
      {isPaused && (
        <PauseModal
          onResume={() => setIsPaused(false)}
          onOpenSettings={() => setSettingsModalOpen(true)}
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
