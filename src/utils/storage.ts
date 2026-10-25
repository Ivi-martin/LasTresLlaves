import {
  AvatarAura,
  AvatarHat,
  AvatarSkin,
  AvatarWeaponSkin,
  DailyRewardsState,
  EquippedCosmetics,
  GameSettings,
  LeaderboardEntry,
  PlayerStats,
  WeeklyChallenge,
} from '../types/game';

const STORAGE_KEYS = {
  STATS: 'tres_llaves_stats_v2',
  EQUIPPED: 'tres_llaves_equipped_v2',
  UNLOCKED_ITEMS: 'tres_llaves_unlocked_items_v2',
  DAILY_REWARDS: 'tres_llaves_daily_rewards_v2',
  WEEKLY_CHALLENGES: 'tres_llaves_weekly_challenges_v2',
  LEADERBOARD: 'tres_llaves_leaderboard_v2',
  SETTINGS: 'tres_llaves_settings_v2',
  PLAYER_NAME: 'tres_llaves_player_name_v2',
};

// Default Avatar Cosmetics Catalog
export const DEFAULT_SKINS: AvatarSkin[] = [
  {
    id: 'classic',
    name: 'Aventurero Clásico',
    description: 'El intrépido cazador de secretos y llaves sagradas.',
    primaryColor: '#c2410c',
    secondaryColor: '#8a5a2b',
    tintRgba: 'rgba(255, 255, 255, 0)',
    unlocked: true,
    unlockRequirement: 'Disponible por defecto',
  },
  {
    id: 'dark_knight',
    name: 'Caballero Umbrío',
    description: 'Armadura forjada en la obsidiana de la Cripta.',
    primaryColor: '#6366f1',
    secondaryColor: '#1e1b4b',
    tintRgba: 'rgba(99, 102, 241, 0.45)',
    unlocked: false,
    unlockRequirement: 'Alcanza el Nivel 3',
    unlockedByLevel: 3,
  },
  {
    id: 'magma_hunter',
    name: 'Cazador de Magma',
    description: 'Resistente a las llamaradas de la Fortaleza de Lava.',
    primaryColor: '#ef4444',
    secondaryColor: '#7f1d1d',
    tintRgba: 'rgba(239, 68, 68, 0.45)',
    unlocked: false,
    unlockRequirement: 'Alcanza el Nivel 6 o 800 Monedas',
    cost: 800,
    unlockedByLevel: 6,
  },
  {
    id: 'golden_guardian',
    name: 'Guardián Dorado',
    description: 'Bañado en oro celestial y bendecido por los titanes.',
    primaryColor: '#eab308',
    secondaryColor: '#713f12',
    tintRgba: 'rgba(234, 179, 8, 0.55)',
    unlocked: false,
    unlockRequirement: 'Día 7 de racha o 1,500 Monedas',
    cost: 1500,
  },
  {
    id: 'cyber_agent',
    name: 'Ciber Soldado',
    description: 'Nanotraje táctico de alta velocidad y tecnología cuántica.',
    primaryColor: '#06b6d4',
    secondaryColor: '#083344',
    tintRgba: 'rgba(6, 182, 212, 0.5)',
    unlocked: false,
    unlockRequirement: 'Desbloqueable por 1,200 Monedas',
    cost: 1200,
  },
  {
    id: 'crypt_necromancer',
    name: 'Nigromante Ancestral',
    description: 'Manipulador de almas oscuras y fuegos fatuos.',
    primaryColor: '#a855f7',
    secondaryColor: '#3b0764',
    tintRgba: 'rgba(168, 85, 247, 0.5)',
    unlocked: false,
    unlockRequirement: 'Alcanza el Nivel 10',
    unlockedByLevel: 10,
  },
];

