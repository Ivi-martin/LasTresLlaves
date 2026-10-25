import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  EquippedCosmetics,
  GameSettings,
  PlayerStats,
  WeaponType,
  WeaponDef,
} from '../types/game';
import { sound } from '../utils/audio';
import { StorageManager, DEFAULT_SKINS, DEFAULT_HATS, DEFAULT_AURAS, DEFAULT_WEAPON_SKINS } from '../utils/storage';
import { notificationService } from '../utils/notifications';

interface GameCanvasProps {
  initialPhase?: number;
  equipped: EquippedCosmetics;
  settings: GameSettings;
  stats: PlayerStats;
  onGameOver: (finalScore: number, phase: number, kills: number) => void;
  onVictory: (finalScore: number, kills: number) => void;
  onPause: () => void;
  onStatsUpdate: (newStats: PlayerStats) => void;
  isPaused: boolean;
}

// Balance and Weapon definitions
const BASE_CFG = {
  mapW: 4000,
  mapH: 3000,
  pSpeed: 265,
  pHp: 100,
  pFire: 0.15,
  pBulletSpd: 740,
  pDmg: 22,
  inv: 0.8,
  chaser: { hp: 40, spd: 125, dmg: 10, r: 16 },
  shooter: { hp: 30, spd: 95, dmg: 8, r: 16, fire: 1.7, bspd: 300 },
  bat: { hp: 15, spd: 235, dmg: 6, r: 11 },
  brute: { hp: 170, spd: 70, dmg: 25, r: 28 },
  turret: { hp: 90, spd: 0, dmg: 9, r: 20, fire: 2.1, bspd: 320 },
  dropHeal: 0.20,
  healAmt: 22,
  bossHp: 750,
  bossContact: 20,
};

const LV_DATA = [
  {
    name: 'Fase 1: El Bosque Ancestral',
    tip: 'Bosque: encuentra las 3 llaves. Sigue la brújula dorada.',
    boss: 'GUARDIÁN DE LA CASA',
    W: 4000,
    H: 3000,
    spd: 1,
    cap: 8,
    sp: 2.2,
    nobs: 105,
    nhaz: 0,
    tur: 0,
    kd: 1200,
    dark: 0,
    embers: 0,
    mix: [['chaser', 65], ['shooter', 35]] as [string, number][],
    zones: ['#234b2c', '#635630', '#263b52', '#3e2e4a'],
    ar: ['#3a1d24', '#2d161c', '#ff5a4d'],
    pal: {
      r: ['#7d838a', '#a3a9b0'],
      c: ['#8a5a2b', '#4a2f14'],
      t: ['#1f7a3a', '#2da24f'],
      roof: '#a8321f',
      wall: '#c9b48a',
    },
  },
  {
    name: 'Fase 2: La Cripta Sombría',
    tip: 'Cripta: oscuridad total. Sigue el brillo dorado y esquiva los murciélagos.',
    boss: 'ESPECTRO DEL ABISMO',
    W: 3000,
    H: 2400,
    spd: 1.12,
    cap: 10,
    sp: 1.7,
    nobs: 85,
    nhaz: 0,
    tur: 0,
    kd: 1000,
    dark: 1,
    embers: 0,
    mix: [['bat', 45], ['shooter', 30], ['chaser', 25]] as [string, number][],
    zones: ['#141927', '#1b263b', '#201a33', '#111624'],
    ar: ['#161a2e', '#1d2240', '#7be0ff'],
    pal: {
      r: ['#4b5670', '#6b7896'],
      c: ['#3a3f5a', '#232640'],
      t: ['#3d2a5c', '#5b3f8c'],
      roof: '#3d3a66',
      wall: '#8a93b5',
    },
  },
  {
    name: 'Fase 3: Fortaleza de Magma',
    tip: 'Fortaleza: la lava quema. Destruye torretas y vence al Coloso.',
    boss: 'COLOSO DE MAGMA',
    W: 3600,
    H: 2800,
    spd: 0.94,
    cap: 10,
    sp: 2.5,
    nobs: 75,
    nhaz: 15,
    tur: 8,
    kd: 1200,
    dark: 0,
    embers: 1,
    mix: [['chaser', 40], ['brute', 30], ['shooter', 30]] as [string, number][],
    zones: ['#301510', '#421d12', '#241414', '#4a220e'],
    ar: ['#2a0f0a', '#3a160c', '#ffb020'],
    pal: {
      r: ['#2b2b30', '#ff6a2a'],
      c: ['#55332a', '#2a1510'],
      t: ['#2a2a2e', '#4a4a52'],
      roof: '#2b2b30',
      wall: '#6b4a3a',
    },
  },
];

const BOMB_CFG = { r: 130, bossDmg: 40, pick: 34, onMap: 2 };
const BOSS_COLORS = [
  ['#6a2a9a', '#c2183a'],
  ['#7be0ff', '#b06bff'],
  ['#ff7a1a', '#ffd23f'],
];

// Embedded Hero Sprite
const SPR = new Image();
SPR.src =
  'data:image/png;base64,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';

