import * as THREE from 'three';
import { getProceduralNoiseTexture, getCobblestoneTexture, getLavaTexture } from './materials';
import { createSanctuaryPortal } from './models';

export interface WorldObstacle {
  x: number;
  z: number;
  radius: number;
  type: 'rock' | 'tree' | 'pillar' | 'wall' | 'hazard';
}

export interface EnvironmentData {
  group: THREE.Group;
  obstacles: WorldObstacle[];
  portal: THREE.Group;
  portalPos: THREE.Vector3;
  lights: THREE.Light[];
  hazardZones: { x: number; z: number; r: number }[];
  keySpawnPoints: THREE.Vector3[];
  bossArenaCenter: THREE.Vector3;
  mapRadius: number;
}

export function buildPhaseEnvironment(phase = 1): EnvironmentData {
  const group = new THREE.Group();
  const obstacles: WorldObstacle[] = [];
  const lights: THREE.Light[] = [];
  const hazardZones: { x: number; z: number; r: number }[] = [];

  const mapRadius = phase === 1 ? 75 : phase === 2 ? 60 : 70;

  // 1. Terrain Ground
  let groundTexture: THREE.CanvasTexture;
  let groundCol: string;
  let fogCol: string;

  if (phase === 1) {
    groundTexture = getProceduralNoiseTexture('#2d5a27', '#407a34', 512);
    groundTexture.repeat.set(16, 16);
    groundCol = '#2d5a27';
    fogCol = '#1a3318';
  } else if (phase === 2) {
    groundTexture = getCobblestoneTexture('#1b1e2e', '#0d0f17', 512);
    groundTexture.repeat.set(18, 18);
    groundCol = '#1b1e2e';
    fogCol = '#0f111a';
  } else {
    groundTexture = getProceduralNoiseTexture('#2b1108', '#471a0c', 512);
    groundTexture.repeat.set(16, 16);
    groundCol = '#2b1108';
    fogCol = '#1e0802';
  }

  const groundGeo = new THREE.PlaneGeometry(mapRadius * 2.4, mapRadius * 2.4, 32, 32);
  const groundMat = new THREE.MeshStandardMaterial({
    map: groundTexture,
    color: groundCol,
    roughness: 0.8,
    metalness: 0.1,
  });

  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // 2. Sanctuary Portal (placed centrally or slightly offset)
  const portalPos = new THREE.Vector3(0, 0, -18);
  const portal = createSanctuaryPortal(phase);
  portal.position.copy(portalPos);
  group.add(portal);

  // Obstacle for portal pillars
  obstacles.push({ x: portalPos.x - 2, z: portalPos.z, radius: 0.9, type: 'pillar' });
  obstacles.push({ x: portalPos.x + 2, z: portalPos.z, radius: 0.9, type: 'pillar' });

  // 3. Boss Arena Center
  const bossArenaCenter = new THREE.Vector3(0, 0, -18);

  // 4. Key Spawns in 3 strategic directions
  const keySpawnPoints = [
    new THREE.Vector3(-mapRadius * 0.55, 0, mapRadius * 0.4),
    new THREE.Vector3(mapRadius * 0.6, 0, mapRadius * 0.35),
    new THREE.Vector3(0, 0, mapRadius * 0.65),
  ];

  // 5. Instanced Natural Barriers & Perimeter Props
  if (phase === 1) {
    // Stylized Pine Trees: Trunk + 3 tiered conical leaf layers
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.5, 2.0, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#4a2810', roughness: 0.9 });
    const leafGeo = new THREE.ConeGeometry(2.0, 3.2, 6);
    const leafMat = new THREE.MeshStandardMaterial({ color: '#2d6a4f', roughness: 0.7 });

    const numTrees = 70;
    const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, numTrees);
    const leavesInst = new THREE.InstancedMesh(leafGeo, leafMat, numTrees);
    trunkInst.castShadow = true;
    trunkInst.receiveShadow = true;
    leavesInst.castShadow = true;
    leavesInst.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let placed = 0;

    for (let i = 0; i < numTrees * 2 && placed < numTrees; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 12 + Math.random() * (mapRadius - 16);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      // Don't block sanctuary or key points
      if (portalPos.distanceTo(new THREE.Vector3(x, 0, z)) < 8) continue;
      let nearKey = false;
      for (const kp of keySpawnPoints) {
        if (kp.distanceTo(new THREE.Vector3(x, 0, z)) < 6) {
          nearKey = true;
          break;
        }
      }
      if (nearKey) continue;

      const scale = 0.8 + Math.random() * 0.5;

      // Trunk
      dummy.position.set(x, 1.0 * scale, z);
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.updateMatrix();
      trunkInst.setMatrixAt(placed, dummy.matrix);

      // Leaves
      dummy.position.set(x, 3.0 * scale, z);
      dummy.updateMatrix();
      leavesInst.setMatrixAt(placed, dummy.matrix);

      obstacles.push({ x, z, radius: 1.1 * scale, type: 'tree' });
      placed++;
    }

    trunkInst.count = placed;
    leavesInst.count = placed;
    trunkInst.instanceMatrix.needsUpdate = true;
    leavesInst.instanceMatrix.needsUpdate = true;
    group.add(trunkInst);
    group.add(leavesInst);

    // Stone Ruins & Mossy Boulders
    const rockGeo = new THREE.DodecahedronGeometry(1.2, 1);
    const rockMat = new THREE.MeshStandardMaterial({ color: '#6c757d', roughness: 0.85 });
    const numRocks = 40;
    const rockInst = new THREE.InstancedMesh(rockGeo, rockMat, numRocks);
    rockInst.castShadow = true;
    rockInst.receiveShadow = true;

    placed = 0;
    for (let i = 0; i < numRocks * 2 && placed < numRocks; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 8 + Math.random() * (mapRadius - 12);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      if (portalPos.distanceTo(new THREE.Vector3(x, 0, z)) < 7) continue;

      const s = 0.6 + Math.random() * 0.8;
      dummy.position.set(x, 0.7 * s, z);
      dummy.scale.set(s, s * 0.7, s);
      dummy.rotation.set(Math.random(), Math.random(), Math.random());
      dummy.updateMatrix();
      rockInst.setMatrixAt(placed, dummy.matrix);

      obstacles.push({ x, z, radius: 0.9 * s, type: 'rock' });
      placed++;
    }
    rockInst.count = placed;
    rockInst.instanceMatrix.needsUpdate = true;
    group.add(rockInst);

    // Flickering Campfire/Torch Lights
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI * 2) / 4 + 0.3;
      const x = Math.cos(angle) * 24;
      const z = Math.sin(angle) * 24;

      const brazier = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.25, 0.9, 6),
        new THREE.MeshStandardMaterial({ color: '#343a40', roughness: 0.7 })
      );
      brazier.position.set(x, 0.45, z);
      group.add(brazier);

      const fire = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 0.45, 6),
        new THREE.MeshBasicMaterial({ color: '#ffb703' })
      );
      fire.position.set(x, 1.05, z);
      group.add(fire);

      const torchLight = new THREE.PointLight(0xff9e00, 2.0, 14);
      torchLight.position.set(x, 1.4, z);
      group.add(torchLight);
      lights.push(torchLight);
    }
  } else if (phase === 2) {
    // Phase 2: La Cripta Sombría (Gothic columns, sarcophagi, eerie blue torches)
    const colGeo = new THREE.CylinderGeometry(0.65, 0.75, 5.0, 8);
    const colMat = new THREE.MeshStandardMaterial({ color: '#2b2d42', roughness: 0.9 });
    const numCols = 45;
    const colInst = new THREE.InstancedMesh(colGeo, colMat, numCols);
    colInst.castShadow = true;
    colInst.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let placed = 0;

    for (let i = 0; i < numCols * 2 && placed < numCols; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * (mapRadius - 14);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      if (portalPos.distanceTo(new THREE.Vector3(x, 0, z)) < 7) continue;

      dummy.position.set(x, 2.5, z);
      dummy.scale.set(1, 1, 1);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.updateMatrix();
      colInst.setMatrixAt(placed, dummy.matrix);

      obstacles.push({ x, z, radius: 0.85, type: 'pillar' });
      placed++;
    }
    colInst.count = placed;
    colInst.instanceMatrix.needsUpdate = true;
    group.add(colInst);

    // Eerie Blue Spectral Braziers
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const x = Math.cos(angle) * 26;
      const z = Math.sin(angle) * 26;

      const brazier = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.35, 1.2, 6),
        new THREE.MeshStandardMaterial({ color: '#1a1c29', roughness: 0.6 })
      );
      brazier.position.set(x, 0.6, z);
      group.add(brazier);

      const soulFire = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.28),
        new THREE.MeshBasicMaterial({ color: '#00f5d4' })
      );
      soulFire.position.set(x, 1.35, z);
      group.add(soulFire);

      const cyanLight = new THREE.PointLight(0x00f5d4, 2.5, 16);
      cyanLight.position.set(x, 1.5, z);
      group.add(cyanLight);
      lights.push(cyanLight);
    }
  } else {
    // Phase 3: Fortaleza de Magma (Molten lava hazard pools, basalt spires, glowing embers)
    const lavaTex = getLavaTexture(256);
    lavaTex.repeat.set(2, 2);

    // Hazard Lava Pools
    const numHazards = 8;
    for (let i = 0; i < numHazards; i++) {
      const angle = (i * Math.PI * 2) / numHazards + 0.2;
      const dist = 18 + (i % 2) * 16;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const r = 3.5 + Math.random() * 2.0;

      const poolGeo = new THREE.CylinderGeometry(r, r, 0.1, 16);
      const poolMat = new THREE.MeshStandardMaterial({
        map: lavaTex,
        color: '#ff4800',
        emissive: '#d00000',
        emissiveIntensity: 0.9,
        roughness: 0.3,
      });

      const pool = new THREE.Mesh(poolGeo, poolMat);
      pool.position.set(x, 0.04, z);
      group.add(pool);

      const lavaLight = new THREE.PointLight(0xff5400, 2.0, 14);
      lavaLight.position.set(x, 1.2, z);
      group.add(lavaLight);
      lights.push(lavaLight);

      hazardZones.push({ x, z, r });
    }

    // Basalt Hexagonal Columns
    const basaltGeo = new THREE.CylinderGeometry(0.8, 0.85, 4.0, 6);
    const basaltMat = new THREE.MeshStandardMaterial({ color: '#1e1e24', roughness: 0.8, metalness: 0.2 });
    const numBasalt = 40;
    const basaltInst = new THREE.InstancedMesh(basaltGeo, basaltMat, numBasalt);
    basaltInst.castShadow = true;
    basaltInst.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let placed = 0;
    for (let i = 0; i < numBasalt * 2 && placed < numBasalt; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 12 + Math.random() * (mapRadius - 16);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      if (portalPos.distanceTo(new THREE.Vector3(x, 0, z)) < 8) continue;

      const h = 2.5 + Math.random() * 3.0;
      dummy.position.set(x, h / 2, z);
      dummy.scale.set(1, h / 4.0, 1);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.updateMatrix();
      basaltInst.setMatrixAt(placed, dummy.matrix);

      obstacles.push({ x, z, radius: 1.0, type: 'pillar' });
      placed++;
    }
    basaltInst.count = placed;
    basaltInst.instanceMatrix.needsUpdate = true;
    group.add(basaltInst);
  }

  // Natural Perimeter Fence / Cliffs
  const cliffGeo = new THREE.DodecahedronGeometry(3.5, 1);
  const cliffMat = new THREE.MeshStandardMaterial({ color: phase === 3 ? '#212529' : '#343a40', roughness: 0.95 });
  const numCliffs = 48;
  const cliffInst = new THREE.InstancedMesh(cliffGeo, cliffMat, numCliffs);
  cliffInst.castShadow = true;
  cliffInst.receiveShadow = true;

  const dummyCliff = new THREE.Object3D();
  for (let i = 0; i < numCliffs; i++) {
    const angle = (i * Math.PI * 2) / numCliffs;
    const x = Math.cos(angle) * (mapRadius + 2);
    const z = Math.sin(angle) * (mapRadius + 2);
    dummyCliff.position.set(x, 1.8, z);
    dummyCliff.scale.set(1.4, 2.2, 1.4);
    dummyCliff.rotation.set(Math.random(), Math.random(), Math.random());
    dummyCliff.updateMatrix();
    cliffInst.setMatrixAt(i, dummyCliff.matrix);

    obstacles.push({ x, z, radius: 3.2, type: 'wall' });
  }
  cliffInst.instanceMatrix.needsUpdate = true;
  group.add(cliffInst);

  return {
    group,
    obstacles,
    portal,
    portalPos,
    lights,
    hazardZones,
    keySpawnPoints,
    bossArenaCenter,
    mapRadius,
  };
}