export const DEFAULT_HATS: AvatarHat[] = [
  {
    id: 'none',
    name: 'Sin Sombrero',
    description: 'Pelo al viento, listo para la acción.',
    unlocked: true,
    unlockRequirement: 'Inicial',
    drawType: 'none',
    color: '#000000',
  },
  {
    id: 'explorer_fedora',
    name: 'Sombrero de Explorador',
    description: 'El clásico sombrero de ala ancha de las expediciones.',
    unlocked: true,
    unlockRequirement: 'Inicial',
    drawType: 'fedora',
    color: '#8a5a2b',
  },
  {
    id: 'crimson_bandana',
    name: 'Bandana Carmesí',
    description: 'Cinta de combate que infunde determinación.',
    unlocked: false,
    unlockRequirement: 'Recompensa del Día 3 o 400 Monedas',
    cost: 400,
    drawType: 'bandana',
    color: '#dc2626',
  },
  {
    id: 'viking_horns',
    name: 'Casco de Valquiria',
    description: 'Cuernos de guerra vikingos con detalles rúnicos.',
    unlocked: false,
    unlockRequirement: 'Recompensa del Día 6 o 900 Monedas',
    cost: 900,
    drawType: 'horns',
    color: '#94a3b8',
  },
  {
    id: 'royal_crown',
    name: 'Corona Imperial',
    description: 'Joyas talladas para el monarca que domina las tres fases.',
    unlocked: false,
    unlockRequirement: 'Alcanza el Nivel 8 o 1,400 Monedas',
    cost: 1400,
    drawType: 'crown',
    color: '#ffd23f',
  },
  {
    id: 'cyber_visor',
    name: 'Visor Holotáctico',
    description: 'Lectura HUD de trayectorias balísticas.',
    unlocked: false,
    unlockRequirement: 'Completa desafío semanal o 750 Monedas',
    cost: 750,
    drawType: 'visor',
    color: '#06b6d4',
  },
  {
    id: 'angel_halo',
    name: 'Aureola Sagrada',
    description: 'Brillo puro que bendice al portador.',
    unlocked: false,
    unlockRequirement: 'Alcanza el Nivel 12',
    cost: 2000,
    drawType: 'halo',
    color: '#fef08a',
  },
];

export const DEFAULT_AURAS: AvatarAura[] = [
  {
    id: 'none',
    name: 'Sin Aura',
    description: 'Sin efectos de partículas adicionales.',
    unlocked: true,
    unlockRequirement: 'Inicial',
    color: '#000000',
    particleType: 'none',
  },
  {
    id: 'flame_trail',
    name: 'Estela Ígnea',
    description: 'Chispas de fuego que brotan a cada paso.',
    unlocked: false,
    unlockRequirement: 'Derrota al Coloso de Magma o 600 Monedas',
    cost: 600,
    color: '#f97316',
    particleType: 'fire',
  },
  {
    id: 'star_glitter',
    name: 'Destellos Celestes',
    description: 'Estrellas titilantes que marcan tu sendero.',
    unlocked: false,
    unlockRequirement: 'Alcanza el Nivel 5 o 500 Monedas',
    cost: 500,
    color: '#ffd23f',
    particleType: 'stars',
  },
  {
    id: 'thunder_spark',
    name: 'Chispas de Voltaje',
    description: 'Rayos electromagnéticos pulsantes.',
    unlocked: false,
    unlockRequirement: 'Desafío semanal o 700 Monedas',
    cost: 700,
    color: '#38bdf8',
    particleType: 'spark',
  },
  {
    id: 'void_mist',
    name: 'Neblina del Abismo',
    description: 'Miasma espectral de la Cripta tenebrosa.',
    unlocked: false,
    unlockRequirement: 'Alcanza el Nivel 9 o 1,000 Monedas',
    cost: 1000,
    color: '#c084fc',
    particleType: 'void',
  },
];

