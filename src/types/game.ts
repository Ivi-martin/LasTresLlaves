export type WeaponType = 'pistol' | 'shotgun';

export interface WeaponDef {
  name: string;
  fire: number;
  spd: number;
  dmg: number;
  n: number;
  spread: number;
  life: number;
  color: string;
  r: number;
}

export type GraphicQuality = 'low' | 'medium' | 'high';

export interface AvatarSkin {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  tintRgba: string;
  unlocked: boolean;
  unlockRequirement: string;
  cost?: number;
  unlockedByLevel?: number;
}

export interface AvatarHat {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockRequirement: string;
  cost?: number;
  drawType: 'none' | 'crown' | 'fedora' | 'horns' | 'halo' | 'bandana' | 'visor';
  color: string;
}

export interface AvatarAura {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockRequirement: string;
  cost?: number;
  color: string;
  particleType: 'none' | 'fire' | 'stars' | 'spark' | 'void';
}

export interface AvatarWeaponSkin {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockRequirement: string;
  cost?: number;
  color: string;
  bulletColor: string;
}

export interface EquippedCosmetics {
  skinId: string;
  hatId: string;
  auraId: string;
  weaponSkinId: string;
}

export interface PlayerStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  gold: number;
  totalKills: number;
  totalBossesDefeated: number;
  totalGamesWon: number;
  highestPhase: number;
  highScore: number;
  // Upgrade levels
  upgrades: {
    maxHp: number;        // +10 HP per upgrade
    moveSpeed: number;    // +4% per upgrade
    damage: number;       // +5% per upgrade
    startBombs: number;   // +1 extra bomb
    dropRate: number;     // +3% heal drop rate
    fireRate: number;     // +4% attack speed
  };
}

export interface DailyRewardDay {
  day: number;
  title: string;
  rewardType: 'gold' | 'xp' | 'item' | 'skin';
  amount?: number;
  itemText: string;
  unlockedCosmeticId?: string;
  claimed: boolean;
}

export interface DailyRewardsState {
  currentStreak: number;
  lastClaimDate: string | null; // ISO Date YYYY-MM-DD
  days: DailyRewardDay[];
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  type: 'kills' | 'keys' | 'boss' | 'shotgun' | 'no_damage_phase';
  target: number;
  current: number;
  completed: boolean;
  claimed: boolean;
  rewardGold: number;
  rewardXp: number;
  rewardItem?: string;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatarSkin: string;
  avatarHat: string;
  level: number;
  score: number;
  timeSeconds: number;
  phaseReached: number;
  date: string;
  isPlayer?: boolean;
}

export interface GameSettings {
  quality: GraphicQuality;
  showFps: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  pushNotificationsEnabled: boolean;
  touchControls: boolean;
}