export const GameCanvas: React.FC<GameCanvasProps> = ({
  initialPhase = 1,
  equipped,
  settings,
  stats,
  onGameOver,
  onVictory,
  onPause,
  onStatsUpdate,
  isPaused,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Runtime Game State
  const gameStateRef = useRef<{
    mode: 'world' | 'arena';
    level: number;
    W: number;
    H: number;
    P: {
      x: number;
      y: number;
      r: number;
      hp: number;
      maxHp: number;
      cd: number;
      inv: number;
      ang: number;
      weapons: WeaponType[];
      wep: number;
      speed: number;
      baseDmg: number;
    } | null;
    bullets: { x: number; y: number; vx: number; vy: number; l: number; dmg: number; c: string; r: number }[];
    ebul: { x: number; y: number; vx: number; vy: number; dmg: number; l: number }[];
    en: { type: string; x: number; y: number; r: number; hp: number; max: number; cd: number; dir: number }[];
    drops: { x: number; y: number }[];
    pickups: { x: number; y: number; type: WeaponType }[];
    parts: { x: number; y: number; vx: number; vy: number; l: number; c: string }[];
    keys: { x: number; y: number; got: number }[];
    obs: { x: number; y: number; w: number; h: number; t: number }[];
    haz: { x: number; y: number; r: number }[];
    house: { x: number; y: number; w: number; h: number };
    bombs: { x: number; y: number }[];
    blasts: { x: number; y: number; l: number }[];
    nBombs: number;
    boss: any;
    cam: { x: number; y: number };
    t: number;
    spawnT: number;
    shake: number;
    flash: number;
    fade: number;
    winT: number;
    got: number;
    score: number;
    kills: number;
    timeSeconds: number;
    txt: string;
    txtT: number;
    floatingTexts: { x: number; y: number; text: string; color: string; life: number }[];
    fps: number;
    fpsCount: number;
    fpsTimer: number;
    keysPressed: Record<string, boolean>;
    mouse: { x: number; y: number };
    mouseDown: boolean;
    touchActive: boolean;
    touchMove: { active: boolean; startX: number; startY: number; currX: number; currY: number };
    touchAim: { active: boolean; dirX: number; dirY: number };
    isShooting: boolean;
  }>({
    mode: 'world',
    level: initialPhase,
    W: 4000,
    H: 3000,
    P: null,
    bullets: [],
    ebul: [],
    en: [],
    drops: [],
    pickups: [],
    parts: [],
    keys: [],
    obs: [],
    haz: [],
    house: { x: 1915, y: 1435, w: 170, h: 130 },
    bombs: [],
    blasts: [],
    nBombs: 0,
    boss: null,
    cam: { x: 0, y: 0 },
    t: 0,
    spawnT: 0,
    shake: 0,
    flash: 0,
    fade: 0,
    winT: 0,
    got: 0,
    score: 0,
    kills: 0,
    timeSeconds: 0,
    txt: '',
    txtT: 0,
    floatingTexts: [],
    fps: 60,
    fpsCount: 0,
    fpsTimer: 0,
    keysPressed: {},
    mouse: { x: 600, y: 500 },
    mouseDown: false,
    touchActive: false,
    touchMove: { active: false, startX: 0, startY: 0, currX: 0, currY: 0 },
    touchAim: { active: false, dirX: 0, dirY: 0 },
    isShooting: false,
  });

  // UI state for reactive HUD buttons
  const [hudData, setHudData] = useState({
    hp: 100,
    maxHp: 100,
    level: 1,
    phase: 1,
    keys: 0,
    bombs: 0,
    weapon: 'Pistola',
    weaponCount: 1,
    nearHouse: false,
    fps: 60,
    score: 0,
  });

  const R = (a: number, b: number) => a + Math.random() * (b - a);
  const D = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

  // Weapon definitions according to selected cosmetic
  const getWeaponsConfig = useCallback((): Record<WeaponType, WeaponDef> => {
    const weaponSkin = DEFAULT_WEAPON_SKINS.find((w) => w.id === equipped.weaponSkinId) || DEFAULT_WEAPON_SKINS[0];
    const dmgBonus = 1 + stats.upgrades.damage * 0.05;
    const fireCooldownBonus = Math.max(0.08, 0.15 * (1 - stats.upgrades.fireRate * 0.04));

    return {
      pistol: {
        name: 'Pistola',
        fire: fireCooldownBonus,
        spd: 740,
        dmg: 22 * dmgBonus,
        n: 1,
        spread: 0,
        life: 1.1,
        color: weaponSkin.bulletColor,
        r: 5,
      },
      shotgun: {
        name: 'Escopeta',
        fire: fireCooldownBonus,
        spd: 740,
        dmg: 22 * dmgBonus,
        n: 2,
        spread: (20 * Math.PI) / 180,
        life: 1.1,
        color: weaponSkin.id === 'default_metal' ? '#ffb020' : weaponSkin.bulletColor,
        r: 5,
      },
    };
  }, [equipped.weaponSkinId, stats.upgrades]);

  const say = useCallback((s: string, d: number = 3) => {
    const G = gameStateRef.current;
    G.txt = s;
    G.txtT = d;
  }, []);

  const addFloatText = useCallback((x: number, y: number, text: string, color: string) => {
    gameStateRef.current.floatingTexts.push({
      x,
      y,
      text,
      color,
      life: 1.2,
    });
  }, []);

  const burstParticles = useCallback((x: number, y: number, col: string, n: number = 8) => {
    const G = gameStateRef.current;
    const maxParticles = settings.quality === 'low' ? 6 : settings.quality === 'medium' ? 12 : n;
    for (let i = 0; i < maxParticles; i++) {
      const a = R(0, 6.28);
      const s = R(60, 240);
      G.parts.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        l: R(0.3, 0.7),
        c: col,
      });
    }
  }, [settings.quality]);

  const inObs = (x: number, y: number, m: number) => {
    const G = gameStateRef.current;
    return G.obs.some((k) => x > k.x - m && x < k.x + k.w + m && y > k.y - m && y < k.y + k.h + m);
  };

  const spawnBomb = useCallback(() => {
    const G = gameStateRef.current;
    if (!G.P) return;
    for (let i = 0; i < 200; i++) {
      const x = R(80, G.W - 80);
      const y = R(80, G.H - 80);
      const q = { x, y };
      if (
        D(q, G.P) > (G.mode === 'world' ? 600 : 250) &&
        !inObs(x, y, 40) &&
        !G.haz.some((z) => D(z, q) < z.r + 30) &&
        (G.mode === 'world' || y > 300) &&
        !G.bombs.some((b) => D(b, q) < 400)
      ) {
        G.bombs.push(q);
        return;
      }
    }
  }, []);

  const fillBombs = useCallback(() => {
    const G = gameStateRef.current;
    while (G.bombs.length < BOMB_CFG.onMap) {
      const n = G.bombs.length;
      spawnBomb();
      if (G.bombs.length === n) break;
    }
  }, [spawnBomb]);

  const explode = useCallback(() => {
    const G = gameStateRef.current;
    if (!G.P || G.nBombs <= 0 || G.winT > 0 || isPaused) return;
    G.nBombs--;
    sound.bomb();

    // Kill nearby enemies
    for (const e of G.en) {
      if (e.hp > 0 && D(e, G.P) < BOMB_CFG.r + e.r) {
        e.hp = 0;
        killEnemy(e);
      }
    }
    // Clean enemy bullets
    for (const b of G.ebul) {
      if (D(b, G.P) < BOMB_CFG.r) b.l = 0;
    }
    // Damage boss
    if (G.boss && D(G.boss, G.P) < BOMB_CFG.r + G.boss.r) {
      G.boss.hp -= BOMB_CFG.bossDmg;
      burstParticles(G.boss.x, G.boss.y, '#ffd23f', 24);
      addFloatText(G.boss.x, G.boss.y - 30, `-${BOMB_CFG.bossDmg}`, '#ff4444');
    }

    G.blasts.push({ x: G.P.x, y: G.P.y, l: 0.5 });
    burstParticles(G.P.x, G.P.y, '#ff9a3d', 40);
    G.shake = settings.quality === 'low' ? 6 : 22;
    say(`¡BOMBA DETONADA! Te quedan ${G.nBombs}`, 2);
  }, [burstParticles, isPaused, say, settings.quality, addFloatText]);

  const cycleWeapon = useCallback(() => {
    const G = gameStateRef.current;
    if (!G.P || !G.P.weapons || G.P.weapons.length < 2) return;
    G.P.wep = (G.P.wep + 1) % G.P.weapons.length;
    G.P.cd = Math.max(G.P.cd, 0.15);
    const wConfig = getWeaponsConfig();
    const currName = wConfig[G.P.weapons[G.P.wep]].name.toUpperCase();
    say(`Arma seleccionada: ${currName}`, 1.5);
    sound.click();
  }, [getWeaponsConfig, say]);

  const spawnEnemy = useCallback((type: string, x: number, y: number) => {
    const G = gameStateRef.current;
    const c = (BASE_CFG as any)[type];
    const sc = 1 + 0.12 * (G.level - 1) + 0.12 * G.got;
    G.en.push({
      type,
      x,
      y,
      r: c.r,
      hp: c.hp * sc,
      max: c.hp * sc,
      cd: R(0.5, 1.5),
      dir: Math.random() < 0.5 ? 1 : -1,
    });
  }, []);

  const killEnemy = useCallback((e: any) => {
    const G = gameStateRef.current;
    sound.kill();
    G.kills++;
    burstParticles(e.x, e.y, e.type === 'chaser' ? '#ff5a4d' : '#c56bff', 14);

    // Score & XP & Coins calculation
    const xpBase = e.type === 'brute' ? 45 : e.type === 'turret' ? 35 : e.type === 'shooter' ? 25 : 18;
    const goldBase = e.type === 'brute' ? 20 : e.type === 'turret' ? 15 : 10;
    const scoreVal = xpBase * 10;
    G.score += scoreVal;

    // Award XP and Gold to player profile
    const result = StorageManager.addXpAndGold(xpBase, goldBase);
    onStatsUpdate(result.newStats);

    addFloatText(e.x, e.y - 12, `+${xpBase} XP`, '#38bdf8');
    if (Math.random() < 0.6) {
      addFloatText(e.x, e.y + 12, `+${goldBase} Oro`, '#ffd23f');
    }

    if (result.leveledUp) {
      sound.levelUp();
      say(`¡SUBISTE AL NIVEL ${result.newLevel}! Atributos Mejorados`, 4);
      addFloatText(G.P?.x || e.x, (G.P?.y || e.y) - 50, '¡NIVEL AUMENTADO!', '#4ade80');
      notificationService.emitToast('¡Subiste de Nivel!', `Has alcanzado el Nivel ${result.newLevel}. Nuevos accesorios desbloqueados.`, 'level');
    }

    // Weekly challenges
    StorageManager.updateChallengeProgress('kills', 1);
    if (G.P && G.P.weapons[G.P.wep] === 'shotgun') {
      StorageManager.updateChallengeProgress('shotgun', 1);
    }

    // Health drop calculation with player upgrades
    const dropChance = BASE_CFG.dropHeal + stats.upgrades.dropRate * 0.03;
    if (Math.random() < dropChance) {
      G.drops.push({ x: e.x, y: e.y });
    }
  }, [addFloatText, burstParticles, onStatsUpdate, say, stats.upgrades.dropRate]);

  const enemyShoot = (x: number, y: number, a: number, s: number, d: number) => {
    const G = gameStateRef.current;
    G.ebul.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, dmg: d, l: 3 });
  };

  const hurtPlayer = useCallback((dmg: number) => {
    const G = gameStateRef.current;
    if (!G.P || G.P.inv > 0 || isPaused) return;
    G.P.hp -= dmg;
    G.P.inv = BASE_CFG.inv;
    G.shake = settings.quality === 'low' ? 4 : 10;
    G.flash = 0.35;
    sound.hurt();
    addFloatText(G.P.x, G.P.y - 25, `-${Math.ceil(dmg)}`, '#ef4444');

    if (G.P.hp <= 0) {
      G.P.hp = 0;
      sound.bossDie();
      StorageManager.recordScore(G.score, Math.floor(G.timeSeconds), G.level);
      onGameOver(G.score, G.level, G.kills);
    }
  }, [addFloatText, isPaused, onGameOver, settings.quality]);

  const firePlayerWeapon = useCallback(() => {
    const G = gameStateRef.current;
    if (!G.P || G.winT > 0 || isPaused) return;

    const wConfig = getWeaponsConfig();
    const w = wConfig[G.P.weapons[G.P.wep]] || wConfig.pistol;
    G.P.cd = w.fire;

    for (let i = 0; i < w.n; i++) {
      const a = G.P.ang + (w.n > 1 ? (i - (w.n - 1) / 2) * w.spread : 0);
      G.bullets.push({
        x: G.P.x + Math.cos(a) * 22,
        y: G.P.y + Math.sin(a) * 22,
        vx: Math.cos(a) * w.spd,
        vy: Math.sin(a) * w.spd,
        l: w.life,
        dmg: w.dmg,
        c: w.color,
        r: w.r,
      });
    }

    if (G.P.weapons[G.P.wep] === 'shotgun') {
      sound.shotgun();
    } else {
      sound.shoot();
    }
  }, [getWeaponsConfig, isPaused]);

  const initPhase = useCallback((phaseNum: number, keepP: boolean = false) => {
    const G = gameStateRef.current;
    G.level = phaseNum;
    G.mode = 'world';
    G.t = 0;
    G.spawnT = 2;
    G.got = 0;
    G.winT = 0;
    G.obs = [];
    G.haz = [];
    G.bombs = [];
    G.blasts = [];
    G.bullets = [];
    G.ebul = [];
    G.en = [];
    G.drops = [];
    G.parts = [];
    G.pickups = [];
    G.boss = null;

    const L = LV_DATA[Math.min(phaseNum, 3) - 1];
    G.W = L.W;
    G.H = L.H;

    // House placement in center
    G.house = { x: G.W / 2 - 85, y: G.H / 2 - 65, w: 170, h: 130 };
    G.obs.push({ x: G.house.x, y: G.house.y, w: 170, h: 130, t: 3 });

    const st = { x: 300, y: G.H - 300 };
    const hc = { x: G.W / 2, y: G.H / 2 };
    G.keys = [];

    // Keys generation
    while (G.keys.length < 3) {
      const k = { x: R(200, G.W - 200), y: R(200, G.H - 200), got: 0 };
      if (D(k, st) > L.kd && D(k, hc) > 500 && G.keys.every((o) => D(o, k) > 1000)) {
        G.keys.push(k);
      }
    }

    // Hazards
    for (let i = 0; i < L.nhaz; i++) {
      const z = { x: R(200, G.W - 200), y: R(200, G.H - 200), r: R(90, 170) };
      if (D(z, st) > z.r + 400 && D(z, hc) > z.r + 300 && G.keys.every((k) => D(k, z) > z.r + 90)) {
        G.haz.push(z);
      }
    }

    // Obstacles
    for (let i = 0; i < L.nobs; i++) {
      const w = R(60, 130);
      const h = R(60, 130);
      const o = { x: R(60, G.W - 200), y: R(60, G.H - 200), w, h, t: i % 3 };
      const c = { x: o.x + w / 2, y: o.y + h / 2 };
      if (D(c, st) > 260 && D(c, hc) > 330 && G.keys.every((k) => D(c, k) > 170)) {
        G.obs.push(o);
      }
    }

    // Shotgun pickup if not owned
    const pw = G.P && keepP ? G.P.weapons.slice() : (['pistol'] as WeaponType[]);
    if (!pw.includes('shotgun')) {
      for (let i = 0; i < 400; i++) {
        const q = { x: R(300, G.W - 300), y: R(300, G.H - 300) };
        if (
          D(q, st) > 950 &&
          D(q, hc) > 420 &&
          !inObs(q.x, q.y, 45) &&
          !G.haz.some((z) => D(z, q) < z.r + 70) &&
          G.keys.every((k) => D(k, q) > 220)
        ) {
          G.pickups.push({ x: q.x, y: q.y, type: 'shotgun' });
          break;
        }
      }
    }

    // Player stats from RPG upgrades
    const maxHp = 100 + stats.upgrades.maxHp * 10;
    const speed = BASE_CFG.pSpeed * (1 + stats.upgrades.moveSpeed * 0.04);
    const startBombs = stats.upgrades.startBombs;
    G.nBombs = keepP ? G.nBombs : startBombs;

    G.P = {
      x: st.x,
      y: st.y,
      r: 16,
      hp: keepP && G.P ? Math.min(maxHp, G.P.hp + 40) : maxHp,
      maxHp,
      cd: 0,
      inv: 0,
      ang: 0,
      weapons: pw,
      wep: G.P && keepP ? Math.min(G.P.wep, pw.length - 1) : 0,
      speed,
      baseDmg: BASE_CFG.pDmg * (1 + stats.upgrades.damage * 0.05),
    };

    G.cam = { x: G.P.x - 600, y: G.P.y - 500 };
    fillBombs();

    // Turrets in phase 3
    let nTur = 0;
    for (let i = 0; i < L.tur * 4 && nTur < L.tur; i++) {
      const q = { x: R(200, G.W - 200), y: R(200, G.H - 200) };
      if (D(q, st) > 700 && D(q, hc) > 250 && !inObs(q.x, q.y, 40) && !G.haz.some((z) => D(z, q) < z.r + 30)) {
        spawnEnemy('turret', q.x, q.y);
        nTur++;
      }
    }

    say(L.tip, 4.5);
  }, [stats.upgrades, fillBombs, inObs, say, spawnEnemy]);

  const enterArena = useCallback(() => {
    const G = gameStateRef.current;
    sound.enter();
    G.mode = 'arena';
    G.W = 1200;
    G.H = 1000;
    G.fade = 1;
    G.obs = [
      [300, 300],
      [800, 300],
      [300, 650],
      [800, 650],
    ].map((p) => ({ x: p[0], y: p[1], w: 100, h: 100, t: 0 }));

    G.en = [];
    G.ebul = [];
    G.bullets = [];
    G.drops = [];
    G.pickups = [];
    G.haz = LV_DATA[Math.min(G.level, 3) - 1].nhaz
      ? [
          { x: 210, y: 790, r: 75 },
          { x: 990, y: 790, r: 75 },
          { x: 600, y: 520, r: 60 },
        ]
      : [];

    if (G.P) {
      G.P.x = 600;
      G.P.y = 900;
    }
    G.cam.x = 0;
    G.cam.y = 0;
    G.bombs = [];
    G.blasts = [];
    fillBombs();

    const mx = BASE_CFG.bossHp * (1 + 0.3 * (G.level - 1));
    G.boss = {
      kind: Math.min(G.level, 3),
      x: 600,
      y: 200,
      r: [54, 46, 72][Math.min(G.level, 3) - 1],
      hp: mx,
      max: mx,
      t: 0,
      p2: 0,
      state: 'idle',
      a1: 2,
      a2: 3,
      a3: 6,
      a4: 4,
      wT: 0,
      dT: 0,
      vx: 0,
      vy: 0,
      dead: 0,
    };

    say('¡El guardián despierta! ¡Prepárate para la batalla!', 3);
  }, [fillBombs, say]);

  const interact = useCallback(() => {
    const G = gameStateRef.current;
    if (G.mode !== 'world' || !G.P) return;
    const c = { x: G.house.x + G.house.w / 2, y: G.house.y + G.house.h / 2 };
    if (D(G.P, c) > 190) return;

    if (G.got < 3) {
      say(`Necesitas las 3 llaves sagradas (${G.got}/3)`, 2.5);
      sound.hurt();
    } else {
      enterArena();
    }
  }, [enterArena, say]);

  // Boss updates
  const updateBoss = (dt: number) => {
    const G = gameStateRef.current;
    const b = G.boss;
    if (!b || !G.P) return;
    b.t += dt;

    if (!b.p2 && b.hp < b.max / 2) {
      b.p2 = 1;
      say('¡El jefe se enfurece! Fase 2 Desatada', 2.5);
      sound.playTone(90, 0.6, 'sawtooth', 0.12, 200);
      G.shake = settings.quality === 'low' ? 6 : 20;
    }

    const p2 = b.p2;
    const ang = Math.atan2(G.P.y - b.y, G.P.x - b.x);

    if (b.kind === 2) {
      // Spectre: Teleportation & fan shots
      if ((b.a4 -= dt) <= 0) {
        b.a4 = p2 ? 2.2 : 3.2;
        const a = R(0, 6.28);
        b.x = Math.max(80, Math.min(1120, G.P.x + Math.cos(a) * 300));
        b.y = Math.max(80, Math.min(920, G.P.y + Math.sin(a) * 300));
        burstParticles(b.x, b.y, '#9be7ff', 16);
        sound.playTone(500, 0.3, 'sine', 0.08, -300);
        const q = Math.atan2(G.P.y - b.y, G.P.x - b.x);
        for (let i = -2; i <= 2; i++) {
          enemyShoot(b.x, b.y, q + i * 0.2, 420, 10);
        }
      }
      if ((b.a2 -= dt) <= 0) {
        b.a2 = p2 ? 1.8 : 3;
        for (let i = 0; i < 14; i++) {
          enemyShoot(b.x, b.y, (i / 14) * 6.28 + b.t, 230, 8);
        }
      }
      if (p2 && (b.a3 -= dt) <= 0) {
        b.a3 = 5;
        if (G.en.length < 7) {
          for (let i = 0; i < 3; i++) {
            spawnEnemy('bat', b.x + R(-60, 60), b.y + R(-60, 60));
          }
        }
      }
    } else if (b.kind === 3) {
      // Magma Colossus: Spirals, brutes
      b.x += Math.cos(ang) * 40 * dt;
      b.y += Math.sin(ang) * 40 * dt;
      if ((b.a1 -= dt) <= 0) {
        b.a1 = p2 ? 0.12 : 0.18;
        b.sp = (b.sp || 0) + 0.35;
        enemyShoot(b.x, b.y, b.sp, 300, 7);
        enemyShoot(b.x, b.y, b.sp + 3.14, 300, 7);
        if (p2) {
          enemyShoot(b.x, b.y, b.sp + 1.57, 300, 7);
          enemyShoot(b.x, b.y, b.sp - 1.57, 300, 7);
        }
      }
      if ((b.a3 -= dt) <= 0) {
        b.a3 = 7;
        if (p2 && G.en.length < 4) {
          spawnEnemy('brute', b.x, b.y + 90);
        }
      }
      if ((b.a2 -= dt) <= 0) {
        b.a2 = 4;
        for (let i = -3; i <= 3; i++) {
          enemyShoot(b.x, b.y, ang + i * 0.18, 420, 12);
        }
      }
    } else {
      // Guardian of the Forest
      if (b.state === 'idle') {
        b.x += (600 + Math.sin(b.t * 0.8) * 380 - b.x) * dt * 2;
        b.y += (230 + Math.sin(b.t * 1.3) * 70 - b.y) * dt * 2;
        if ((b.a1 -= dt) <= 0) {
          b.a1 = p2 ? 0.9 : 1.4;
          for (let i = -1; i <= 1; i++) {
            enemyShoot(b.x, b.y, ang + i * 0.26, 380, 10);
          }
        }
        if ((b.a2 -= dt) <= 0) {
          b.a2 = p2 ? 2.2 : 3.6;
          const n = p2 ? 18 : 12;
          for (let i = 0; i < n; i++) {
            enemyShoot(b.x, b.y, (i / n) * 6.28 + b.t, 260, 8);
          }
        }
        if (p2) {
          if ((b.a3 -= dt) <= 0) {
            b.a3 = 6;
            if (G.en.length < 5) {
              spawnEnemy('chaser', b.x - 60, b.y + 40);
              spawnEnemy('chaser', b.x + 60, b.y + 40);
            }
          }
          if ((b.a4 -= dt) <= 0) {
            b.state = 'wind';
            b.wT = 0.6;
            b.vx = Math.cos(ang) * 680;
            b.vy = Math.sin(ang) * 680;
          }
        }
      } else if (b.state === 'wind') {
        if ((b.wT -= dt) <= 0) {
          b.state = 'dash';
          b.dT = 0.7;
          sound.playTone(120, 0.5, 'sawtooth', 0.1, 100);
        }
      } else {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.x = Math.max(70, Math.min(1130, b.x));
        b.y = Math.max(70, Math.min(930, b.y));
        if ((b.dT -= dt) <= 0) {
          b.state = 'idle';
          b.a4 = 4;
        }
      }
    }

    if (D(b, G.P) < b.r + G.P.r) {
      hurtPlayer(BASE_CFG.bossContact);
    }

    if (b.hp <= 0) {
      b.dead = 1;
      burstParticles(b.x, b.y, '#ffd23f', 70);
      burstParticles(b.x, b.y, '#ff5a4d', 50);
      sound.bossDie();
      G.en = [];
      G.ebul = [];
      G.winT = 2.0;
      G.shake = settings.quality === 'low' ? 8 : 30;
      G.boss = null;
      say('¡JEFE DERROTADO! ¡Victoria gloriosa!', 3.5);

      // Huge rewards
      const bossXp = 450 * G.level;
      const bossGold = 250 * G.level;
      G.score += 5000 * G.level;
      const res = StorageManager.addXpAndGold(bossXp, bossGold);
      onStatsUpdate(res.newStats);
      StorageManager.updateChallengeProgress('boss', 1);

      addFloatText(600, 300, `+${bossXp} XP  +${bossGold} Oro`, '#ffd23f');
      if (res.leveledUp) {
        sound.levelUp();
      }
    }
  };

  // Push helper for obstacles
  const pushObstacles = (o: { x: number; y: number }, r: number) => {
    const G = gameStateRef.current;
    for (const k of G.obs) {
      const cx = Math.max(k.x, Math.min(o.x, k.x + k.w));
      const cy = Math.max(k.y, Math.min(o.y, k.y + k.h));
      const dx = o.x - cx;
      const dy = o.y - cy;
      const d = Math.hypot(dx, dy);
      if (d < r) {
        if (d > 0) {
          o.x += (dx / d) * (r - d);
          o.y += (dy / d) * (r - d);
        } else {
          o.x += r;
        }
      }
    }
    o.x = Math.max(r, Math.min(G.W - r, o.x));
    o.y = Math.max(r, Math.min(G.H - r, o.y));
  };

  const hitObstacle = (b: { x: number; y: number }) => {
    const G = gameStateRef.current;
    return (
      G.obs.some((k) => b.x > k.x && b.x < k.x + k.w && b.y > k.y && b.y < k.y + k.h) ||
      b.x < 0 ||
      b.y < 0 ||
      b.x > G.W ||
      b.y > G.H
    );
  };

  // Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const X = canvas.getContext('2d');
    if (!X) return;

    initPhase(initialPhase);

    let animationId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const G = gameStateRef.current;
      const rawDt = (currentTime - lastTime) / 1000 || 0;
      lastTime = currentTime;
      const dt = Math.min(rawDt, 0.05);

      // FPS tracking
      G.fpsCount++;
      G.fpsTimer += rawDt;
      if (G.fpsTimer >= 1.0) {
        G.fps = G.fpsCount;
        G.fpsCount = 0;
        G.fpsTimer = 0;
      }

      if (!isPaused && G.P) {
        G.t += dt;
        G.timeSeconds += dt;

        // Player Movement
        let mx = (G.keysPressed['d'] || G.keysPressed['arrowright'] ? 1 : 0) -
                 (G.keysPressed['a'] || G.keysPressed['arrowleft'] ? 1 : 0);
        let my = (G.keysPressed['s'] || G.keysPressed['arrowdown'] ? 1 : 0) -
                 (G.keysPressed['w'] || G.keysPressed['arrowup'] ? 1 : 0);

        // Virtual joystick support
        if (G.touchMove.active) {
          const dx = G.touchMove.currX - G.touchMove.startX;
          const dy = G.touchMove.currY - G.touchMove.startY;
          const dist = Math.hypot(dx, dy);
          if (dist > 10) {
            mx = dx / dist;
            my = dy / dist;
          }
        }

        const m = Math.hypot(mx, my) || 1;
        const curLvl = LV_DATA[Math.min(G.level, 3) - 1];

        if (G.winT <= 0) {
          G.P.x += (mx / m) * G.P.speed * curLvl.spd * dt;
          G.P.y += (my / m) * G.P.speed * curLvl.spd * dt;
          pushObstacles(G.P, G.P.r);
        }

        // Aim angle
        if (G.touchAim.active) {
          G.P.ang = Math.atan2(G.touchAim.dirY, G.touchAim.dirX);
        } else {
          G.P.ang = Math.atan2(G.mouse.y + G.cam.y - G.P.y, G.mouse.x + G.cam.x - G.P.x);
        }

        G.P.cd -= dt;
        G.P.inv -= dt;

        // Continuous shooting (mouse click or space or touch fire)
        if ((G.mouseDown || G.keysPressed[' '] || G.isShooting) && G.P.cd <= 0 && G.winT <= 0) {
          firePlayerWeapon();
        }

        // Hazard damage in magma phase
        for (const z of G.haz) {
          if (D(z, G.P) < z.r && G.winT <= 0) {
            G.P.hp -= 16 * dt;
            G.flash = Math.max(G.flash, 0.12);
            if (Math.random() < dt * 6) {
              sound.playTone(110, 0.08, 'sawtooth', 0.03);
            }
            if (G.P.hp <= 0) {
              hurtPlayer(1);
            }
          }
        }

        // Embers in high quality
        if (curLvl.embers && settings.quality !== 'low' && Math.random() < dt * 25) {
          G.parts.push({
            x: G.cam.x + R(0, 1200),
            y: G.cam.y + 1000,
            vx: R(-20, 20),
            vy: -R(60, 140),
            l: R(1, 2),
            c: '#ff9a3d',
          });
        }

        // Aura trail for player movement
        if (equipped.auraId !== 'none' && (mx !== 0 || my !== 0)) {
          const aura = DEFAULT_AURAS.find((a) => a.id === equipped.auraId);
          if (aura && Math.random() < 0.4) {
            G.parts.push({
              x: G.P.x + R(-8, 8),
              y: G.P.y + R(5, 15),
              vx: R(-15, 15),
              vy: R(-10, 10),
              l: 0.5,
              c: aura.color,
            });
          }
        }

        // Bullets update
        for (const b of G.bullets) {
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.l -= dt;
          if (hitObstacle(b)) {
            b.l = 0;
            burstParticles(b.x, b.y, '#ddd', 3);
            continue;
          }
          for (const e of G.en) {
            if (e.hp > 0 && D(b, e) < e.r + 5) {
              e.hp -= b.dmg;
              b.l = 0;
              burstParticles(b.x, b.y, '#fff', 4);
              if (e.hp <= 0) {
                killEnemy(e);
              }
              break;
            }
          }
          if (G.boss && b.l > 0 && D(b, G.boss) < G.boss.r + 5) {
            G.boss.hp -= b.dmg * 0.6;
            b.l = 0;
            burstParticles(b.x, b.y, '#ffd23f', 4);
          }
        }
        G.bullets = G.bullets.filter((b) => b.l > 0);

        // Enemies update
        for (const e of G.en) {
          const c = (BASE_CFG as any)[e.type];
          const a = Math.atan2(G.P.y - e.y, G.P.x - e.x);
          const d = D(e, G.P);
          let vx = 0;
          let vy = 0;

          if (e.type === 'turret') {
            if ((e.cd -= dt) <= 0 && d < 680) {
              e.cd = c.fire;
              for (let i = -1; i <= 1; i++) {
                enemyShoot(e.x, e.y, a + i * 0.3, c.bspd, c.dmg);
              }
            }
          } else if (e.type !== 'shooter') {
            const w = e.type === 'bat' ? Math.sin(G.t * 6 + e.cd * 9) * 130 : 0;
            vx = Math.cos(a) * c.spd + Math.cos(a + 1.57) * w;
            vy = Math.sin(a) * c.spd + Math.sin(a + 1.57) * w;
            if (d < e.r + G.P.r) {
              hurtPlayer(c.dmg);
            }
          } else {
            const s = d > 420 ? 1 : d < 280 ? -1 : 0;
            vx = Math.cos(a) * c.spd * s + Math.cos(a + 1.57) * c.spd * 0.6 * e.dir * (s ? 0 : 1);
            vy = Math.sin(a) * c.spd * s + Math.sin(a + 1.57) * c.spd * 0.6 * e.dir * (s ? 0 : 1);
            if ((e.cd -= dt) <= 0 && d < 700) {
              e.cd = c.fire;
              enemyShoot(e.x, e.y, a, c.bspd, c.dmg);
            }
          }

          e.x += vx * dt;
          e.y += vy * dt;
          pushObstacles(e, e.r);
        }
        G.en = G.en.filter((e) => e.hp > 0);

        // Enemy bullets
        for (const b of G.ebul) {
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.l -= dt;
          if (hitObstacle(b)) {
            b.l = 0;
          } else if (D(b, G.P) < G.P.r + 5) {
            b.l = 0;
            hurtPlayer(b.dmg);
          }
        }
        G.ebul = G.ebul.filter((b) => b.l > 0);

        // Drops (Healing)
        G.drops = G.drops.filter((d) => {
          if (D(d, G.P!) < 30) {
            G.P!.hp = Math.min(G.P!.maxHp, G.P!.hp + BASE_CFG.healAmt);
            sound.heal();
            say(`+${BASE_CFG.healAmt} de vida`, 1.2);
            addFloatText(G.P!.x, G.P!.y - 20, `+${BASE_CFG.healAmt} HP`, '#4ade80');
            return false;
          }
          return true;
        });

        // Bombs pickup
        G.bombs = G.bombs.filter((b) => {
          if (D(b, G.P!) < BOMB_CFG.pick) {
            G.nBombs++;
            sound.heal();
            say(`Bomba recogida (${G.nBombs}). Pulsa [R] para detonar`, 2.5);
            addFloatText(b.x, b.y - 15, '+1 Bomba [R]', '#ff6a4d');
            return false;
          }
          return true;
        });
        fillBombs();

        for (const b of G.blasts) {
          b.l -= dt;
        }
        G.blasts = G.blasts.filter((b) => b.l > 0);

        // Spawning in world
        if (G.mode === 'world') {
          const cap = Math.min(26, curLvl.cap + G.got * 3);
          G.spawnT -= dt;
          if (G.spawnT <= 0 && G.en.length < cap) {
            G.spawnT = Math.max(0.5, curLvl.sp - G.got * 0.3 - G.t / 300);
            const a = R(0, 6.28);
            const x = G.P.x + Math.cos(a) * 820;
            const y = G.P.y + Math.sin(a) * 820;
            if (x >= 40 && y >= 40 && x <= G.W - 40 && y <= G.H - 40 && !inObs(x, y, 30)) {
              let r = Math.random() * curLvl.mix.reduce((u, m) => u + m[1], 0);
              let ty = curLvl.mix[0][0];
              for (const m of curLvl.mix) {
                if ((r -= m[1]) <= 0) {
                  ty = m[0];
                  break;
                }
              }
              if (ty === 'bat') {
                for (let i = 0; i < 3; i++) {
                  spawnEnemy('bat', x + R(-40, 40), y + R(-40, 40));
                }
              } else {
                spawnEnemy(ty, x, y);
              }
            }
          }

          // Pickups (Shotgun)
          G.pickups = G.pickups.filter((p) => {
            if (D(p, G.P!) < 36) {
              if (!G.P!.weapons.includes(p.type)) {
                G.P!.weapons.push(p.type);
                G.P!.wep = G.P!.weapons.indexOf(p.type);
                sound.pick();
                burstParticles(G.P!.x, G.P!.y, '#ffb020', 24);
                say('¡ESCOPETA DESBLOQUEADA! Pulsa [Q] para cambiar', 4);
                addFloatText(G.P!.x, G.P!.y - 30, '¡Escopeta de Dispersión!', '#ffd23f');
              }
              return false;
            }
            return true;
          });

          // Keys pickup
          for (const k of G.keys) {
            if (!k.got && D(k, G.P!) < 32) {
              k.got = 1;
              G.got++;
              sound.key();
              burstParticles(k.x, k.y, '#ffd23f', 20);
              const keyXp = 50;
              const res = StorageManager.addXpAndGold(keyXp, 25);
              onStatsUpdate(res.newStats);
              StorageManager.updateChallengeProgress('keys', 1);

              addFloatText(k.x, k.y - 25, `Llave Sagrada ${G.got}/3 (+${keyXp} XP)`, '#ffd23f');
              say(
                G.got < 3
                  ? `Llave ${G.got}/3 recogida. ¡Sigue la brújula dorada!`
                  : '¡Tienes las 3 llaves! Ve a la casa central y pulsa [E]',
                3.5
              );
            }
          }
        } else if (G.boss) {
          updateBoss(dt);
        }

        // Win Phase Check
        if (G.winT > 0) {
          G.winT -= dt;
          if (G.winT <= 0) {
            if (G.level >= 3) {
              sound.victory();
              StorageManager.recordScore(G.score, Math.floor(G.timeSeconds), 3);
              onVictory(G.score, G.kills);
            } else {
              initPhase(G.level + 1, true);
            }
          }
        }

        // Camera smoothing
        const targetCamX = Math.max(0, Math.min(G.W - 1200, G.P.x - 600));
        const targetCamY = Math.max(0, Math.min(G.H - 1000, G.P.y - 500));
        const camFactor = Math.min(1, dt * 8);
        G.cam.x += (targetCamX - G.cam.x) * camFactor;
        G.cam.y += (targetCamY - G.cam.y) * camFactor;

        // Updates screen effects
        G.shake = Math.max(0, G.shake - dt * 40);
        G.flash = Math.max(0, G.flash - dt);
        G.fade = Math.max(0, G.fade - dt);
        G.txtT -= dt;

        // Floating texts
        for (const ft of G.floatingTexts) {
          ft.y -= 30 * dt;
          ft.life -= dt;
        }
        G.floatingTexts = G.floatingTexts.filter((ft) => ft.life > 0);

        // Particles
        for (const p of G.parts) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.l -= dt;
        }
        G.parts = G.parts.filter((p) => p.l > 0);
      }

      // ----------------------------------------------------
      // DRAW CANVAS
      // ----------------------------------------------------
      X.save();
      X.fillStyle = '#000';
      X.fillRect(0, 0, 1200, 1000);

      if (G.P) {
        const sx = (Math.random() - 0.5) * G.shake;
        const sy = (Math.random() - 0.5) * G.shake;
        X.translate(-Math.round(G.cam.x) + sx, -Math.round(G.cam.y) + sy);

        const curLvl = LV_DATA[Math.min(G.level, 3) - 1];

        // Background terrain
        if (G.mode === 'world') {
          const Z = curLvl.zones;
          for (let i = 0; i < 4; i++) {
            X.fillStyle = Z[i];
            X.fillRect((i % 2) * (G.W / 2), (i >> 1) * (G.H / 2), G.W / 2, G.H / 2);
          }
          X.fillStyle = 'rgba(255,255,255,0.06)';
          for (let x = Math.floor(G.cam.x / 100) * 100; x < G.cam.x + 1300; x += 100) {
            for (let y = Math.floor(G.cam.y / 100) * 100; y < G.cam.y + 1100; y += 100) {
              X.fillRect(x, y, 4, 4);
            }
          }
        } else {
          // Arena floor
          for (let x = 0; x < 12; x++) {
            for (let y = 0; y < 10; y++) {
              X.fillStyle = (x + y) % 2 ? curLvl.ar[0] : curLvl.ar[1];
              X.fillRect(x * 100, y * 100, 100, 100);
            }
          }
          X.strokeStyle = curLvl.ar[2];
          X.lineWidth = 6;
          X.strokeRect(3, 3, G.W - 6, G.H - 6);
        }

        // Hazards (Magma pools)
        for (const z of G.haz) {
          if (settings.quality === 'low') {
            X.fillStyle = '#ff5a2a';
            X.beginPath();
            X.arc(z.x, z.y, z.r, 0, 6.28);
            X.fill();
          } else {
            const g = X.createRadialGradient(z.x, z.y, z.r * 0.2, z.x, z.y, z.r);
            g.addColorStop(0, '#ffe36b');
            g.addColorStop(0.6, '#ff7a1a');
            g.addColorStop(1, '#b3210d');
            X.fillStyle = g;
            X.globalAlpha = 0.85 + Math.sin(G.t * 3 + z.x) * 0.1;
            X.beginPath();
            X.arc(z.x, z.y, z.r, 0, 6.28);
            X.fill();
            X.globalAlpha = 1;
          }
        }

        // Obstacles
        for (const k of G.obs) {
          if (k.x > G.cam.x + 1200 || k.y > G.cam.y + 1000 || k.x + k.w < G.cam.x || k.y + k.h < G.cam.y) continue;
          if (k.t === 0) {
            X.fillStyle = curLvl.pal.r[0];
            X.fillRect(k.x, k.y, k.w, k.h);
            X.fillStyle = curLvl.pal.r[1];
            X.fillRect(k.x, k.y, k.w, 8);
            X.fillRect(k.x, k.y, 8, k.h);
          } else if (k.t === 1) {
            X.fillStyle = curLvl.pal.c[0];
            X.fillRect(k.x, k.y, k.w, k.h);
            X.strokeStyle = curLvl.pal.c[1];
            X.lineWidth = 5;
            X.strokeRect(k.x + 3, k.y + 3, k.w - 6, k.h - 6);
            X.beginPath();
            X.moveTo(k.x, k.y);
            X.lineTo(k.x + k.w, k.y + k.h);
            X.moveTo(k.x + k.w, k.y);
            X.lineTo(k.x, k.y + k.h);
            X.stroke();
          } else if (k.t === 2) {
            X.fillStyle = curLvl.pal.c[1];
            X.fillRect(k.x + k.w / 2 - 8, k.y + k.h / 2, 16, k.h / 2);
            X.fillStyle = curLvl.pal.t[0];
            X.beginPath();
            X.arc(k.x + k.w / 2, k.y + k.h / 2, Math.min(k.w, k.h) / 2 + 4, 0, 6.28);
            X.fill();
            X.fillStyle = curLvl.pal.t[1];
            X.beginPath();
            X.arc(k.x + k.w / 2 - 8, k.y + k.h / 2 - 8, Math.min(k.w, k.h) / 4, 0, 6.28);
            X.fill();
          }
        }

        // House
        if (G.mode === 'world') {
          const h = G.house;
          const ok = G.got >= 3;
          X.fillStyle = curLvl.pal.wall;
          X.fillRect(h.x, h.y, h.w, h.h);
          X.fillStyle = curLvl.pal.roof;
          X.beginPath();
          X.moveTo(h.x - 14, h.y + 34);
          X.lineTo(h.x + h.w / 2, h.y - 40);
          X.lineTo(h.x + h.w + 14, h.y + 34);
          X.fill();
          X.fillStyle = ok ? '#3ddc84' : '#d63a2f';
          X.fillRect(h.x + h.w / 2 - 18, h.y + h.h - 60, 36, 60);
          X.fillStyle = '#fff';
          X.font = 'bold 16px monospace';
          X.textAlign = 'center';
          X.fillText(ok ? 'ABIERTA [E]' : 'CERRADA', h.x + h.w / 2, h.y + h.h + 22);

          // Keys on map
          for (const k of G.keys) {
            if (!k.got) {
              const y = k.y + Math.sin(G.t * 4) * 5;
              X.fillStyle = 'rgba(255,210,63,0.3)';
              X.beginPath();
              X.arc(k.x, y, 30, 0, 6.28);
              X.fill();
              X.strokeStyle = '#ffd23f';
              X.fillStyle = '#ffd23f';
              X.lineWidth = 5;
              X.beginPath();
              X.arc(k.x - 8, y, 9, 0, 6.28);
              X.stroke();
              X.fillRect(k.x, y - 2.5, 22, 5);
              X.fillRect(k.x + 14, y, 4, 9);
              X.fillRect(k.x + 20, y, 4, 6);
            }
          }
        }

        // Weapon Pickups
        for (const p of G.pickups) {
          const yy = p.y + Math.sin(G.t * 3) * 4;
          X.fillStyle = 'rgba(255,176,32,0.25)';
          X.beginPath();
          X.arc(p.x, yy, 34, 0, 6.28);
          X.fill();
          X.strokeStyle = '#ffb020';
          X.lineWidth = 3;
          X.beginPath();
          X.arc(p.x, yy, 25, 0, 6.28);
          X.stroke();
          X.save();
          X.translate(p.x, yy);
          X.rotate(-0.35);
          X.fillStyle = '#2b2b30';
          X.fillRect(-18, -3, 32, 6);
          X.fillRect(-4, 2, 9, 9);
          X.fillStyle = '#8a5a2b';
          X.fillRect(-22, 1, 12, 8);
          X.fillStyle = '#ffd23f';
          X.fillRect(12, -3, 4, 6);
          X.restore();
          X.fillStyle = '#ffb020';
          X.font = 'bold 14px monospace';
          X.textAlign = 'center';
          X.fillText('ESCOPETA', p.x, yy + 44);
        }

        // Health drops
        for (const d of G.drops) {
          X.fillStyle = '#3ddc84';
          X.fillRect(d.x - 4, d.y - 12, 8, 24);
          X.fillRect(d.x - 12, d.y - 4, 24, 8);
        }

        // Enemies
        for (const e of G.en) {
          X.fillStyle = e.type === 'chaser' ? '#e0483b' : '#a04ee0';
          if (e.type === 'turret') {
            X.fillStyle = '#555';
            X.fillRect(e.x - e.r, e.y - e.r, e.r * 2, e.r * 2);
            X.save();
            X.translate(e.x, e.y);
            X.rotate(Math.atan2(G.P.y - e.y, G.P.x - e.x));
            X.fillStyle = '#ff6a2a';
            X.fillRect(0, -5, 28, 10);
            X.restore();
          } else if (e.type === 'bat') {
            X.fillStyle = '#7a5cff';
            X.beginPath();
            X.arc(e.x, e.y, e.r, 0, 6.28);
            X.fill();
            const w = Math.sin(G.t * 25 + e.cd * 9) * 8;
            X.fillRect(e.x - 24, e.y - 4 - w, 16, 5);
            X.fillRect(e.x + 8, e.y - 4 - w, 16, 5);
            X.fillStyle = '#fff';
            X.fillRect(e.x - 5, e.y - 3, 3, 3);
            X.fillRect(e.x + 2, e.y - 3, 3, 3);
          } else if (e.type === 'brute') {
            X.fillStyle = '#c4551d';
            X.beginPath();
            X.arc(e.x, e.y, e.r, 0, 6.28);
            X.fill();
            X.fillStyle = '#ffd23f';
            X.fillRect(e.x - e.r + 2, e.y - e.r - 4, 8, 12);
            X.fillRect(e.x + e.r - 10, e.y - e.r - 4, 8, 12);
            X.fillStyle = '#111';
            X.fillRect(e.x - 12, e.y - 6, 8, 8);
            X.fillRect(e.x + 4, e.y - 6, 8, 8);
          } else if (e.type === 'chaser') {
            X.beginPath();
            X.arc(e.x, e.y, e.r, 0, 6.28);
            X.fill();
            X.fillStyle = '#fff';
            X.fillRect(e.x - 8, e.y - 5, 5, 5);
            X.fillRect(e.x + 3, e.y - 5, 5, 5);
          } else {
            X.fillRect(e.x - e.r, e.y - e.r, e.r * 2, e.r * 2);
            X.fillStyle = '#fff';
            X.fillRect(e.x - 4, e.y - 4, 8, 8);
          }
          // Health bar
          X.fillStyle = '#000';
          X.fillRect(e.x - 16, e.y - e.r - 10, 32, 5);
          X.fillStyle = '#3ddc84';
          X.fillRect(e.x - 16, e.y - e.r - 10, (32 * e.hp) / e.max, 5);
        }

        // Boss
        if (G.boss) {
          const b = G.boss;
          if (b.state === 'wind') {
            X.strokeStyle = 'rgba(255,60,40,0.6)';
            X.lineWidth = b.r * 1.6;
            X.beginPath();
            X.moveTo(b.x, b.y);
            X.lineTo(b.x + b.vx * 0.7, b.y + b.vy * 0.7);
            X.stroke();
          }
          X.fillStyle = BOSS_COLORS[b.kind - 1][b.p2 ? 1 : 0];
          X.beginPath();
          X.arc(b.x, b.y, b.r, 0, 6.28);
          X.fill();
          X.strokeStyle = '#ffd23f';
          X.lineWidth = 5;
          X.stroke();
          X.fillStyle = '#ffd23f';
          X.fillRect(b.x - 26, b.y - 14, 16, 10);
          X.fillRect(b.x + 10, b.y - 14, 16, 10);
          X.fillStyle = '#111';
          X.fillRect(b.x - 22, b.y + 14, 44, 8);
        }

        // Bullets
        for (const b of G.bullets) {
          X.fillStyle = b.c || '#ffe66b';
          X.beginPath();
          X.arc(b.x, b.y, b.r || 5, 0, 6.28);
          X.fill();
        }
        X.fillStyle = '#ff8a3d';
        for (const b of G.ebul) {
          X.beginPath();
          X.arc(b.x, b.y, 6, 0, 6.28);
          X.fill();
        }

        // Bombs on floor
        for (const b of G.bombs) {
          const yy = b.y + Math.sin(G.t * 3 + b.x) * 3;
          X.fillStyle = 'rgba(255,60,40,' + (0.18 + 0.1 * Math.sin(G.t * 6)) + ')';
          X.beginPath();
          X.arc(b.x, yy, 32, 0, 6.28);
          X.fill();
          X.fillStyle = '#1a1a1f';
          X.beginPath();
          X.arc(b.x, yy, 15, 0, 6.28);
          X.fill();
          X.strokeStyle = '#888';
          X.lineWidth = 3;
          X.stroke();
          X.fillStyle = '#fff';
          X.fillRect(b.x - 8, yy - 9, 5, 5);
          X.strokeStyle = '#c8a15a';
          X.beginPath();
          X.moveTo(b.x + 4, yy - 14);
          X.quadraticCurveTo(b.x + 12, yy - 24, b.x + 18, yy - 18);
          X.stroke();
          X.fillStyle = Math.floor(G.t * 10) % 2 ? '#ffd23f' : '#ff5a2a';
          X.fillRect(b.x + 16, yy - 22, 6, 6);
        }

        // Bomb blast waves
        for (const b of G.blasts) {
          const f = 1 - b.l / 0.5;
          X.fillStyle = 'rgba(255,190,70,' + 0.5 * (1 - f) + ')';
          X.beginPath();
          X.arc(b.x, b.y, BOMB_CFG.r * (0.3 + 0.7 * f), 0, 6.28);
          X.fill();
          X.strokeStyle = 'rgba(255,120,30,' + (1 - f) + ')';
          X.lineWidth = 8;
          X.beginPath();
          X.arc(b.x, b.y, BOMB_CFG.r * f + 4, 0, 6.28);
          X.stroke();
        }

        // ==========================================
        // PLAYER DRAWING WITH AVATAR CUSTOMIZATION
        // ==========================================
        if (G.P.inv <= 0 || Math.floor(G.t * 20) % 2) {
          // Shadow
          X.fillStyle = 'rgba(0,0,0,0.3)';
          X.beginPath();
          X.ellipse(G.P.x, G.P.y + 20, 17, 6, 0, 0, 6.28);
          X.fill();

          const fl = Math.cos(G.P.ang) > 0;
          X.imageSmoothingEnabled = false;
          X.save();
          X.translate(G.P.x, G.P.y + 21);
          if (fl) X.scale(-1, 1);

          // Base Sprite
          if (SPR.complete && SPR.naturalWidth) {
            X.drawImage(SPR, -SPR.width * 0.5, -SPR.height * 0.95, SPR.width, SPR.height);
          }

          // Skin Tint Overlay
          const skin = DEFAULT_SKINS.find((s) => s.id === equipped.skinId);
          if (skin && skin.tintRgba !== 'rgba(255, 255, 255, 0)') {
            X.fillStyle = skin.tintRgba;
            X.beginPath();
            X.ellipse(0, -SPR.height * 0.5, 12, 18, 0, 0, 6.28);
            X.fill();
          }

          // Hat / Headgear rendering
          const hat = DEFAULT_HATS.find((h) => h.id === equipped.hatId);
          if (hat && hat.drawType !== 'none') {
            const headY = -SPR.height * 0.92;
            if (hat.drawType === 'crown') {
              // Imperial Gold Crown
              X.fillStyle = '#ffd23f';
              X.strokeStyle = '#b45309';
              X.lineWidth = 1.5;
              X.beginPath();
              X.moveTo(-10, headY);
              X.lineTo(-12, headY - 10);
              X.lineTo(-6, headY - 6);
              X.lineTo(0, headY - 14);
              X.lineTo(6, headY - 6);
              X.lineTo(12, headY - 10);
              X.lineTo(10, headY);
              X.closePath();
              X.fill();
              X.stroke();
              // Jewels
              X.fillStyle = '#ef4444';
              X.fillRect(-2, headY - 8, 4, 4);
              X.fillStyle = '#3b82f6';
              X.fillRect(-9, headY - 5, 3, 3);
              X.fillRect(6, headY - 5, 3, 3);
            } else if (hat.drawType === 'fedora') {
              // Explorer Fedora
              X.fillStyle = hat.color;
              X.fillRect(-15, headY - 2, 30, 4);
              X.fillRect(-10, headY - 10, 20, 9);
              X.fillStyle = '#1e1b4b';
              X.fillRect(-10, headY - 4, 20, 2);
            } else if (hat.drawType === 'horns') {
              // Valkyrie horns
              X.fillStyle = '#94a3b8';
              X.fillRect(-8, headY - 2, 16, 5);
              X.fillStyle = '#f8fafc';
              X.beginPath();
              X.moveTo(-8, headY);
              X.quadraticCurveTo(-18, headY - 8, -14, headY - 16);
              X.lineTo(-6, headY - 4);
              X.fill();
              X.beginPath();
              X.moveTo(8, headY);
              X.quadraticCurveTo(18, headY - 8, 14, headY - 16);
              X.lineTo(6, headY - 4);
              X.fill();
            } else if (hat.drawType === 'bandana') {
              // Crimson combat bandana
              X.fillStyle = hat.color;
              X.fillRect(-9, headY + 2, 18, 5);
              X.fillRect(7, headY + 4, 10, 3);
              X.fillRect(10, headY + 7, 8, 3);
            } else if (hat.drawType === 'visor') {
              // Cyber Holo Visor
              X.fillStyle = '#06b6d4';
              X.fillRect(-10, headY + 4, 20, 4);
              X.fillStyle = 'rgba(6, 182, 212, 0.4)';
              X.fillRect(-12, headY + 2, 24, 8);
            } else if (hat.drawType === 'halo') {
              // Angel Halo
              X.strokeStyle = '#fef08a';
              X.lineWidth = 3;
              X.beginPath();
              X.ellipse(0, headY - 12, 12, 4, 0, 0, 6.28);
              X.stroke();
            }
          }

          X.restore();

          // Weapon in Hand
          const sh = G.P.weapons[G.P.wep] === 'shotgun';
          const weaponSkin = DEFAULT_WEAPON_SKINS.find((w) => w.id === equipped.weaponSkinId);
          const gunColor = weaponSkin ? weaponSkin.color : sh ? '#3a2a18' : '#222';

          X.save();
          X.translate(G.P.x, G.P.y - 14);
          X.rotate(G.P.ang);
          X.fillStyle = gunColor;
          X.fillRect(10, -3, sh ? 30 : 22, sh ? 8 : 6);
          X.fillStyle = weaponSkin ? weaponSkin.bulletColor : '#ffd23f';
          X.fillRect(sh ? 36 : 28, -3, 4, 6);
          X.restore();
        }

        // Particle System
        for (const p of G.parts) {
          X.globalAlpha = Math.min(1, p.l * 2);
          X.fillStyle = p.c;
          X.fillRect(p.x - 3, p.y - 3, 6, 6);
        }
        X.globalAlpha = 1;

        // Floating texts (+XP, +Gold, -Dmg)
        for (const ft of G.floatingTexts) {
          X.globalAlpha = Math.min(1, ft.life);
          X.fillStyle = ft.color;
          X.font = 'bold 18px monospace';
          X.textAlign = 'center';
          X.fillText(ft.text, ft.x, ft.y);
        }
        X.globalAlpha = 1;
      }

      X.restore();

      // ==========================================
      // DARKNESS OVERLAY (Crypt Phase)
      // ==========================================
      if (G.P && LV_DATA[Math.min(G.level, 3) - 1].dark) {
        const px = G.P.x - G.cam.x;
        const py = G.P.y - G.cam.y - 10;
        const r = G.mode === 'arena' ? 520 : 260;

        if (settings.quality === 'low') {
          // Fast low-end dark box cutout
          X.fillStyle = 'rgba(2,3,12,0.95)';
          X.beginPath();
          X.rect(0, 0, 1200, 1000);
          X.arc(px, py, r * 0.9, 0, Math.PI * 2, true);
          X.fill();
        } else {
          // Smooth radial gradient
          const g = X.createRadialGradient(px, py, r * 0.35, px, py, r * 1.7);
          g.addColorStop(0, 'rgba(2,3,12,0)');
          g.addColorStop(1, 'rgba(2,3,12,0.96)');
          X.fillStyle = g;
          X.fillRect(0, 0, 1200, 1000);
        }

        // Key & Pickup glow spots in dark
        if (G.mode === 'world') {
          for (const k of G.keys) {
            if (!k.got && D(k, G.P) < 750) {
              X.fillStyle = 'rgba(255,210,63,0.35)';
              X.beginPath();
              X.arc(k.x - G.cam.x, k.y - G.cam.y, 24 + Math.sin(G.t * 5) * 4, 0, 6.28);
              X.fill();
            }
          }
          for (const p of G.pickups) {
            if (D(p, G.P) < 900) {
              X.fillStyle = 'rgba(255,176,32,0.35)';
              X.beginPath();
              X.arc(p.x - G.cam.x, p.y - G.cam.y, 22 + Math.sin(G.t * 5) * 4, 0, 6.28);
              X.fill();
            }
          }
        }
      }

      // ==========================================
      // MINIMAP & NAVIGATION
      // ==========================================
      if (G.P && G.mode === 'world') {
        const mw = 220;
        const mh = (mw * G.H) / G.W;
        const mx = 1200 - mw - 20;
        const my = 1000 - mh - 20;
        const s = mw / G.W;

        X.fillStyle = 'rgba(8,12,8,0.85)';
        X.fillRect(mx, my, mw, mh);
        X.strokeStyle = '#ffd23f';
        X.lineWidth = 2;
        X.strokeRect(mx, my, mw, mh);

        // House
        X.fillStyle = '#d9c08a';
        X.fillRect(mx + G.house.x * s - 3, my + G.house.y * s - 3, 9, 9);

        // Pickups & Bombs
        for (const p of G.pickups) {
          X.fillStyle = '#ffb020';
          X.fillRect(mx + p.x * s - 3, my + p.y * s - 3, 7, 7);
        }
        for (const b of G.bombs) {
          X.fillStyle = '#ff5a4d';
          X.beginPath();
          X.arc(mx + b.x * s, my + b.y * s, 3.5, 0, 6.28);
          X.fill();
        }

        // Keys on minimap if nearby
        for (const k of G.keys) {
          if (!k.got && D(k, G.P) < 1300) {
            X.fillStyle = '#ffd23f';
            X.font = 'bold 12px monospace';
            X.fillText('🔑', mx + k.x * s - 6, my + k.y * s + 5);
          }
        }

        // Camera box & player
        X.strokeStyle = 'rgba(255,255,255,0.5)';
        X.strokeRect(mx + G.cam.x * s, my + G.cam.y * s, 1200 * s, 1000 * s);
        X.fillStyle = '#38bdf8';
        X.fillRect(mx + G.P.x * s - 3, my + G.P.y * s - 3, 7, 7);

        // Golden Compass Arrow towards closest key or house
        const target =
          G.got >= 3
            ? { x: G.house.x + G.house.w / 2, y: G.house.y + G.house.h / 2 }
            : G.keys.filter((k) => !k.got).sort((a, b) => D(a, G.P!) - D(b, G.P!))[0];

        if (target) {
          const a = Math.atan2(target.y - G.P.y, target.x - G.P.x);
          X.save();
          X.translate(600 + Math.cos(a) * 190, 500 + Math.sin(a) * 190);
          X.rotate(a);
          X.fillStyle = G.got >= 3 ? '#3ddc84' : '#ffd23f';
          X.strokeStyle = '#000';
          X.lineWidth = 3;
          X.beginPath();
          X.moveTo(24, 0);
          X.lineTo(-14, -16);
          X.lineTo(-6, 0);
          X.lineTo(-14, 16);
          X.closePath();
          X.fill();
          X.stroke();
          X.restore();
        }
      }

      // Boss Health Bar in Arena
      if (G.boss) {
        const b = G.boss;
        const curLvl = LV_DATA[Math.min(G.level, 3) - 1];
        const barW = 600;
        const barH = 26;
        const bx = 300;
        const by = 1000 - 74;

        X.fillStyle = 'rgba(0,0,0,0.7)';
        X.fillRect(bx - 4, by - 4, barW + 8, barH + 8);
        X.fillStyle = b.p2 ? '#e0183a' : '#a04ee0';
        X.fillRect(bx, by, (barW * Math.max(0, b.hp)) / b.max, barH);
        X.strokeStyle = '#ffd23f';
        X.lineWidth = 2;
        X.strokeRect(bx, by, barW, barH);

        X.textAlign = 'center';
        X.fillStyle = '#fff';
        X.font = 'bold 18px monospace';
        X.fillText(`${curLvl.boss}${b.p2 ? ' · ¡ENRABIA FASE 2!' : ''} [${Math.ceil(b.hp)} / ${b.max}]`, 600, by - 8);
      }

      // Flash & Fade
      if (G.flash > 0) {
        X.fillStyle = `rgba(255, 0, 0, ${G.flash * 0.5})`;
        X.fillRect(0, 0, 1200, 1000);
      }
      if (G.fade > 0) {
        X.fillStyle = `rgba(255, 255, 255, ${G.fade})`;
        X.fillRect(0, 0, 1200, 1000);
      }

      // Announcements / Tooltips
      if (G.txtT > 0 && G.txt) {
        X.textAlign = 'center';
        X.font = 'bold 24px monospace';
        const w = X.measureText(G.txt).width + 48;
        X.fillStyle = 'rgba(15, 23, 42, 0.88)';
        X.fillRect(600 - w / 2, 115, w, 48);
        X.strokeStyle = '#ffd23f';
        X.lineWidth = 2;
        X.strokeRect(600 - w / 2, 115, w, 48);
        X.fillStyle = '#fff';
        X.fillText(G.txt, 600, 147);
      }

      // Synchronize lightweight React HUD
      if (G.P) {
        const nearH = G.mode === 'world' && D(G.P, { x: G.house.x + G.house.w / 2, y: G.house.y + G.house.h / 2 }) < 190;
        setHudData({
          hp: Math.ceil(G.P.hp),
          maxHp: G.P.maxHp,
          level: stats.level,
          phase: G.level,
          keys: G.got,
          bombs: G.nBombs,
          weapon: G.P.weapons[G.P.wep] === 'shotgun' ? 'Escopeta' : 'Pistola',
          weaponCount: G.P.weapons.length,
          nearHouse: nearH,
          fps: G.fps,
          score: G.score,
        });
      }

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [initPhase, isPaused, settings.quality, stats.level, equipped, firePlayerWeapon, hurtPlayer, killEnemy]);

  // Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        e.preventDefault();
      }
      gameStateRef.current.keysPressed[k] = true;

      if (k === 'escape') {
        onPause();
      }
      if (k === 'e' && !e.repeat) {
        interact();
      }
      if (k === 'q' && !e.repeat) {
        cycleWeapon();
      }
      if (k === 'r' && !e.repeat) {
        explode();
      }
      if ((k === '1' || k === '2') && !e.repeat) {
        const G = gameStateRef.current;
        const idx = parseInt(k, 10) - 1;
        if (G.P && idx < G.P.weapons.length) {
          G.P.wep = idx;
          sound.click();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameStateRef.current.keysPressed[e.key.toLowerCase()] = false;
    };

    const handleBlur = () => {
      gameStateRef.current.keysPressed = {};
      gameStateRef.current.mouseDown = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [cycleWeapon, explode, interact, onPause]);

  // Canvas Mouse Controls
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    gameStateRef.current.mouse.x = ((e.clientX - r.left) * 1200) / r.width;
    gameStateRef.current.mouse.y = ((e.clientY - r.top) * 1000) / r.height;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      gameStateRef.current.mouseDown = true;
    }
  };

  const handleMouseUp = () => {
    gameStateRef.current.mouseDown = false;
  };

  // Touch virtual joystick handlers
  const handleJoystickStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    gameStateRef.current.touchMove = {
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currX: touch.clientX,
      currY: touch.clientY,
    };
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    if (!gameStateRef.current.touchMove.active) return;
    const touch = e.touches[0];
    gameStateRef.current.touchMove.currX = touch.clientX;
    gameStateRef.current.touchMove.currY = touch.clientY;
  };

  const handleJoystickEnd = () => {
    gameStateRef.current.touchMove.active = false;
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none">
      {/* 2D Canvas */}
      <canvas
        ref={canvasRef}
        width={1200}
        height={1000}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full max-w-[1200px] max-h-[1000px] aspect-[6/5] object-contain cursor-crosshair shadow-2xl"
      />

      {/* Floating Low-Occlusion React HUD */}
      <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between">
        {/* Top Header Cluster */}
        <div className="flex items-start justify-between">
          <div className="space-y-1.5 pointer-events-auto">
            {/* Health Bar */}
            <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-xs border border-amber-600/40 rounded-lg p-1.5 px-3 shadow-lg">
              <span className="text-red-400 font-bold text-xs uppercase tracking-wider">❤️ VIDA</span>
              <div className="w-36 md:w-52 h-4 bg-slate-800 rounded-sm overflow-hidden p-0.5 border border-slate-700">
                <div
                  className={`h-full rounded-xs transition-all duration-150 ${
                    hudData.hp > 30 ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-red-500 animate-pulse'
                  }`}
                  style={{ width: `${Math.max(0, (hudData.hp / hudData.maxHp) * 100)}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-slate-200 tabular-nums">
                {hudData.hp}/{hudData.maxHp}
              </span>
            </div>

            {/* Keys & Phase Cluster */}
            <div className="flex items-center gap-2">
              <div className="bg-slate-950/80 border border-yellow-500/50 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5 shadow-md">
                <span>🔑 Llaves:</span>
                <span className="text-yellow-400 text-sm font-extrabold">{hudData.keys}/3</span>
              </div>
              <div className="bg-slate-950/80 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-300 shadow-md">
                Fase {hudData.phase}: {hudData.phase === 1 ? 'Bosque' : hudData.phase === 2 ? 'Cripta' : 'Magma'}
              </div>
              <div className="bg-slate-950/80 border border-purple-500/40 rounded-lg px-2.5 py-1 text-xs font-mono text-purple-300 shadow-md">
                Nv. {stats.level}
              </div>
            </div>

            {/* Weapon & Bomb Badges */}
            <div className="flex items-center gap-2">
              <button
                onClick={cycleWeapon}
                className="pointer-events-auto bg-slate-900/90 hover:bg-slate-800 active:scale-95 border border-amber-500/60 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-amber-400 flex items-center gap-1 cursor-pointer transition"
                title="Pulsa [Q] para cambiar arma"
              >
                <span>🔫 [Q] {hudData.weapon.toUpperCase()}</span>
                {hudData.weaponCount > 1 && <span className="text-[10px] bg-amber-500/20 px-1 rounded text-amber-300">2/2</span>}
              </button>

              <button
                onClick={explode}
                disabled={hudData.bombs <= 0}
                className={`pointer-events-auto rounded-lg px-2.5 py-1 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  hudData.bombs > 0
                    ? 'bg-red-950/90 hover:bg-red-900 active:scale-95 border border-red-500/80 text-red-300 shadow-red-950/50 shadow-md'
                    : 'bg-slate-900/50 border border-slate-800 text-slate-500 cursor-not-allowed'
                }`}
                title="Pulsa [R] para detonar bomba"
              >
                <span>💣 [R] BOMBAS:</span>
                <span className="font-extrabold text-sm text-yellow-300">{hudData.bombs}</span>
              </button>
            </div>
          </div>

          {/* Top Right Status & Controls */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {settings.showFps && (
              <div className="bg-black/70 border border-slate-800 rounded px-2 py-0.5 text-[11px] font-mono text-emerald-400">
                {hudData.fps} FPS
              </div>
            )}
            <div className="bg-black/70 border border-amber-500/40 rounded px-2.5 py-1 text-xs font-mono text-amber-300 flex items-center gap-1">
              <span>🪙</span>
              <span className="font-bold">{stats.gold}</span>
            </div>
            <button
              onClick={onPause}
              className="bg-slate-900/90 hover:bg-slate-800 active:scale-95 border border-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition shadow-md"
            >
              ⏸️ Pausa [Esc]
            </button>
          </div>
        </div>

        {/* Interaction Banner if near house */}
        {hudData.nearHouse && (
          <div className="self-center pointer-events-auto animate-bounce">
            <button
              onClick={interact}
              className={`px-6 py-3 rounded-xl font-bold font-mono text-base md:text-lg border-2 shadow-2xl transition cursor-pointer ${
                hudData.keys >= 3
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-300'
                  : 'bg-amber-600 hover:bg-amber-500 text-white border-amber-300'
              }`}
            >
              {hudData.keys >= 3 ? '🚪 ¡ENTRAR A LA ARENA! [PULSA E]' : `🔒 Necesitas 3 Llaves (${hudData.keys}/3)`}
            </button>
          </div>
        )}

        {/* Touch Controls Overlay for Mobile / Tablet */}
        <div className="flex items-end justify-between pointer-events-none pb-2">
          {/* Virtual Joystick Touch Area (Left) */}
          <div
            onTouchStart={handleJoystickStart}
            onTouchMove={handleJoystickMove}
            onTouchEnd={handleJoystickEnd}
            className="w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-slate-700/60 bg-slate-900/40 pointer-events-auto flex items-center justify-center touch-none backdrop-blur-xs"
          >
            <div className="w-12 h-12 rounded-full bg-amber-500/50 border border-amber-300 pointer-events-none" />
          </div>

          {/* Action Buttons Touch Area (Right) */}
          <div className="flex flex-col items-end gap-2 pointer-events-auto">
            {hudData.weaponCount > 1 && (
              <button
                onTouchStart={cycleWeapon}
                onClick={cycleWeapon}
                className="w-14 h-14 rounded-full bg-slate-900/80 border-2 border-amber-500/80 text-amber-300 font-bold text-xs flex flex-col items-center justify-center active:scale-90 shadow-lg cursor-pointer"
              >
                <span>🔫</span>
                <span>Arma</span>
              </button>
            )}

            <button
              onTouchStart={explode}
              onClick={explode}
              disabled={hudData.bombs <= 0}
              className={`w-14 h-14 rounded-full border-2 font-bold text-xs flex flex-col items-center justify-center active:scale-90 shadow-lg cursor-pointer ${
                hudData.bombs > 0
                  ? 'bg-red-950/80 border-red-500 text-yellow-300'
                  : 'bg-slate-900/40 border-slate-800 text-slate-600'
              }`}
            >
              <span>💣</span>
              <span>{hudData.bombs}</span>
            </button>

            <button
              onTouchStart={() => (gameStateRef.current.isShooting = true)}
              onTouchEnd={() => (gameStateRef.current.isShooting = false)}
              onMouseDown={() => (gameStateRef.current.isShooting = true)}
              onMouseUp={() => (gameStateRef.current.isShooting = false)}
              className="w-18 h-18 rounded-full bg-amber-600/90 active:bg-amber-500 border-2 border-amber-300 text-slate-950 font-black text-sm flex flex-col items-center justify-center shadow-2xl active:scale-90 cursor-pointer"
            >
              <span>DISPARO</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
