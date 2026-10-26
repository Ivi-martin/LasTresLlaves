import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  EquippedCosmetics,
  GameSettings,
  PlayerStats,
  WeaponType,
} from '../types/game';
import { sound } from '../utils/audio';
import { StorageManager, DEFAULT_SKINS, DEFAULT_HATS, DEFAULT_AURAS } from '../utils/storage';
import { notificationService } from '../utils/notifications';
import {
  createHeroModel,
  createEnemyModel,
  createBossModel,
  createKeyModel,
  createPickupModel,
  triggerHitFlash,
  updateHitFlash,
  CharacterGroup,
} from '../game3d/models';
import { ParticleEngine } from '../game3d/particles';
import { buildPhaseEnvironment, WorldObstacle } from '../game3d/environment';

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

// Math scratch vectors to prevent GC allocations in loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _vec3C = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _intersectPoint = new THREE.Vector3();

// Phase Names & Boss Titles
const PHASE_INFO = [
  {
    name: 'Fase 1: El Bosque Ancestral',
    bossName: 'GUARDIÁN DE LA CASA',
    desc: 'Encuentra las 3 llaves ocultas entre los árboles y abre el Santuario.',
    fogColor: 0x142817,
    ambientColor: 0x588157,
  },
  {
    name: 'Fase 2: La Cripta Sombría',
    bossName: 'ESPECTRO DEL ABISMO',
    desc: 'La oscuridad reina en la cripta. Sigue las luces y vence al Espectro.',
    fogColor: 0x0d1117,
    ambientColor: 0x3d348b,
  },
  {
    name: 'Fase 3: Fortaleza de Magma',
    bossName: 'COLOSO DE MAGMA',
    desc: 'Cuidado con la lava ardiente. Destruye al Coloso para triunfar.',
    fogColor: 0x1a0602,
    ambientColor: 0x6a040f,
  },
];

interface ActiveProjectile {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  dmg: number;
  life: number;
  isPlayer: boolean;
  color: string;
}

interface ActiveEnemy {
  id: number;
  type: 'chaser' | 'shooter' | 'bat' | 'brute' | 'turret';
  mesh: CharacterGroup;
  pos: THREE.Vector3;
  hp: number;
  maxHp: number;
  spd: number;
  dmg: number;
  radius: number;
  shootCooldown: number;
  shootInterval: number;
}

interface ActiveKey {
  index: number;
  mesh: THREE.Group;
  pos: THREE.Vector3;
  collected: boolean;
}