export const DEFAULT_WEAPON_SKINS: AvatarWeaponSkin[] = [
  {
    id: 'default_metal',
    name: 'Acero Forjado',
    description: 'El arma de ordenanza de confianza.',
    unlocked: true,
    unlockRequirement: 'Inicial',
    color: '#2b2b30',
    bulletColor: '#ffe66b',
  },
  {
    id: 'gold_gilded',
    name: 'Oro y Marfil',
    description: 'Disparos brillantes dorados con acabado regio.',
    unlocked: false,
    unlockRequirement: 'Alcanza el Nivel 4 o 650 Monedas',
    cost: 650,
    color: '#d97706',
    bulletColor: '#fbbf24',
  },
  {
    id: 'plasma_laser',
    name: 'Fusil Neón Cian',
    description: 'Proyectiles de alta energía cuántica azulada.',
    unlocked: false,
    unlockRequirement: 'Desbloquea por 900 Monedas',
    cost: 900,
    color: '#0891b2',
    bulletColor: '#22d3ee',
  },
  {
    id: 'magma_cannon',
    name: 'Cañón Ígneo',
    description: 'Dispara proyectiles ardientes de lava.',
    unlocked: false,
    unlockRequirement: 'Alcanza el Nivel 7 o 1,100 Monedas',
    cost: 1100,
    color: '#b91c1c',
    bulletColor: '#ff5722',
  },
];

export const INITIAL_STATS: PlayerStats = {
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  gold: 250,
  totalKills: 0,
  totalBossesDefeated: 0,
  totalGamesWon: 0,
  highestPhase: 1,
  highScore: 0,
  upgrades: {
    maxHp: 0,
    moveSpeed: 0,
    damage: 0,
    startBombs: 0,
    dropRate: 0,
    fireRate: 0,
  },
};

export const INITIAL_EQUIPPED: EquippedCosmetics = {
  skinId: 'classic',
  hatId: 'explorer_fedora',
  auraId: 'none',
  weaponSkinId: 'default_metal',
};

export const INITIAL_SETTINGS: GameSettings = {
  quality: 'high',
  showFps: true,
  soundEnabled: true,
  soundVolume: 0.8,
  pushNotificationsEnabled: true,
  touchControls: false,
};

export function getXpForLevel(lvl: number): number {
  return Math.floor(100 * Math.pow(1.22, lvl - 1));
}

// Storage helpers
export const StorageManager = {
  getStats(): PlayerStats {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATS);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...INITIAL_STATS,
          ...parsed,
          upgrades: { ...INITIAL_STATS.upgrades, ...(parsed.upgrades || {}) },
        };
      }
    } catch {
      // fallback
    }
    return INITIAL_STATS;
  },

  saveStats(stats: PlayerStats) {
    try {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch {}
  },

  addXpAndGold(xpGained: number, goldGained: number): { newStats: PlayerStats; leveledUp: boolean; newLevel: number } {
    const stats = this.getStats();
    let currentLvl = stats.level;
    let currentXp = stats.xp + xpGained;
    let xpNeeded = getXpForLevel(currentLvl);
    let leveledUp = false;

    while (currentXp >= xpNeeded) {
      currentXp -= xpNeeded;
      currentLvl += 1;
      leveledUp = true;
      xpNeeded = getXpForLevel(currentLvl);
    }

    const updated: PlayerStats = {
      ...stats,
      level: currentLvl,
      xp: currentXp,
      xpToNextLevel: xpNeeded,
      gold: stats.gold + goldGained,
    };

    this.saveStats(updated);

    // Auto-unlock level items if any
    if (leveledUp) {
      this.checkLevelUnlocks(currentLvl);
    }

    return { newStats: updated, leveledUp, newLevel: currentLvl };
  },

  getEquipped(): EquippedCosmetics {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EQUIPPED);
      if (data) return { ...INITIAL_EQUIPPED, ...JSON.parse(data) };
    } catch {}
    return INITIAL_EQUIPPED;
  },

  saveEquipped(equipped: EquippedCosmetics) {
    try {
      localStorage.setItem(STORAGE_KEYS.EQUIPPED, JSON.stringify(equipped));
    } catch {}
  },

  getUnlockedItems(): Set<string> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.UNLOCKED_ITEMS);
      if (data) return new Set(JSON.parse(data));
    } catch {}
    return new Set(['classic', 'none', 'explorer_fedora', 'default_metal']);
  },

  saveUnlockedItems(items: Set<string>) {
    try {
      localStorage.setItem(STORAGE_KEYS.UNLOCKED_ITEMS, JSON.stringify(Array.from(items)));
    } catch {}
  },

  unlockItem(id: string) {
    const items = this.getUnlockedItems();
    items.add(id);
    this.saveUnlockedItems(items);
  },

  checkLevelUnlocks(level: number): string[] {
    const unlockedNow: string[] = [];
    const items = this.getUnlockedItems();

    DEFAULT_SKINS.forEach((s) => {
      if (s.unlockedByLevel && level >= s.unlockedByLevel && !items.has(s.id)) {
        items.add(s.id);
        unlockedNow.push(s.name);
      }
    });

    if (level >= 8 && !items.has('royal_crown')) {
      items.add('royal_crown');
      unlockedNow.push('Corona Imperial');
    }
    if (level >= 5 && !items.has('star_glitter')) {
      items.add('star_glitter');
      unlockedNow.push('Destellos Celestes');
    }
    if (level >= 4 && !items.has('gold_gilded')) {
      items.add('gold_gilded');
      unlockedNow.push('Oro y Marfil');
    }
    if (level >= 12 && !items.has('angel_halo')) {
      items.add('angel_halo');
      unlockedNow.push('Aureola Sagrada');
    }

    this.saveUnlockedItems(items);
    return unlockedNow;
  },

  getDailyRewards(): DailyRewardsState {
    const defaultDays = [
      { day: 1, title: 'Día 1', rewardType: 'gold' as const, amount: 200, itemText: '+200 Monedas +50 XP', claimed: false },
      { day: 2, title: 'Día 2', rewardType: 'gold' as const, amount: 350, itemText: '+350 Monedas + Bomba Inicial', claimed: false },
      { day: 3, title: 'Día 3', rewardType: 'item' as const, unlockedCosmeticId: 'crimson_bandana', itemText: 'Bandana Carmesí Exclusiva', claimed: false },
      { day: 4, title: 'Día 4', rewardType: 'gold' as const, amount: 500, itemText: '+500 Monedas + 150 XP', claimed: false },
      { day: 5, title: 'Día 5', rewardType: 'gold' as const, amount: 750, itemText: '+750 Monedas + Poción de Daño', claimed: false },
      { day: 6, title: 'Día 6', rewardType: 'item' as const, unlockedCosmeticId: 'viking_horns', itemText: 'Casco de Valquiria', claimed: false },
      { day: 7, title: 'Día 7', rewardType: 'skin' as const, unlockedCosmeticId: 'golden_guardian', itemText: 'Skin Legendaria: Guardián Dorado', claimed: false },
    ];

    try {
      const data = localStorage.getItem(STORAGE_KEYS.DAILY_REWARDS);
      if (data) {
        return JSON.parse(data);
      }
    } catch {}

    return {
      currentStreak: 0,
      lastClaimDate: null,
      days: defaultDays,
    };
  },

  saveDailyRewards(state: DailyRewardsState) {
    try {
      localStorage.setItem(STORAGE_KEYS.DAILY_REWARDS, JSON.stringify(state));
    } catch {}
  },

  canClaimDailyReward(): { canClaim: boolean; nextDayIndex: number; streak: number } {
    const state = this.getDailyRewards();
    const today = new Date().toISOString().split('T')[0];

    if (!state.lastClaimDate) {
      return { canClaim: true, nextDayIndex: 0, streak: 0 };
    }

    if (state.lastClaimDate === today) {
      return { canClaim: false, nextDayIndex: state.currentStreak % 7, streak: state.currentStreak };
    }

    // Check if missed more than 1 day
    const lastDate = new Date(state.lastClaimDate);
    const currDate = new Date(today);
    const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 1) {
      // Continuing streak
      const nextIdx = state.currentStreak % 7;
      return { canClaim: true, nextDayIndex: nextIdx, streak: state.currentStreak };
    } else {
      // Streak broken, reset
      return { canClaim: true, nextDayIndex: 0, streak: 0 };
    }
  },

  claimDailyReward(): { success: boolean; rewardText: string; goldAdded: number } {
    const { canClaim, nextDayIndex, streak } = this.canClaimDailyReward();
    if (!canClaim) return { success: false, rewardText: 'Ya has reclamado hoy. ¡Vuelve mañana!', goldAdded: 0 };

    const state = this.getDailyRewards();
    const today = new Date().toISOString().split('T')[0];
    const targetDay = state.days[nextDayIndex];

    let goldAdded = 0;
    let rewardText = targetDay.itemText;

    if (targetDay.rewardType === 'gold' && targetDay.amount) {
      goldAdded = targetDay.amount;
      this.addXpAndGold(100, goldAdded);
    } else if (targetDay.rewardType === 'item' && targetDay.unlockedCosmeticId) {
      this.unlockItem(targetDay.unlockedCosmeticId);
      this.addXpAndGold(150, 250);
      goldAdded = 250;
    } else if (targetDay.rewardType === 'skin' && targetDay.unlockedCosmeticId) {
      this.unlockItem(targetDay.unlockedCosmeticId);
      this.addXpAndGold(500, 500);
      goldAdded = 500;
    }

    const newStreak = streak + 1;
    state.currentStreak = newStreak;
    state.lastClaimDate = today;
    state.days[nextDayIndex].claimed = true;

    // Reset cycle if finished day 7
    if (nextDayIndex === 6) {
      state.days.forEach((d) => (d.claimed = false));
    }

    this.saveDailyRewards(state);
    return { success: true, rewardText, goldAdded };
  },

  getWeeklyChallenges(): WeeklyChallenge[] {
    const defaultChallenges: WeeklyChallenge[] = [
      {
        id: 'w1',
        title: 'Cazador de Sombras',
        description: 'Elimina 40 enemigos en la Cripta o Bosque',
        type: 'kills',
        target: 40,
        current: 0,
        completed: false,
        claimed: false,
        rewardGold: 450,
        rewardXp: 200,
      },
      {
        id: 'w2',
        title: 'Arsenal de Dispersión',
        description: 'Elimina 20 enemigos usando la Escopeta',
        type: 'shotgun',
        target: 20,
        current: 0,
        completed: false,
        claimed: false,
        rewardGold: 500,
        rewardXp: 250,
      },
      {
        id: 'w3',
        title: 'Maestro Cerrajero',
        description: 'Encuentra y recoge 6 llaves sagradas en total',
        type: 'keys',
        target: 6,
        current: 0,
        completed: false,
        claimed: false,
        rewardGold: 600,
        rewardXp: 300,
      },
      {
        id: 'w4',
        title: 'Verdugo de Titanes',
        description: 'Derrota a cualquier Guardián de Fase',
        type: 'boss',
        target: 1,
        current: 0,
        completed: false,
        claimed: false,
        rewardGold: 800,
        rewardXp: 400,
      },
    ];

    try {
      const data = localStorage.getItem(STORAGE_KEYS.WEEKLY_CHALLENGES);
      if (data) return JSON.parse(data);
    } catch {}

    return defaultChallenges;
  },

  saveWeeklyChallenges(challenges: WeeklyChallenge[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.WEEKLY_CHALLENGES, JSON.stringify(challenges));
    } catch {}
  },

  updateChallengeProgress(type: WeeklyChallenge['type'], count: number = 1) {
    const list = this.getWeeklyChallenges();
    let modified = false;

    for (const c of list) {
      if (c.type === type && !c.completed) {
        c.current = Math.min(c.target, c.current + count);
        if (c.current >= c.target) {
          c.completed = true;
        }
        modified = true;
      }
    }

    if (modified) {
      this.saveWeeklyChallenges(list);
    }
  },

  getLeaderboard(): LeaderboardEntry[] {
    const simulatedGlobal: LeaderboardEntry[] = [
      { id: '1', rank: 1, name: 'Valkiria99', avatarSkin: 'golden_guardian', avatarHat: 'royal_crown', level: 24, score: 38400, timeSeconds: 245, phaseReached: 3, date: '2026-10-24' },
      { id: '2', rank: 2, name: 'SombrasX', avatarSkin: 'crypt_necromancer', avatarHat: 'viking_horns', level: 19, score: 32150, timeSeconds: 280, phaseReached: 3, date: '2026-10-25' },
      { id: '3', rank: 3, name: 'MagmaLord', avatarSkin: 'magma_hunter', avatarHat: 'crimson_bandana', level: 16, score: 27900, timeSeconds: 310, phaseReached: 3, date: '2026-10-23' },
      { id: '4', rank: 4, name: 'CyberBlade', avatarSkin: 'cyber_agent', avatarHat: 'cyber_visor', level: 15, score: 24500, timeSeconds: 340, phaseReached: 3, date: '2026-10-25' },
      { id: '5', rank: 5, name: 'Artemisa_Pro', avatarSkin: 'dark_knight', avatarHat: 'explorer_fedora', level: 12, score: 19800, timeSeconds: 390, phaseReached: 2, date: '2026-10-22' },
      { id: '6', rank: 6, name: 'TitanHunter', avatarSkin: 'classic', avatarHat: 'viking_horns', level: 9, score: 14200, timeSeconds: 420, phaseReached: 2, date: '2026-10-24' },
      { id: '7', rank: 7, name: 'PixelHero', avatarSkin: 'classic', avatarHat: 'explorer_fedora', level: 7, score: 9800, timeSeconds: 480, phaseReached: 1, date: '2026-10-25' },
    ];

    try {
      const data = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
      if (data) {
        return JSON.parse(data);
      }
    } catch {}

    return simulatedGlobal;
  },

  saveLeaderboard(entries: LeaderboardEntry[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(entries));
    } catch {}
  },

  recordScore(score: number, timeSeconds: number, phase: number) {
    const stats = this.getStats();
    const equipped = this.getEquipped();
    const name = this.getPlayerName();

    const currentLeaderboard = this.getLeaderboard();
    const newEntry: LeaderboardEntry = {
      id: 'player_' + Date.now(),
      rank: 0,
      name,
      avatarSkin: equipped.skinId,
      avatarHat: equipped.hatId,
      level: stats.level,
      score,
      timeSeconds,
      phaseReached: phase,
      date: new Date().toISOString().split('T')[0],
      isPlayer: true,
    };

    // Remove existing player entry if score is lower
    const filtered = currentLeaderboard.filter((e) => !e.isPlayer || e.score > score);
    filtered.push(newEntry);
    filtered.sort((a, b) => b.score - a.score);

    // Re-rank top 20
    const ranked = filtered.slice(0, 20).map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    this.saveLeaderboard(ranked);

    if (score > stats.highScore) {
      stats.highScore = score;
      this.saveStats(stats);
    }
  },

  getPlayerName(): string {
    return localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || 'Jugador 1';
  },

  setPlayerName(name: string) {
    localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name.trim().slice(0, 15) || 'Jugador 1');
  },

  getSettings(): GameSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) return { ...INITIAL_SETTINGS, ...JSON.parse(data) };
    } catch {}
    return INITIAL_SETTINGS;
  },

  saveSettings(settings: GameSettings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {}
  },
};