interface ActivePickup {
  type: 'heal' | 'bomb' | 'coin';
  mesh: THREE.Group;
  pos: THREE.Vector3;
  life: number;
}

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
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Sync props to refs for stable 60fps render loop
  const propsRef = useRef({
    equipped,
    settings,
    stats,
    onGameOver,
    onVictory,
    onPause,
    onStatsUpdate,
    isPaused,
  });

  useEffect(() => {
    propsRef.current = {
      equipped,
      settings,
      stats,
      onGameOver,
      onVictory,
      onPause,
      onStatsUpdate,
      isPaused,
    };
  }, [equipped, settings, stats, onGameOver, onVictory, onPause, onStatsUpdate, isPaused]);

  // HUD State (decoupled and updated on state changes)
  const [hudState, setHudState] = useState({
    hp: 100,
    maxHp: 100,
    phase: initialPhase,
    keysCollected: [false, false, false],
    score: 0,
    gold: stats.gold,
    kills: 0,
    bombs: 2 + (stats.upgrades?.startBombs || 0),
    activeWeapon: 'pistol' as WeaponType,
    bossActive: false,
    bossHp: 0,
    bossMaxHp: 750,
    bossName: PHASE_INFO[initialPhase - 1].bossName,
    compassAngle: 0,
    portalUnlocked: false,
    levelTip: PHASE_INFO[initialPhase - 1].desc,
    touchEnabled: settings.touchControls || ('ontouchstart' in window),
  });

  // Mobile virtual joystick refs
  const moveJoystickRef = useRef({ active: false, startX: 0, startY: 0, curX: 0, curY: 0, vx: 0, vz: 0 });
  const aimJoystickRef = useRef({ active: false, startX: 0, startY: 0, curX: 0, curY: 0, vx: 0, vz: 0, firing: false });

  // References to trigger actions from HUD buttons
  const triggerBombRef = useRef<() => void>(() => {});
  const switchWeaponRef = useRef<() => void>(() => {});

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL to adapt graphics smoothly
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    const currentPhase = initialPhase;
    const phaseData = PHASE_INFO[currentPhase - 1] || PHASE_INFO[0];

    scene.background = new THREE.Color(phaseData.fogColor);
    scene.fog = new THREE.FogExp2(phaseData.fogColor, 0.018);

    const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 9.5, 14);
    camera.lookAt(0, 1.1, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth, container.clientHeight);

    container.appendChild(renderer.domElement);

    // Studio Environment Reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 2. Lighting Setup
    const ambientLight = new THREE.HemisphereLight(0xffffff, phaseData.ambientColor, 0.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff1e6, 1.4);
    keyLight.position.set(20, 35, 15);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = isSoftwareGl ? 512 : 2048;
    keyLight.shadow.mapSize.height = isSoftwareGl ? 512 : 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 120;
    const d = 35;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    // Dynamic torch / point lights on player
    const playerPointLight = new THREE.PointLight(0xffd166, 1.8, 16);
    playerPointLight.position.set(0, 2, 0);
    scene.add(playerPointLight);

    // 3. Build Environment
    const envData = buildPhaseEnvironment(currentPhase);
    scene.add(envData.group);

    // 4. Particle Engine
    const particles = new ParticleEngine(scene);

    // 5. Game State and Upgrades
    const currentStats = propsRef.current.stats;
    const upgrades = currentStats.upgrades || {
      maxHp: 0,
      moveSpeed: 0,
      damage: 0,
      startBombs: 0,
      dropRate: 0,
      fireRate: 0,
    };

    const maxHp = 100 + upgrades.maxHp * 10;
    let playerHp = maxHp;
    const baseSpeed = 12 * (1 + upgrades.moveSpeed * 0.04);
    const damageMultiplier = 1 + upgrades.damage * 0.05;
    const fireIntervalMultiplier = 1 / (1 + upgrades.fireRate * 0.04);
    const dropRate = 0.2 + upgrades.dropRate * 0.03;

    let bombCount = 2 + upgrades.startBombs;
    let score = 0;
    let kills = 0;
    let goldCollected = 0;
    let invulnerableTimer = 0;
    let activeWeapon: WeaponType = 'pistol';
    let shootCooldown = 0;

    // Keys state
    const keysCollected = [false, false, false];
    const keys: ActiveKey[] = [];
    envData.keySpawnPoints.forEach((pos, idx) => {
      const keyMesh = createKeyModel(idx);
      keyMesh.position.copy(pos);
      scene.add(keyMesh);
      keys.push({
        index: idx,
        mesh: keyMesh,
        pos: pos.clone(),
        collected: false,
      });
    });

    let portalUnlocked = false;

    // Boss State
    let bossActive = false;
    let bossHp = 0;
    let bossMaxHp = 700 + (currentPhase - 1) * 350;
    let bossMesh: CharacterGroup | null = null;
    const bossPos = envData.bossArenaCenter.clone();
    let bossAttackTimer = 2.0;

    // Hero Character Model
    const currentSkin = DEFAULT_SKINS.find((s) => s.id === propsRef.current.equipped.skinId) || DEFAULT_SKINS[0];
    const currentHat = DEFAULT_HATS.find((h) => h.id === propsRef.current.equipped.hatId);
    let heroMesh = createHeroModel(currentSkin, currentHat, activeWeapon);
    heroMesh.position.set(0, 0, 8);
    scene.add(heroMesh);

    // Aura particles on hero if equipped
    const currentAura = DEFAULT_AURAS.find((a) => a.id === propsRef.current.equipped.auraId);

    // Active Objects Pools
    const projectiles: ActiveProjectile[] = [];
    const enemies: ActiveEnemy[] = [];
    const pickups: ActivePickup[] = [];
    let enemyIdCounter = 1;
    let enemySpawnTimer = 1.0;

    // Camera follow state with screen shake
    let cameraShake = 0;
    const cameraTarget = new THREE.Vector3();

    // Input State
    const keysHeld: Record<string, boolean> = {};
    const mousePos2D = new THREE.Vector2();
    let isMouseDown = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      keysHeld[e.code] = true;
      if (e.code === 'KeyE' || e.code === 'Space') {
        throwBomb();
      } else if (e.code === 'Digit1') {
        setWeapon('pistol');
      } else if (e.code === 'Digit2') {
        setWeapon('shotgun');
      } else if (e.code === 'KeyQ') {
        setWeapon(activeWeapon === 'pistol' ? 'shotgun' : 'pistol');
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        propsRef.current.onPause();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysHeld[e.code] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mousePos2D.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mousePos2D.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDown = true;
      } else if (e.button === 2) {
        e.preventDefault();
        throwBomb();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) isMouseDown = false;
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('contextmenu', handleContextMenu);

    // Weapon Switching
    function setWeapon(type: WeaponType) {
      if (activeWeapon === type) return;
      activeWeapon = type;
      sound.click();

      // Replace hero weapon model seamlessly
      scene.remove(heroMesh);
      const prevPos = heroMesh.position.clone();
      const prevRot = heroMesh.rotation.y;
      heroMesh = createHeroModel(currentSkin, currentHat, activeWeapon);
      heroMesh.position.copy(prevPos);
      heroMesh.rotation.y = prevRot;
      scene.add(heroMesh);

      setHudState((prev) => ({ ...prev, activeWeapon }));
    }
    switchWeaponRef.current = () => setWeapon(activeWeapon === 'pistol' ? 'shotgun' : 'pistol');

    // Bomb detonation
    function throwBomb() {
      if (bombCount <= 0 || propsRef.current.isPaused) return;
      bombCount--;
      sound.bomb();
      cameraShake = 0.6;

      const bombCenter = heroMesh.position.clone();
      particles.emitShockwave(bombCenter, 10, 0xff7b00);

      // Damage all enemies in blast radius
      for (let i = enemies.length - 1; i >= 0; i--) {
        const en = enemies[i];
        const dist = en.pos.distanceTo(bombCenter);
        if (dist <= 11) {
          const bombDmg = 150 * damageMultiplier;
          en.hp -= bombDmg;
          particles.emitDamageNumber(en.pos, `${Math.round(bombDmg)}!`, true);
          triggerHitFlash(en.mesh);

          if (en.hp <= 0) {
            handleEnemyDefeat(en, i);
          }
        }
      }

      // Damage boss if active
      if (bossActive && bossMesh) {
        const dist = bossPos.distanceTo(bombCenter);
        if (dist <= 12) {
          const bossDmg = 120 * damageMultiplier;
          bossHp -= bossDmg;
          particles.emitDamageNumber(bossPos, `${Math.round(bossDmg)}!`, true);
          triggerHitFlash(bossMesh);
          if (bossHp <= 0) {
            handleBossDefeat();
          }
        }
      }

      setHudState((prev) => ({ ...prev, bombs: bombCount }));
    }
    triggerBombRef.current = throwBomb;

    // Bullet Spawning
    function fireProjectiles(targetPoint: THREE.Vector3) {
      if (shootCooldown > 0) return;

      const origin = heroMesh.position.clone().add(new THREE.Vector3(0, 0.7, 0));
      const toTarget = targetPoint.clone().sub(origin);
      toTarget.y = 0; // Pure horizontal bullet trajectory matching enemy collision
      if (toTarget.lengthSq() < 0.01) {
        toTarget.set(0, 0, -1);
      }
      const dir = toTarget.normalize();

      if (activeWeapon === 'pistol') {
        shootCooldown = 0.16 * fireIntervalMultiplier;
        sound.shoot();

        // High visibility glowing bullet
        const bulletGeo = new THREE.SphereGeometry(0.18, 8, 8);
        const bulletMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
        const bullet = new THREE.Mesh(bulletGeo, bulletMat);
        bullet.position.copy(origin);
        scene.add(bullet);

        projectiles.push({
          mesh: bullet,
          pos: bullet.position,
          vel: dir.clone().multiplyScalar(38),
          dmg: 25 * damageMultiplier,
          life: 1.4,
          isPlayer: true,
          color: '#ffea00',
        });

        particles.emit(origin.clone().addScaledVector(dir, 0.4), 4, 0xffea00, 3, 0.2);
      } else {
        // Shotgun: 5 spread shells with kickback
        shootCooldown = 0.45 * fireIntervalMultiplier;
        sound.shotgun();
        cameraShake = 0.25;

        const count = 5;
        const spreadAngle = 0.38;
        for (let i = 0; i < count; i++) {
          const offset = ((i - (count - 1) / 2) / (count - 1)) * spreadAngle;
          const spreadDir = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), offset);

          const shellGeo = new THREE.SphereGeometry(0.15, 8, 8);
          const shellMat = new THREE.MeshBasicMaterial({ color: 0xff6b35 });
          const shell = new THREE.Mesh(shellGeo, shellMat);
          shell.position.copy(origin);
          scene.add(shell);

          projectiles.push({
            mesh: shell,
            pos: shell.position,
            vel: spreadDir.multiplyScalar(32 + (Math.random() - 0.5) * 4),
            dmg: 18 * damageMultiplier,
            life: 0.85,
            isPlayer: true,
            color: '#ff6b35',
          });
        }
        particles.emit(origin.clone().addScaledVector(dir, 0.5), 10, 0xff7b00, 5, 0.3);
      }
    }

    // Enemy Defeat handler
    function handleEnemyDefeat(en: ActiveEnemy, index: number) {
      sound.kill();
      kills++;
      score += en.type === 'brute' ? 120 : en.type === 'shooter' ? 60 : 40;

      // Spawn burst death particles
      particles.emit(en.pos, 22, 0xff0054, 6, 0.35);

      // Chance to drop health or bomb or gold coin
      const rand = Math.random();
      if (rand < dropRate) {
        spawnPickup('heal', en.pos);
      } else if (rand < dropRate + 0.12) {
        spawnPickup('bomb', en.pos);
      } else {
        spawnPickup('coin', en.pos);
      }

      scene.remove(en.mesh);
      enemies.splice(index, 1);
    }

    function spawnPickup(type: 'heal' | 'bomb' | 'coin', pos: THREE.Vector3) {
      const mesh = createPickupModel(type);
      mesh.position.copy(pos);
      scene.add(mesh);
      pickups.push({
        type,
        mesh,
        pos: mesh.position,
        life: 25,
      });
    }

    // Boss Encounter Setup
    function summonBoss() {
      if (bossActive) return;
      bossActive = true;
      bossHp = bossMaxHp;
      sound.bossDie(); // dramatic roar
      cameraShake = 0.8;

      bossMesh = createBossModel(currentPhase);
      bossMesh.position.copy(bossPos);
      scene.add(bossMesh);

      particles.emitShockwave(bossPos, 14, 0x9d4edd);

      setHudState((prev) => ({
        ...prev,
        bossActive: true,
        bossHp,
        bossMaxHp,
      }));
    }

    function handleBossDefeat() {
      sound.bossDie();
      sound.levelUp();
      bossActive = false;
      score += 1500;
      kills++;

      if (bossMesh) {
        particles.emitShockwave(bossMesh.position, 16, 0xffea00);
        particles.emit(bossMesh.position, 60, 0xffb703, 9, 0.6);
        scene.remove(bossMesh);
        bossMesh = null;
      }

      // Update storage stats
      const currentStats = propsRef.current.stats;
      const newStats = {
        ...currentStats,
        gold: currentStats.gold + goldCollected + 300,
        xp: currentStats.xp + 450,
        totalKills: currentStats.totalKills + kills,
        totalBossesDefeated: currentStats.totalBossesDefeated + 1,
        highestPhase: Math.max(currentStats.highestPhase, currentPhase + 1),
        highScore: Math.max(currentStats.highScore, score),
      };
      StorageManager.saveStats(newStats);
      propsRef.current.onStatsUpdate(newStats);

      // Victory or Next Phase
      setTimeout(() => {
        propsRef.current.onVictory(score, kills);
      }, 1000);
    }

    // 6. Simulation & Animation Loop (Lossless 60fps)
    let animationFrameId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05); // clamped dt

      if (!propsRef.current.isPaused && playerHp > 0) {
        // --- A. PLAYER INPUT & MOVEMENT ---
        let moveX = 0;
        let moveZ = 0;

        if (keysHeld['KeyW'] || keysHeld['ArrowUp']) moveZ -= 1;
        if (keysHeld['KeyS'] || keysHeld['ArrowDown']) moveZ += 1;
        if (keysHeld['KeyA'] || keysHeld['ArrowLeft']) moveX -= 1;
        if (keysHeld['KeyD'] || keysHeld['ArrowRight']) moveX += 1;

        // Apply Touch Joystick Input if active
        if (moveJoystickRef.current.active) {
          moveX += moveJoystickRef.current.vx;
          moveZ += moveJoystickRef.current.vz;
        }

        const moveLen = Math.hypot(moveX, moveZ);
        const isMoving = moveLen > 0.05;

        if (isMoving) {
          const normX = moveX / moveLen;
          const normZ = moveZ / moveLen;
          const nextX = heroMesh.position.x + normX * baseSpeed * dt;
          const nextZ = heroMesh.position.z + normZ * baseSpeed * dt;

          // Obstacle collision check
          let collides = false;
          for (const obs of envData.obstacles) {
            const dx = nextX - obs.x;
            const dz = nextZ - obs.z;
            if (dx * dx + dz * dz < (obs.radius + 0.5) ** 2) {
              collides = true;
              break;
            }
          }

          // Arena boundary check
          if (!collides && Math.hypot(nextX, nextZ) < envData.mapRadius - 1.5) {
            heroMesh.position.x = nextX;
            heroMesh.position.z = nextZ;
          }

          // Walk cycle animation
          heroMesh.userData.walkCycle += dt * 14;
          const swing = Math.sin(heroMesh.userData.walkCycle) * 0.45;
          if (heroMesh.userData.leftLeg) heroMesh.userData.leftLeg.rotation.x = swing;
          if (heroMesh.userData.rightLeg) heroMesh.userData.rightLeg.rotation.x = -swing;
          if (heroMesh.userData.leftArm) heroMesh.userData.leftArm.rotation.x = -swing * 0.6;
          heroMesh.position.y = Math.abs(Math.sin(heroMesh.userData.walkCycle * 2)) * 0.08;
        } else {
          if (heroMesh.userData.leftLeg) heroMesh.userData.leftLeg.rotation.x = 0;
          if (heroMesh.userData.rightLeg) heroMesh.userData.rightLeg.rotation.x = 0;
          if (heroMesh.userData.leftArm) heroMesh.userData.leftArm.rotation.x = 0;
          heroMesh.position.y = 0;
        }

        // --- B. AIMING & FIRING ---
        // Raycast ground plane to get 3D aim target
        _raycaster.setFromCamera(mousePos2D, camera);
        const hasHit = _raycaster.ray.intersectPlane(_groundPlane, _intersectPoint);
        if (!hasHit) {
          // Fallback in case cursor is near/above horizon
          _intersectPoint.copy(heroMesh.position).add(
            new THREE.Vector3(
              _raycaster.ray.direction.x * 25,
              0,
              _raycaster.ray.direction.z * 25
            )
          );
        }

        // If mobile aim joystick is active, aim towards its vector
        let targetAimPoint = _intersectPoint;
        if (aimJoystickRef.current.active && (Math.abs(aimJoystickRef.current.vx) > 0.1 || Math.abs(aimJoystickRef.current.vz) > 0.1)) {
          targetAimPoint = heroMesh.position.clone().add(
            new THREE.Vector3(aimJoystickRef.current.vx * 10, 0, aimJoystickRef.current.vz * 10)
          );
        }

        const aimDx = targetAimPoint.x - heroMesh.position.x;
        const aimDz = targetAimPoint.z - heroMesh.position.z;
        const targetRotY = Math.atan2(aimDx, aimDz);
        heroMesh.rotation.y = THREE.MathUtils.damp(heroMesh.rotation.y, targetRotY, 20, dt);

        // Weapon firing check
        if (shootCooldown > 0) shootCooldown -= dt;
        if (isMouseDown || aimJoystickRef.current.firing) {
          fireProjectiles(targetAimPoint);
        }

        // Aura particles
        if (currentAura && currentAura.particleType !== 'none' && Math.random() < 0.3) {
          particles.emit(
            heroMesh.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.6, 0.4, (Math.random() - 0.5) * 0.6)),
            1,
            new THREE.Color(currentAura.color).getHex(),
            1.5,
            0.2
          );
        }

        // Invulnerability flicker
        if (invulnerableTimer > 0) {
          invulnerableTimer -= dt;
          heroMesh.visible = Math.floor(invulnerableTimer * 15) % 2 === 0;
        } else {
          heroMesh.visible = true;
        }
        updateHitFlash(heroMesh, dt);

        // Update point light to follow player
        playerPointLight.position.set(heroMesh.position.x, 2.2, heroMesh.position.z);

        // Check Hazard Zones (e.g. lava pools in Phase 3)
        for (const hz of envData.hazardZones) {
          const dist = Math.hypot(heroMesh.position.x - hz.x, heroMesh.position.z - hz.z);
          if (dist < hz.r && invulnerableTimer <= 0) {
            playerHp -= 12;
            invulnerableTimer = 0.6;
            sound.hurt();
            cameraShake = 0.3;
            particles.emit(heroMesh.position, 10, 0xff5400, 4, 0.3);
            setHudState((prev) => ({ ...prev, hp: Math.max(0, playerHp) }));
            if (playerHp <= 0) {
              propsRef.current.onGameOver(score, currentPhase, kills);
            }
          }
        }

        // --- C. KEYS & PORTAL INTERACTION ---
        let nearestKeyDist = Infinity;
        let nearestTargetPos = envData.portalPos;

        keys.forEach((k) => {
          if (!k.collected) {
            // Spin and bob key
            k.mesh.rotation.y += dt * 2.2;
            k.mesh.position.y = 1.0 + Math.sin(now * 0.003 + k.index) * 0.25;

            const dist = heroMesh.position.distanceTo(k.pos);
            if (dist < nearestKeyDist) {
              nearestKeyDist = dist;
              nearestTargetPos = k.pos;
            }

            // Collection trigger
            if (dist < 1.6) {
              k.collected = true;
              keysCollected[k.index] = true;
              sound.key();
              particles.emitShockwave(k.pos, 5, 0xffea00);
              particles.emit(k.pos, 25, 0xffb703, 5, 0.4);
              scene.remove(k.mesh);
              score += 250;

              // Check if all 3 keys are collected
              if (keysCollected.every((c) => c)) {
                portalUnlocked = true;
                sound.levelUp();
                particles.emitShockwave(envData.portalPos, 8, 0x00f5d4);
                notificationService.emitToast('¡Las 3 Llaves reunidas!', 'El Portal al Santuario se ha abierto. ¡Entra para enfrentar al Guardián!', 'reward');
              }

              setHudState((prev) => ({
                ...prev,
                keysCollected: [...keysCollected],
                score,
                portalUnlocked,
              }));
            }
          }
        });

        if (portalUnlocked) {
          nearestTargetPos = envData.portalPos;
          // Check if stepped into portal
          if (heroMesh.position.distanceTo(envData.portalPos) < 2.5 && !bossActive) {
            summonBoss();
          }
        }

        // Compute Compass angle pointing to nearest key or portal
        const compassDx = nearestTargetPos.x - heroMesh.position.x;
        const compassDz = nearestTargetPos.z - heroMesh.position.z;
        const compassAngle = Math.atan2(compassDz, compassDx) * (180 / Math.PI) + 90;

        // --- D. PICKUPS SIMULATION ---
        for (let i = pickups.length - 1; i >= 0; i--) {
          const p = pickups[i];
          p.life -= dt;
          p.mesh.rotation.y += dt * 2;
          p.mesh.position.y = 0.5 + Math.sin(now * 0.004 + i) * 0.15;

          const dist = heroMesh.position.distanceTo(p.pos);
          if (dist < 1.4) {
            sound.pick();
            if (p.type === 'heal') {
              playerHp = Math.min(maxHp, playerHp + 25);
              particles.emitDamageNumber(heroMesh.position, '+25 HP', false, true);
              sound.heal();
            } else if (p.type === 'bomb') {
              bombCount++;
              particles.emitDamageNumber(heroMesh.position, '+1 BOMBA', true);
            } else {
              goldCollected += 15;
              score += 30;
              particles.emitDamageNumber(heroMesh.position, '+15 🪙', false);
            }
            particles.emit(p.pos, 10, 0xffea00, 3, 0.2);
            scene.remove(p.mesh);
            pickups.splice(i, 1);

            setHudState((prev) => ({
              ...prev,
              hp: playerHp,
              bombs: bombCount,
              gold: propsRef.current.stats.gold + goldCollected,
              score,
            }));
            continue;
          }

          if (p.life <= 0) {
            scene.remove(p.mesh);
            pickups.splice(i, 1);
          }
        }

        // --- E. PROJECTILES SIMULATION ---
        for (let i = projectiles.length - 1; i >= 0; i--) {
          const pr = projectiles[i];
          pr.life -= dt;
          pr.pos.addScaledVector(pr.vel, dt);

          if (pr.isPlayer) {
            let hit = false;
            // Check hit enemies with generous XZ hit bounds
            for (let j = enemies.length - 1; j >= 0; j--) {
              const en = enemies[j];
              const dx = pr.pos.x - en.pos.x;
              const dz = pr.pos.z - en.pos.z;
              const distXZ = Math.hypot(dx, dz);
              
              const enemyCenterY = (en.pos.y || 0) + (en.type === 'bat' ? 1.0 : 0.6);
              const dy = Math.abs(pr.pos.y - enemyCenterY);
              const hitRadius = en.radius + 0.65;

              if (distXZ < hitRadius && dy < 1.6) {
                en.hp -= pr.dmg;
                hit = true;
                particles.emitDamageNumber(en.pos, `${Math.round(pr.dmg)}`);
                particles.emit(pr.pos, 8, 0xffea00, 3.5, 0.25);
                triggerHitFlash(en.mesh);

                if (en.hp <= 0) {
                  handleEnemyDefeat(en, j);
                }
                break;
              }
            }

            // Check hit boss
            if (!hit && bossActive && bossMesh) {
              const bdx = pr.pos.x - bossPos.x;
              const bdz = pr.pos.z - bossPos.z;
              const bossDistXZ = Math.hypot(bdx, bdz);
              const bdy = Math.abs(pr.pos.y - (bossPos.y + 1.5));

              if (bossDistXZ < 3.2 && bdy < 3.0) {
                bossHp -= pr.dmg;
                hit = true;
                particles.emitDamageNumber(bossPos, `${Math.round(pr.dmg)}`);
                particles.emit(pr.pos, 10, 0xff5400, 4, 0.3);
                triggerHitFlash(bossMesh);

                setHudState((prev) => ({ ...prev, bossHp }));

                if (bossHp <= 0) {
                  handleBossDefeat();
                }
              }
            }

            if (hit || pr.life <= 0) {
              scene.remove(pr.mesh);
              pr.mesh.geometry.dispose();
              (pr.mesh.material as THREE.Material).dispose();
              projectiles.splice(i, 1);
              continue;
            }
          } else {
            // Enemy projectile hitting player
            const pdx = pr.pos.x - heroMesh.position.x;
            const pdz = pr.pos.z - heroMesh.position.z;
            const pdy = Math.abs(pr.pos.y - (heroMesh.position.y + 0.7));

            if (Math.hypot(pdx, pdz) < 0.95 && pdy < 1.5 && invulnerableTimer <= 0) {
              playerHp -= pr.dmg;
              invulnerableTimer = 0.55;
              sound.hurt();
              cameraShake = 0.35;
              particles.emit(heroMesh.position, 12, 0xff0054, 4, 0.3);
              setHudState((prev) => ({ ...prev, hp: Math.max(0, playerHp) }));

              if (playerHp <= 0) {
                propsRef.current.onGameOver(score, currentPhase, kills);
              }

              scene.remove(pr.mesh);
              pr.mesh.geometry.dispose();
              (pr.mesh.material as THREE.Material).dispose();
              projectiles.splice(i, 1);
              continue;
            }

            if (pr.life <= 0) {
              scene.remove(pr.mesh);
              pr.mesh.geometry.dispose();
              (pr.mesh.material as THREE.Material).dispose();
              projectiles.splice(i, 1);
              continue;
            }
          }
        }

        // --- F. ENEMY SPAWNING & AI ---
        enemySpawnTimer -= dt;
        const maxEnemies = 12 + currentPhase * 3;
        if (enemySpawnTimer <= 0 && enemies.length < maxEnemies) {
          enemySpawnTimer = Math.max(1.2, 3.2 - currentPhase * 0.4);

          // Spawn around player at distance
          const angle = Math.random() * Math.PI * 2;
          const dist = 16 + Math.random() * 8;
          const spX = heroMesh.position.x + Math.cos(angle) * dist;
          const spZ = heroMesh.position.z + Math.sin(angle) * dist;

          // Pick enemy type
          let type: 'chaser' | 'shooter' | 'bat' | 'brute' | 'turret' = 'chaser';
          const r = Math.random();
          if (currentPhase === 1) {
            type = r < 0.65 ? 'chaser' : 'shooter';
          } else if (currentPhase === 2) {
            type = r < 0.45 ? 'bat' : r < 0.75 ? 'shooter' : 'chaser';
          } else {
            type = r < 0.4 ? 'chaser' : r < 0.7 ? 'brute' : 'turret';
          }

          const enemyMesh = createEnemyModel(type, currentPhase);
          enemyMesh.position.set(spX, 0, spZ);
          scene.add(enemyMesh);

          const hpMap = { chaser: 45, shooter: 35, bat: 20, brute: 180, turret: 100 };
          const spdMap = { chaser: 6.5, shooter: 4.8, bat: 10.5, brute: 3.5, turret: 0 };
          const dmgMap = { chaser: 10, shooter: 8, bat: 6, brute: 24, turret: 12 };
          const radMap = { chaser: 0.5, shooter: 0.5, bat: 0.4, brute: 1.0, turret: 0.7 };

          enemies.push({
            id: enemyIdCounter++,
            type,
            mesh: enemyMesh,
            pos: enemyMesh.position,
            hp: hpMap[type] + currentPhase * 10,
            maxHp: hpMap[type] + currentPhase * 10,
            spd: spdMap[type],
            dmg: dmgMap[type],
            radius: radMap[type],
            shootCooldown: 1.5 + Math.random(),
            shootInterval: type === 'shooter' ? 2.2 : 2.8,
          });
        }

        // Update Enemies AI & Fluid animations
        for (let i = enemies.length - 1; i >= 0; i--) {
          const en = enemies[i];
          updateHitFlash(en.mesh, dt);

          const toPlayer = heroMesh.position.clone().sub(en.pos).setY(0);
          const distToPlayer = toPlayer.length();
          const dirToPlayer = toPlayer.normalize();

          // Face player smoothly
          const targetRot = Math.atan2(dirToPlayer.x, dirToPlayer.z);
          en.mesh.rotation.y = THREE.MathUtils.damp(en.mesh.rotation.y, targetRot, 12, dt);

          if (en.type === 'bat') {
            // Flapping wings animation
            en.mesh.userData.walkCycle += dt * 18;
            const wingAngle = Math.sin(en.mesh.userData.walkCycle) * 0.8;
            if (en.mesh.userData.wingLeft) en.mesh.userData.wingLeft.rotation.z = wingAngle;
            if (en.mesh.userData.wingRight) en.mesh.userData.wingRight.rotation.z = -wingAngle;

            // Swooping motion towards player
            en.pos.addScaledVector(dirToPlayer, en.spd * dt);
            en.mesh.position.y = 0.8 + Math.sin(en.mesh.userData.walkCycle * 0.5) * 0.4;
          } else if (en.type === 'shooter' || en.type === 'turret') {
            // Shooters maintain distance and fire glowing bolts
            if (en.type === 'shooter') {
              if (distToPlayer < 9) {
                en.pos.addScaledVector(dirToPlayer, -en.spd * dt); // back away
              } else if (distToPlayer > 14) {
                en.pos.addScaledVector(dirToPlayer, en.spd * dt); // approach
              }
              en.mesh.position.y = Math.sin(now * 0.004 + en.id) * 0.15;
            }

            en.shootCooldown -= dt;
            if (en.shootCooldown <= 0 && distToPlayer < 24) {
              en.shootCooldown = en.shootInterval;
              sound.laser();

              const bGeo = new THREE.SphereGeometry(0.18, 6, 6);
              const bMat = new THREE.MeshBasicMaterial({ color: 0xc77dff });
              const enemyBullet = new THREE.Mesh(bGeo, bMat);
              enemyBullet.position.copy(en.pos).add(new THREE.Vector3(0, 0.8, 0));
              scene.add(enemyBullet);

              projectiles.push({
                mesh: enemyBullet,
                pos: enemyBullet.position,
                vel: dirToPlayer.clone().multiplyScalar(16),
                dmg: en.dmg,
                life: 2.2,
                isPlayer: false,
                color: '#c77dff',
              });
            }
          } else {
            // Chaser & Brute: Run straight at hero
            en.pos.addScaledVector(dirToPlayer, en.spd * dt);

            en.mesh.userData.walkCycle += dt * (en.type === 'brute' ? 6 : 14);
            const swing = Math.sin(en.mesh.userData.walkCycle) * 0.5;
            if (en.mesh.userData.leftLeg) en.mesh.userData.leftLeg.rotation.x = swing;
            if (en.mesh.userData.rightLeg) en.mesh.userData.rightLeg.rotation.x = -swing;
            if (en.mesh.userData.leftArm) en.mesh.userData.leftArm.rotation.x = -swing;
            if (en.mesh.userData.rightArm) en.mesh.userData.rightArm.rotation.x = swing;
          }

          // Contact damage with hero
          if (distToPlayer < en.radius + 0.4 && invulnerableTimer <= 0) {
            playerHp -= en.dmg;
            invulnerableTimer = 0.65;
            sound.hurt();
            cameraShake = 0.4;
            particles.emit(heroMesh.position, 12, 0xff0054, 4, 0.3);

            setHudState((prev) => ({ ...prev, hp: Math.max(0, playerHp) }));
            if (playerHp <= 0) {
              propsRef.current.onGameOver(score, currentPhase, kills);
            }
          }
        }

        // --- G. BOSS AI & ANIMATIONS ---
        if (bossActive && bossMesh) {
          updateHitFlash(bossMesh, dt);

          const toPlayer = heroMesh.position.clone().sub(bossPos).setY(0);
          const dist = toPlayer.length();
          const dir = toPlayer.normalize();

          // Smooth rotation to face player
          const bRot = Math.atan2(dir.x, dir.z);
          bossMesh.rotation.y = THREE.MathUtils.damp(bossMesh.rotation.y, bRot, 6, dt);

          // Slow menacing stride
          if (dist > 3.5) {
            bossPos.addScaledVector(dir, (currentPhase === 3 ? 3.0 : 4.0) * dt);
          }
          bossMesh.position.copy(bossPos);

          // Boss Stomp & Swing animation
          bossMesh.userData.walkCycle += dt * 4;
          const bSwing = Math.sin(bossMesh.userData.walkCycle) * 0.4;
          if (bossMesh.userData.leftArm) bossMesh.userData.leftArm.rotation.x = bSwing;
          if (bossMesh.userData.rightArm) bossMesh.userData.rightArm.rotation.x = -bSwing;

          // Special attacks
          bossAttackTimer -= dt;
          if (bossAttackTimer <= 0) {
            bossAttackTimer = 2.4;
            sound.laser();
            cameraShake = 0.5;

            // Fire 8-directional projectile ring or slam
            for (let k = 0; k < 8; k++) {
              const a = (k * Math.PI * 2) / 8;
              const pDir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));

              const bGeo = new THREE.SphereGeometry(0.28, 6, 6);
              const bMat = new THREE.MeshBasicMaterial({ color: currentPhase === 3 ? 0xff5400 : 0x7209b7 });
              const bMesh = new THREE.Mesh(bGeo, bMat);
              bMesh.position.copy(bossPos).add(new THREE.Vector3(0, 1.2, 0));
              scene.add(bMesh);

              projectiles.push({
                mesh: bMesh,
                pos: bMesh.position,
                vel: pDir.multiplyScalar(15),
                dmg: 18,
                life: 3.0,
                isPlayer: false,
                color: '#ff5400',
              });
            }
          }

          // Contact damage
          if (dist < 2.2 && invulnerableTimer <= 0) {
            playerHp -= 28;
            invulnerableTimer = 0.8;
            sound.hurt();
            cameraShake = 0.7;
            particles.emit(heroMesh.position, 20, 0xff0054, 6, 0.4);
            setHudState((prev) => ({ ...prev, hp: Math.max(0, playerHp) }));
            if (playerHp <= 0) {
              propsRef.current.onGameOver(score, currentPhase, kills);
            }
          }
        }

        // --- H. PARTICLES & CAMERA UPDATE ---
        particles.update(dt);

        // Smooth camera follow with an action isometric angle (character fully visible)
        cameraTarget.x = heroMesh.position.x;
        cameraTarget.z = heroMesh.position.z + 12.5;
        cameraTarget.y = 8.8;

        // Apply decaying camera shake
        if (cameraShake > 0) {
          cameraShake -= dt * 2.5;
          const shakeMag = Math.max(0, cameraShake) * 0.8;
          cameraTarget.x += (Math.random() - 0.5) * shakeMag;
          cameraTarget.z += (Math.random() - 0.5) * shakeMag;
        }

        camera.position.x = THREE.MathUtils.damp(camera.position.x, cameraTarget.x, 8, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, cameraTarget.y, 8, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, cameraTarget.z, 8, dt);
        camera.lookAt(heroMesh.position.x, 1.1, heroMesh.position.z);

        // Update compass angle in HUD
        setHudState((prev) => ({
          ...prev,
          compassAngle,
          score,
          kills,
        }));
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    // Responsive Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('contextmenu', handleContextMenu);

      particles.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [initialPhase]);

  // Virtual Joystick touch handlers for mobile
  const handleMoveTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    moveJoystickRef.current = {
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      curX: touch.clientX,
      curY: touch.clientY,
      vx: 0,
      vz: 0,
    };
  };

  const handleMoveTouchMove = (e: React.TouchEvent) => {
    if (!moveJoystickRef.current.active) return;
    const touch = e.touches[0];
    const dx = touch.clientX - moveJoystickRef.current.startX;
    const dy = touch.clientY - moveJoystickRef.current.startY;
    const maxRadius = 45;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    moveJoystickRef.current.curX = moveJoystickRef.current.startX + Math.cos(angle) * clampedDist;
    moveJoystickRef.current.curY = moveJoystickRef.current.startY + Math.sin(angle) * clampedDist;
    moveJoystickRef.current.vx = (Math.cos(angle) * clampedDist) / maxRadius;
    moveJoystickRef.current.vz = (Math.sin(angle) * clampedDist) / maxRadius;
  };

  const handleMoveTouchEnd = () => {
    moveJoystickRef.current.active = false;
    moveJoystickRef.current.vx = 0;
    moveJoystickRef.current.vz = 0;
  };

  const handleAimTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    aimJoystickRef.current = {
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      curX: touch.clientX,
      curY: touch.clientY,
      vx: 0,
      vz: 0,
      firing: true,
    };
  };

  const handleAimTouchMove = (e: React.TouchEvent) => {
    if (!aimJoystickRef.current.active) return;
    const touch = e.touches[0];
    const dx = touch.clientX - aimJoystickRef.current.startX;
    const dy = touch.clientY - aimJoystickRef.current.startY;
    const maxRadius = 45;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    aimJoystickRef.current.curX = aimJoystickRef.current.startX + Math.cos(angle) * clampedDist;
    aimJoystickRef.current.curY = aimJoystickRef.current.startY + Math.sin(angle) * clampedDist;
    aimJoystickRef.current.vx = (Math.cos(angle) * clampedDist) / maxRadius;
    aimJoystickRef.current.vz = (Math.sin(angle) * clampedDist) / maxRadius;
    aimJoystickRef.current.firing = true;
  };

  const handleAimTouchEnd = () => {
    aimJoystickRef.current.active = false;
    aimJoystickRef.current.firing = false;
  };

  const currentPhaseTitle = PHASE_INFO[hudState.phase - 1]?.name || 'Fase 1';

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-[#0a0d0f] touch-none">
      {/* Isolated Three.js Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* MINIMALIST & COHERENT 3D HUD OVERLAY (low occlusion: pointer-events: none on wrapper) */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5">
        {/* Top Header Cluster: Health, Phase, Keys, Currency, Pause */}
        <div className="flex items-start justify-between w-full">
          {/* Top Left: Health & Level */}
          <div className="pointer-events-auto flex flex-col gap-1.5 bg-black/60 border border-white/10 rounded-2xl p-2.5 px-3.5 shadow-xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider font-title">
                {currentPhaseTitle}
              </span>
            </div>
            {/* Health Bar with numeric readouts */}
            <div className="flex items-center gap-2">
              <div className="w-32 sm:w-44 h-3.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/80 p-0.5">
                <div
                  className="h-full rounded-full transition-all duration-150 ease-out bg-gradient-to-r from-red-600 via-emerald-500 to-emerald-400"
                  style={{
                    width: `${Math.max(0, Math.min(100, (hudState.hp / hudState.maxHp) * 100))}%`,
                    backgroundColor: hudState.hp < 30 ? '#dc2626' : '#10b981',
                  }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-emerald-300 tabular-nums">
                {Math.max(0, Math.round(hudState.hp))}/{hudState.maxHp}
              </span>
            </div>
          </div>

          {/* Top Center: The 3 Keys Lockup */}
          <div className="pointer-events-auto flex flex-col items-center bg-black/60 border border-amber-500/30 rounded-2xl p-2 px-4 shadow-xl">
            <div className="text-[10px] font-bold text-amber-300 uppercase tracking-widest font-title mb-1">
              Las Tres Llaves
            </div>
            <div className="flex items-center gap-3">
              {[0, 1, 2].map((idx) => {
                const collected = hudState.keysCollected[idx];
                return (
                  <div
                    key={idx}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                      collected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(255,183,3,0.6)] scale-105'
                        : 'bg-slate-900/50 border-slate-700 text-slate-600'
                    }`}
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M7 14c-2.76 0-5-2.24-5-5s2.24-5 5-5c2.42 0 4.44 1.72 4.9 4h7.1v2h2v2h2v2h-2v2h-2v-2h-7.1c-.46 2.28-2.48 4-4.9 4zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                    </svg>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Right: Gold, Score, Kills, Pause */}
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-2xl px-3 py-2 text-xs font-mono shadow-xl">
              <span className="text-amber-400 font-bold">🪙 {hudState.gold.toLocaleString()}</span>
              <span className="text-slate-500">|</span>
              <span className="text-purple-300 font-bold">💀 {hudState.kills}</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-200 font-bold font-mono-num">{hudState.score}</span>
            </div>

            <button
              onClick={onPause}
              className="p-2 sm:px-3 rounded-2xl bg-black/60 border border-white/15 text-slate-200 hover:text-white hover:bg-white/10 transition-colors shadow-xl active:scale-95"
              aria-label="Pausa"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Boss Health Bar (when Boss is active) */}
        {hudState.bossActive && (
          <div className="pointer-events-auto w-full max-w-xl mx-auto flex flex-col items-center gap-1 bg-black/75 border border-purple-500/50 rounded-2xl p-3 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between w-full text-xs font-bold font-title">
              <span className="text-purple-300 tracking-wider flex items-center gap-1.5">
                👑 {hudState.bossName}
              </span>
              <span className="text-purple-400 font-mono">
                {Math.max(0, Math.round(hudState.bossHp))} / {hudState.bossMaxHp}
              </span>
            </div>
            <div className="w-full h-3 bg-purple-950/60 rounded-full overflow-hidden border border-purple-600/60 p-0.5">
              <div
                className="h-full rounded-full transition-all duration-150 bg-gradient-to-r from-red-600 via-purple-500 to-amber-400"
                style={{ width: `${Math.max(0, (hudState.bossHp / hudState.bossMaxHp) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Bottom Cluster: 3D Compass, Active Weapon, Bombs, Mobile Controls */}
        <div className="flex items-end justify-between w-full">
          {/* Bottom Left: 3D Compass & Objective */}
          <div className="pointer-events-auto flex items-center gap-3 bg-black/60 border border-white/10 rounded-2xl p-2.5 px-3.5 shadow-xl">
            {/* Rotating 3D Compass Dial */}
            <div className="relative w-11 h-11 rounded-full border border-amber-500/50 bg-black/70 flex items-center justify-center shadow-inner">
              <div
                className="w-full h-full flex items-center justify-center transition-transform duration-75"
                style={{ transform: `rotate(${hudState.compassAngle}deg)` }}
              >
                <div className="w-1.5 h-4 bg-gradient-to-t from-transparent via-amber-500 to-amber-300 rounded-full" />
              </div>
              <div className="absolute w-2 h-2 rounded-full bg-amber-400 shadow-sm" />
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Brújula Sagrada
              </span>
              <span className="text-xs font-semibold text-amber-300">
                {hudState.portalUnlocked
                  ? '🏛️ ¡Entra al Santuario!'
                  : `🗝️ Busca las Llaves (${hudState.keysCollected.filter(Boolean).length}/3)`}
              </span>
            </div>
          </div>

          {/* Bottom Center / Right: Weapon Swap & Bombs */}
          <div className="pointer-events-auto flex items-center gap-2 bg-black/60 border border-white/10 rounded-2xl p-2 px-3 shadow-xl">
            {/* Weapon Selector */}
            <button
              onClick={() => switchWeaponRef.current()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                hudState.activeWeapon === 'pistol'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-orange-500/20 border-orange-400 text-orange-300'
              }`}
            >
              <span>{hudState.activeWeapon === 'pistol' ? '🔫' : '💥'}</span>
              <span className="uppercase">{hudState.activeWeapon === 'pistol' ? 'Pistola' : 'Escopeta'}</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">[Q]</span>
            </button>

            {/* Bomb Trigger */}
            <button
              onClick={() => triggerBombRef.current()}
              disabled={hudState.bombs <= 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                hudState.bombs > 0
                  ? 'bg-red-500/20 border-red-500/60 text-red-300 hover:bg-red-500/30 active:scale-95'
                  : 'bg-slate-900 border-slate-700 text-slate-600 opacity-60'
              }`}
            >
              <span>💣</span>
              <span className="font-mono">{hudState.bombs}</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">[Espacio]</span>
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE TOUCH CONTROLS (Rendered when touch screen is detected) */}
      {hudState.touchEnabled && (
        <div className="absolute inset-0 pointer-events-none z-20 flex justify-between items-end p-6 select-none">
          {/* Virtual Left Movement Stick */}
          <div
            className="pointer-events-auto relative w-32 h-32 rounded-full border border-white/20 bg-black/30 backdrop-blur-xs flex items-center justify-center touch-none active:border-amber-400/60"
            onTouchStart={handleMoveTouchStart}
            onTouchMove={handleMoveTouchMove}
            onTouchEnd={handleMoveTouchEnd}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/30 to-white/10 border border-white/40 shadow-lg pointer-events-none" />
            <span className="absolute bottom-2 text-[9px] font-bold text-white/50 uppercase tracking-widest">
              Mover
            </span>
          </div>

          {/* Virtual Right Aim / Fire Stick */}
          <div
            className="pointer-events-auto relative w-32 h-32 rounded-full border border-amber-500/30 bg-black/30 backdrop-blur-xs flex items-center justify-center touch-none active:border-amber-400"
            onTouchStart={handleAimTouchStart}
            onTouchMove={handleAimTouchMove}
            onTouchEnd={handleAimTouchEnd}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400/40 to-amber-600/20 border border-amber-400/60 shadow-lg pointer-events-none" />
            <span className="absolute bottom-2 text-[9px] font-bold text-amber-300/60 uppercase tracking-widest">
              Disparar
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
