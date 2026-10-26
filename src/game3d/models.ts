import * as THREE from 'three';
import { EquippedCosmetics, AvatarSkin, AvatarHat, WeaponType } from '../types/game';
import {
  getRadialShadowTexture,
  getDigitalCamoTexture,
  getCobblestoneTexture,
  getLavaTexture,
} from './materials';

export interface WorldObstacle {
  x: number;
  z: number;
  radius: number;
  type: 'rock' | 'tree' | 'pillar' | 'wall' | 'hazard';
}

// Shared geoms and materials cache to avoid memory leaks
const shadowGeo = new THREE.PlaneGeometry(1, 1);
const shadowMat = new THREE.MeshBasicMaterial({
  map: getRadialShadowTexture(),
  transparent: true,
  depthWrite: false,
  opacity: 0.6,
});

export interface CharacterGroup extends THREE.Group {
  userData: {
    leftLeg?: THREE.Mesh;
    rightLeg?: THREE.Mesh;
    leftArm?: THREE.Mesh;
    rightArm?: THREE.Mesh;
    head?: THREE.Group;
    torso?: THREE.Mesh;
    weaponMount?: THREE.Group;
    muzzlePoint?: THREE.Vector3;
    wingLeft?: THREE.Group;
    wingRight?: THREE.Group;
    jaw?: THREE.Mesh;
    auraEmitter?: THREE.Group;
    walkCycle: number;
    hitFlashTime: number;
    baseMaterials: { mesh: THREE.Mesh; originalMat: THREE.Material }[];
    flashMat?: THREE.MeshBasicMaterial;
  };
}

const hitFlashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

export function triggerHitFlash(char: CharacterGroup) {
  char.userData.hitFlashTime = 0.12;
  if (!char.userData.baseMaterials) return;
  for (const item of char.userData.baseMaterials) {
    item.mesh.material = hitFlashMat;
  }
}

export function updateHitFlash(char: CharacterGroup, dt: number) {
  if (char.userData.hitFlashTime > 0) {
    char.userData.hitFlashTime -= dt;
    if (char.userData.hitFlashTime <= 0 && char.userData.baseMaterials) {
      for (const item of char.userData.baseMaterials) {
        item.mesh.material = item.originalMat;
      }
    }
  }
}

/**
 * Creates the stylized Hero model with multi-part hierarchy:
 * Torso, Belt, Head, Eyes, Hair, Arms (with weapon), Legs (for walk cycle),
 * equipped Hat, and contact shadow.
 */
/**
 * Creates the stylized Martín hero model:
 * Intrepid young military explorer with digital camo jacket, cargo pockets,
 * epaulets, anime eyes with catchlights, spiky voxel brown hair, camo pants and tactical boots.
 */
export function createHeroModel(
  skin: AvatarSkin,
  hat?: AvatarHat,
  weaponType: WeaponType = 'pistol'
): CharacterGroup {
  const group = new THREE.Group() as CharacterGroup;
  const baseMaterials: { mesh: THREE.Mesh; originalMat: THREE.Material }[] = [];

  // Digital Camouflage Texture (Crisp M09 Spanish Army Woodland)
  const camoTex = getDigitalCamoTexture(256);
  camoTex.repeat.set(2, 2);

  // Materials based on 6ak9y.jpg
  const skinMat = new THREE.MeshStandardMaterial({
    color: '#f5cbb0',
    roughness: 0.52,
    metalness: 0.02,
  });

  const skinShadeMat = new THREE.MeshStandardMaterial({
    color: '#e4b699',
    roughness: 0.55,
  });

  const camoMat = new THREE.MeshStandardMaterial({
    map: camoTex,
    color: '#98a47d',
    roughness: 0.65,
    metalness: 0.04,
  });

  const innerShirtMat = new THREE.MeshStandardMaterial({
    color: '#343f25',
    roughness: 0.8,
    metalness: 0.04,
  });

  const pocketMat = new THREE.MeshStandardMaterial({
    color: '#495734',
    roughness: 0.7,
    metalness: 0.04,
  });

  const buttonMat = new THREE.MeshBasicMaterial({ color: '#242b1a' });

  const hairMat = new THREE.MeshStandardMaterial({
    color: '#382318',
    roughness: 0.82,
    metalness: 0.04,
  });

  const hairHighlightMat = new THREE.MeshStandardMaterial({
    color: '#4c3322',
    roughness: 0.82,
  });

  const bootMat = new THREE.MeshStandardMaterial({
    color: '#1a1b1d',
    roughness: 0.65,
    metalness: 0.15,
  });

  const laceMat = new THREE.MeshBasicMaterial({ color: '#323438' });

  const soleMat = new THREE.MeshStandardMaterial({
    color: '#0e0f11',
    roughness: 0.92,
  });

  // 1. Contact shadow on ground
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1.45, 1.45, 1.45);
  shadow.position.y = 0.02;
  group.add(shadow);

  // 2. Torso: Military Camo Field Jacket (Spanish M09 Pattern)
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 0.78;
  group.add(torsoGroup);

  // Main jacket torso
  const torsoGeo = new THREE.BoxGeometry(0.58, 0.60, 0.36);
  const torso = new THREE.Mesh(torsoGeo, camoMat);
  torso.castShadow = true;
  torso.receiveShadow = true;
  torsoGroup.add(torso);
  baseMaterials.push({ mesh: torso, originalMat: camoMat });

  // Jacket skirt extending past waist (overlapping top of pants as in 6ak9y.jpg)
  const jacketSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.18, 0.38), camoMat);
  jacketSkirt.position.set(0, -0.34, 0);
  jacketSkirt.castShadow = true;
  torsoGroup.add(jacketSkirt);
  baseMaterials.push({ mesh: jacketSkirt, originalMat: camoMat });

  // Inner crewneck collar (dark olive undershirt)
  const innerCollar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.06), innerShirtMat);
  innerCollar.position.set(0, 0.26, 0.16);
  torsoGroup.add(innerCollar);
  baseMaterials.push({ mesh: innerCollar, originalMat: innerShirtMat });

  // Folded collar lapels in V-neck shape
  const lapelGeo = new THREE.BoxGeometry(0.13, 0.22, 0.06);
  const leftLapel = new THREE.Mesh(lapelGeo, pocketMat);
  leftLapel.position.set(-0.12, 0.22, 0.19);
  leftLapel.rotation.z = -0.28;
  torsoGroup.add(leftLapel);
  baseMaterials.push({ mesh: leftLapel, originalMat: pocketMat });

  const rightLapel = new THREE.Mesh(lapelGeo, pocketMat);
  rightLapel.position.set(0.12, 0.22, 0.19);
  rightLapel.rotation.z = 0.28;
  torsoGroup.add(rightLapel);
  baseMaterials.push({ mesh: rightLapel, originalMat: pocketMat });

  // Collar back band
  const collarBack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.10, 0.10), pocketMat);
  collarBack.position.set(0, 0.31, -0.05);
  torsoGroup.add(collarBack);
  baseMaterials.push({ mesh: collarBack, originalMat: pocketMat });

  // Center button storm placket
  const placket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.58, 0.03), pocketMat);
  placket.position.set(0, -0.05, 0.19);
  torsoGroup.add(placket);

  // Placket buttons
  [-0.18, -0.06, 0.06].forEach((by) => {
    const btn = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.02), buttonMat);
    btn.position.set(0, by, 0.208);
    torsoGroup.add(btn);
  });

  // 4 Front Military Flap Cargo Pockets (exact 6ak9y.jpg layout)
  const pocketGeo = new THREE.BoxGeometry(0.17, 0.15, 0.05);
  const flapGeo = new THREE.BoxGeometry(0.18, 0.05, 0.06);
  const pocketBtnGeo = new THREE.BoxGeometry(0.03, 0.03, 0.02);

  // Upper Chest Pockets (Left & Right)
  const upLeftPocket = new THREE.Mesh(pocketGeo, pocketMat);
  upLeftPocket.position.set(-0.17, 0.09, 0.19);
  torsoGroup.add(upLeftPocket);
  const upLeftFlap = new THREE.Mesh(flapGeo, pocketMat);
  upLeftFlap.position.set(-0.17, 0.165, 0.195);
  torsoGroup.add(upLeftFlap);
  const upLeftBtn = new THREE.Mesh(pocketBtnGeo, buttonMat);
  upLeftBtn.position.set(-0.17, 0.135, 0.225);
  torsoGroup.add(upLeftBtn);

  const upRightPocket = new THREE.Mesh(pocketGeo, pocketMat);
  upRightPocket.position.set(0.17, 0.09, 0.19);
  torsoGroup.add(upRightPocket);
  const upRightFlap = new THREE.Mesh(flapGeo, pocketMat);
  upRightFlap.position.set(0.17, 0.165, 0.195);
  torsoGroup.add(upRightFlap);
  const upRightBtn = new THREE.Mesh(pocketBtnGeo, buttonMat);
  upRightBtn.position.set(0.17, 0.135, 0.225);
  torsoGroup.add(upRightBtn);

  // Lower Waist Pockets (Left & Right)
  const lowLeftPocket = new THREE.Mesh(pocketGeo, pocketMat);
  lowLeftPocket.position.set(-0.17, -0.16, 0.19);
  torsoGroup.add(lowLeftPocket);
  const lowLeftFlap = new THREE.Mesh(flapGeo, pocketMat);
  lowLeftFlap.position.set(-0.17, -0.085, 0.195);
  torsoGroup.add(lowLeftFlap);
  const lowLeftBtn = new THREE.Mesh(pocketBtnGeo, buttonMat);
  lowLeftBtn.position.set(-0.17, -0.115, 0.225);
  torsoGroup.add(lowLeftBtn);

  const lowRightPocket = new THREE.Mesh(pocketGeo, pocketMat);
  lowRightPocket.position.set(0.17, -0.16, 0.19);
  torsoGroup.add(lowRightPocket);
  const lowRightFlap = new THREE.Mesh(flapGeo, pocketMat);
  lowRightFlap.position.set(0.17, -0.085, 0.195);
  torsoGroup.add(lowRightFlap);
  const lowRightBtn = new THREE.Mesh(pocketBtnGeo, buttonMat);
  lowRightBtn.position.set(0.17, -0.115, 0.225);
  torsoGroup.add(lowRightBtn);

  // Shoulder Epaulets / Straps with buttons
  const epauletGeo = new THREE.BoxGeometry(0.18, 0.05, 0.22);
  const leftEpaulet = new THREE.Mesh(epauletGeo, pocketMat);
  leftEpaulet.position.set(-0.32, 0.31, 0);
  torsoGroup.add(leftEpaulet);
  const leftEpauletBtn = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.03), buttonMat);
  leftEpauletBtn.position.set(-0.32, 0.34, 0.06);
  torsoGroup.add(leftEpauletBtn);

  const rightEpaulet = new THREE.Mesh(epauletGeo, pocketMat);
  rightEpaulet.position.set(0.32, 0.31, 0);
  torsoGroup.add(rightEpaulet);
  const rightEpauletBtn = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.03), buttonMat);
  rightEpauletBtn.position.set(0.32, 0.34, 0.06);
  torsoGroup.add(rightEpauletBtn);

  // 3. Head & Face (Exact Chibi Anime Face & Voxel Hair from 6ak9y.jpg)
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.49;
  torsoGroup.add(headGroup);

  const headGeo = new THREE.BoxGeometry(0.50, 0.48, 0.46);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.castShadow = true;
  headGroup.add(head);
  baseMaterials.push({ mesh: head, originalMat: skinMat });

  // Expressive Voxel Anime Eyes (Dark brown pupils, prominent white highlights)
  const eyeScleraMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const eyeIrisMat = new THREE.MeshBasicMaterial({ color: '#27170e' });
  const eyeGleamMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const eyeLashMat = new THREE.MeshBasicMaterial({ color: '#1c100a' });
  const eyebrowMat = new THREE.MeshBasicMaterial({ color: '#2a1a11' });

  // Left Eye (viewer's left: x = -0.13)
  const eyeL = new THREE.Group();
  eyeL.position.set(-0.13, 0.02, 0.235);
  const scleraL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.02), eyeScleraMat);
  const irisL = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.125, 0.03), eyeIrisMat);
  const lashL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.025, 0.025), eyeLashMat);
  lashL.position.set(0, 0.07, 0.01);
  const gleamMainL = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 0.035), eyeGleamMat);
  gleamMainL.position.set(-0.02, 0.035, 0.015);
  const gleamSubL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.035), eyeGleamMat);
  gleamSubL.position.set(0.025, -0.035, 0.015);
  eyeL.add(scleraL);
  eyeL.add(irisL);
  eyeL.add(lashL);
  eyeL.add(gleamMainL);
  eyeL.add(gleamSubL);
  headGroup.add(eyeL);

  // Right Eye (viewer's right: x = 0.13)
  const eyeR = new THREE.Group();
  eyeR.position.set(0.13, 0.02, 0.235);
  const scleraR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.02), eyeScleraMat);
  const irisR = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.125, 0.03), eyeIrisMat);
  const lashR = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.025, 0.025), eyeLashMat);
  lashR.position.set(0, 0.07, 0.01);
  const gleamMainR = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 0.035), eyeGleamMat);
  gleamMainR.position.set(-0.02, 0.035, 0.015);
  const gleamSubR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.035), eyeGleamMat);
  gleamSubR.position.set(0.025, -0.035, 0.015);
  eyeR.add(scleraR);
  eyeR.add(irisR);
  eyeR.add(lashR);
  eyeR.add(gleamMainR);
  eyeR.add(gleamSubR);
  headGroup.add(eyeR);

  // Arched Voxel Eyebrows
  const browL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.035, 0.025), eyebrowMat);
  browL.position.set(-0.13, 0.135, 0.24);
  browL.rotation.z = -0.07;
  headGroup.add(browL);

  const browR = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.035, 0.025), eyebrowMat);
  browR.position.set(0.13, 0.135, 0.24);
  browR.rotation.z = 0.07;
  headGroup.add(browR);

  // Cute Voxel Button Nose
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 0.04), skinShadeMat);
  nose.position.set(0, -0.04, 0.24);
  headGroup.add(nose);

  // Gentle, friendly smiling mouth with subtle upturned corner (smirk from 6ak9y.jpg)
  const smileGroup = new THREE.Group();
  smileGroup.position.set(0, -0.11, 0.235);
  const smileMain = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.025, 0.02), new THREE.MeshBasicMaterial({ color: '#7a3e32' }));
  const smileCorner = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.025, 0.02), new THREE.MeshBasicMaterial({ color: '#7a3e32' }));
  smileCorner.position.set(0.055, 0.015, 0);
  smileCorner.rotation.z = 0.35;
  smileGroup.add(smileMain);
  smileGroup.add(smileCorner);
  headGroup.add(smileGroup);

  // Stepped Voxel Ears on sides
  const earGeo = new THREE.BoxGeometry(0.06, 0.13, 0.09);
  const earL = new THREE.Mesh(earGeo, skinMat);
  earL.position.set(-0.265, 0.01, 0);
  headGroup.add(earL);

  const earR = new THREE.Mesh(earGeo, skinMat);
  earR.position.set(0.265, 0.01, 0);
  headGroup.add(earR);

  // Martín's Voluminous Spiky Voxel Hair (Iconic dark brown locks matching 6ak9y.jpg)
  const hairGroup = new THREE.Group();
  headGroup.add(hairGroup);

  // Main Hair Crown Base
  const hairBase = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.30, 0.52), hairMat);
  hairBase.position.set(0, 0.22, -0.02);
  hairGroup.add(hairBase);
  baseMaterials.push({ mesh: hairBase, originalMat: hairMat });

  // Back layered drape down the nape
  const hairBack1 = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.26, 0.16), hairMat);
  hairBack1.position.set(0, 0.12, -0.22);
  hairGroup.add(hairBack1);
  baseMaterials.push({ mesh: hairBack1, originalMat: hairMat });

  const hairBack2 = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.20, 0.12), hairHighlightMat);
  hairBack2.position.set(0, -0.04, -0.20);
  hairGroup.add(hairBack2);
  baseMaterials.push({ mesh: hairBack2, originalMat: hairHighlightMat });

  // Flanking Sideburn Tufts in front of ears
  const sideTuftL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 0.36), hairMat);
  sideTuftL.position.set(-0.27, 0.08, 0.05);
  hairGroup.add(sideTuftL);
  baseMaterials.push({ mesh: sideTuftL, originalMat: hairMat });

  const sideTuftR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 0.36), hairMat);
  sideTuftR.position.set(0.27, 0.08, 0.05);
  hairGroup.add(sideTuftR);
  baseMaterials.push({ mesh: sideTuftR, originalMat: hairMat });

  // Front Bang Spikes (Sweeping across forehead as seen in 6ak9y.jpg)
  // Main center-left sweeping bang cluster
  const mainBang = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.16), hairMat);
  mainBang.position.set(-0.06, 0.17, 0.23);
  hairGroup.add(mainBang);
  baseMaterials.push({ mesh: mainBang, originalMat: hairMat });

  // Stepped lower tip of main bang dipping over forehead
  const bangTip = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.13), hairHighlightMat);
  bangTip.position.set(-0.07, 0.07, 0.25);
  hairGroup.add(bangTip);
  baseMaterials.push({ mesh: bangTip, originalMat: hairHighlightMat });

  // Right forehead bang
  const rightBang = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.20, 0.14), hairHighlightMat);
  rightBang.position.set(0.12, 0.18, 0.22);
  hairGroup.add(rightBang);
  baseMaterials.push({ mesh: rightBang, originalMat: hairHighlightMat });

  // Left temple bang
  const leftTempleBang = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.20, 0.14), hairMat);
  leftTempleBang.position.set(-0.20, 0.16, 0.20);
  hairGroup.add(leftTempleBang);
  baseMaterials.push({ mesh: leftTempleBang, originalMat: hairMat });

  // Right temple bang
  const rightTempleBang = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.20, 0.14), hairMat);
  rightTempleBang.position.set(0.22, 0.16, 0.19);
  hairGroup.add(rightTempleBang);
  baseMaterials.push({ mesh: rightTempleBang, originalMat: hairMat });

  // Crown Spikes (Textured Voxel Clusters on top matching 6ak9y.jpg)
  const crownFront = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.20, 0.22), hairHighlightMat);
  crownFront.position.set(-0.02, 0.36, 0.06);
  hairGroup.add(crownFront);
  baseMaterials.push({ mesh: crownFront, originalMat: hairHighlightMat });

  const crownTop = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.20, 0.20), hairMat);
  crownTop.position.set(-0.03, 0.38, -0.08);
  hairGroup.add(crownTop);
  baseMaterials.push({ mesh: crownTop, originalMat: hairMat });

  const crownLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), hairMat);
  crownLeft.position.set(-0.18, 0.35, -0.04);
  hairGroup.add(crownLeft);
  baseMaterials.push({ mesh: crownLeft, originalMat: hairMat });

  const crownRight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), hairHighlightMat);
  crownRight.position.set(0.17, 0.35, -0.04);
  hairGroup.add(crownRight);
  baseMaterials.push({ mesh: crownRight, originalMat: hairHighlightMat });

  const crownBack = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.18, 0.18), hairMat);
  crownBack.position.set(0.02, 0.32, -0.20);
  hairGroup.add(crownBack);
  baseMaterials.push({ mesh: crownBack, originalMat: hairMat });

  // 4. Customizer Hat (if equipped by user)
  if (hat && hat.drawType !== 'none') {
    const hatGroup = new THREE.Group();
    hatGroup.position.y = 0.30;

    const hatCol = new THREE.Color(hat.color || '#ffb020');
    const customHatMat = new THREE.MeshStandardMaterial({
      color: hatCol,
      roughness: 0.3,
      metalness: hat.drawType === 'crown' ? 0.8 : 0.2,
    });

    if (hat.drawType === 'crown') {
      const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.23, 0.16, 8), customHatMat);
      crownBase.castShadow = true;
      hatGroup.add(crownBase);
      for (let i = 0; i < 4; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 4), customHatMat);
        const angle = (i * Math.PI) / 2;
        spike.position.set(Math.cos(angle) * 0.22, 0.14, Math.sin(angle) * 0.22);
        hatGroup.add(spike);
      }
    } else if (hat.drawType === 'fedora') {
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 16), customHatMat);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.22, 12), customHatMat);
      top.position.y = 0.11;
      hatGroup.add(brim);
      hatGroup.add(top);
    } else if (hat.drawType === 'horns') {
      const hornMat = new THREE.MeshStandardMaterial({ color: '#e63946', roughness: 0.3 });
      const hornGeo = new THREE.ConeGeometry(0.07, 0.32, 6);
      const leftHorn = new THREE.Mesh(hornGeo, hornMat);
      leftHorn.position.set(-0.24, 0.1, 0);
      leftHorn.rotation.z = 0.5;
      leftHorn.rotation.x = -0.2;
      const rightHorn = new THREE.Mesh(hornGeo, hornMat);
      rightHorn.position.set(0.24, 0.1, 0);
      rightHorn.rotation.z = -0.5;
      rightHorn.rotation.x = -0.2;
      hatGroup.add(leftHorn);
      hatGroup.add(rightHorn);
    } else if (hat.drawType === 'halo') {
      const haloMat = new THREE.MeshBasicMaterial({ color: '#ffea00' });
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 8, 24), haloMat);
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 0.3;
      hatGroup.add(halo);
    } else if (hat.drawType === 'visor') {
      const visorMat = new THREE.MeshBasicMaterial({ color: '#00f5d4' });
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.1, 0.15), visorMat);
      visor.position.set(0, -0.16, 0.22);
      hatGroup.add(visor);
    } else {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.1, 12), customHatMat);
      band.position.y = -0.1;
      hatGroup.add(band);
    }
    headGroup.add(hatGroup);
  }

  // 5. Legs: Military Digital Camo Cargo Trousers
  const legGeo = new THREE.BoxGeometry(0.22, 0.44, 0.24);
  const cargoPocketGeo = new THREE.BoxGeometry(0.07, 0.20, 0.18);
  const cargoFlapGeo = new THREE.BoxGeometry(0.08, 0.05, 0.19);
  const pantCuffGeo = new THREE.BoxGeometry(0.24, 0.08, 0.26);

  // Left Leg
  const leftLeg = new THREE.Mesh(legGeo, camoMat);
  leftLeg.position.set(-0.16, 0.25, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);
  baseMaterials.push({ mesh: leftLeg, originalMat: camoMat });

  const leftCargo = new THREE.Mesh(cargoPocketGeo, pocketMat);
  leftCargo.position.set(-0.13, 0.03, 0);
  leftLeg.add(leftCargo);
  const leftCargoFlap = new THREE.Mesh(cargoFlapGeo, pocketMat);
  leftCargoFlap.position.set(-0.13, 0.13, 0);
  leftLeg.add(leftCargoFlap);
  const leftPantCuff = new THREE.Mesh(pantCuffGeo, camoMat);
  leftPantCuff.position.set(0, -0.19, 0);
  leftLeg.add(leftPantCuff);

  // Right Leg
  const rightLeg = new THREE.Mesh(legGeo, camoMat);
  rightLeg.position.set(0.16, 0.25, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);
  baseMaterials.push({ mesh: rightLeg, originalMat: camoMat });

  const rightCargo = new THREE.Mesh(cargoPocketGeo, pocketMat);
  rightCargo.position.set(0.13, 0.03, 0);
  rightLeg.add(rightCargo);
  const rightCargoFlap = new THREE.Mesh(cargoFlapGeo, pocketMat);
  rightCargoFlap.position.set(0.13, 0.13, 0);
  rightLeg.add(rightCargoFlap);
  const rightPantCuff = new THREE.Mesh(pantCuffGeo, camoMat);
  rightPantCuff.position.set(0, -0.19, 0);
  rightLeg.add(rightPantCuff);

  // 6. Chunky Black Tactical Combat Boots with Rugged Lugged Tread
  const bootShaftGeo = new THREE.BoxGeometry(0.23, 0.18, 0.25);
  const laceGeo = new THREE.BoxGeometry(0.12, 0.02, 0.02);
  const bootFootGeo = new THREE.BoxGeometry(0.24, 0.15, 0.34);
  const toeCapGeo = new THREE.BoxGeometry(0.24, 0.13, 0.10);
  const soleGeo = new THREE.BoxGeometry(0.26, 0.08, 0.38);
  const treadLugGeo = new THREE.BoxGeometry(0.26, 0.04, 0.06);
  const heelLugGeo = new THREE.BoxGeometry(0.26, 0.06, 0.10);

  // Left Boot Assembly
  const leftBootShaft = new THREE.Mesh(bootShaftGeo, bootMat);
  leftBootShaft.position.set(0, -0.18, 0.01);
  leftBootShaft.castShadow = true;
  leftLeg.add(leftBootShaft);
  baseMaterials.push({ mesh: leftBootShaft, originalMat: bootMat });

  // Front ladder laces on shaft
  [-0.14, -0.18, -0.22].forEach((ly) => {
    const lace = new THREE.Mesh(laceGeo, laceMat);
    lace.position.set(0, ly - (-0.18), 0.136);
    leftBootShaft.add(lace);
  });

  const leftBootFoot = new THREE.Mesh(bootFootGeo, bootMat);
  leftBootFoot.position.set(0, -0.23, 0.05);
  leftLeg.add(leftBootFoot);
  baseMaterials.push({ mesh: leftBootFoot, originalMat: bootMat });

  const leftToeCap = new THREE.Mesh(toeCapGeo, bootMat);
  leftToeCap.position.set(0, -0.24, 0.20);
  leftLeg.add(leftToeCap);

  const leftSole = new THREE.Mesh(soleGeo, soleMat);
  leftSole.position.set(0, -0.28, 0.05);
  leftLeg.add(leftSole);
  baseMaterials.push({ mesh: leftSole, originalMat: soleMat });

  // Sole tread notches underneath
  [-0.08, 0.04, 0.16].forEach((tz) => {
    const lug = new THREE.Mesh(treadLugGeo, soleMat);
    lug.position.set(0, -0.055, tz);
    leftSole.add(lug);
  });
  const leftHeel = new THREE.Mesh(heelLugGeo, soleMat);
  leftHeel.position.set(0, -0.065, -0.12);
  leftSole.add(leftHeel);

  // Right Boot Assembly
  const rightBootShaft = new THREE.Mesh(bootShaftGeo, bootMat);
  rightBootShaft.position.set(0, -0.18, 0.01);
  rightBootShaft.castShadow = true;
  rightLeg.add(rightBootShaft);
  baseMaterials.push({ mesh: rightBootShaft, originalMat: bootMat });

  // Front ladder laces on shaft
  [-0.14, -0.18, -0.22].forEach((ly) => {
    const lace = new THREE.Mesh(laceGeo, laceMat);
    lace.position.set(0, ly - (-0.18), 0.136);
    rightBootShaft.add(lace);
  });

  const rightBootFoot = new THREE.Mesh(bootFootGeo, bootMat);
  rightBootFoot.position.set(0, -0.23, 0.05);
  rightLeg.add(rightBootFoot);
  baseMaterials.push({ mesh: rightBootFoot, originalMat: bootMat });

  const rightToeCap = new THREE.Mesh(toeCapGeo, bootMat);
  rightToeCap.position.set(0, -0.24, 0.20);
  rightLeg.add(rightToeCap);

  const rightSole = new THREE.Mesh(soleGeo, soleMat);
  rightSole.position.set(0, -0.28, 0.05);
  rightLeg.add(rightSole);
  baseMaterials.push({ mesh: rightSole, originalMat: soleMat });

  // Sole tread notches underneath
  [-0.08, 0.04, 0.16].forEach((tz) => {
    const lug = new THREE.Mesh(treadLugGeo, soleMat);
    lug.position.set(0, -0.055, tz);
    rightSole.add(lug);
  });
  const rightHeel = new THREE.Mesh(heelLugGeo, soleMat);
  rightHeel.position.set(0, -0.065, -0.12);
  rightSole.add(rightHeel);

  // 7. Arms and Hands (Camo sleeves, upper arm cargo patches, wrist cuffs)
  const armGeo = new THREE.BoxGeometry(0.18, 0.44, 0.20);
  const sleevePatchGeo = new THREE.BoxGeometry(0.06, 0.15, 0.13);
  const cuffGeo = new THREE.BoxGeometry(0.19, 0.08, 0.21);
  const handGeo = new THREE.BoxGeometry(0.12, 0.14, 0.14);

  // Left Arm
  const leftArm = new THREE.Mesh(armGeo, camoMat);
  leftArm.position.set(-0.39, 0.05, 0);
  leftArm.castShadow = true;
  torsoGroup.add(leftArm);
  baseMaterials.push({ mesh: leftArm, originalMat: camoMat });

  // Sleeve cargo patch on left arm bicep
  const leftSleevePatch = new THREE.Mesh(sleevePatchGeo, pocketMat);
  leftSleevePatch.position.set(-0.09, 0.08, 0);
  leftArm.add(leftSleevePatch);
  baseMaterials.push({ mesh: leftSleevePatch, originalMat: pocketMat });

  const leftCuff = new THREE.Mesh(cuffGeo, camoMat);
  leftCuff.position.set(0, -0.18, 0);
  leftArm.add(leftCuff);

  const leftHand = new THREE.Mesh(handGeo, skinMat);
  leftHand.position.set(0, -0.26, 0.02);
  leftArm.add(leftHand);
  baseMaterials.push({ mesh: leftHand, originalMat: skinMat });

  // Voxel thumb on left hand
  const leftThumb = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.05), skinMat);
  leftThumb.position.set(0.06, -0.23, 0.06);
  leftArm.add(leftThumb);

  // Right Arm
  const rightArm = new THREE.Mesh(armGeo, camoMat);
  rightArm.position.set(0.39, 0.05, 0);
  rightArm.castShadow = true;
  torsoGroup.add(rightArm);
  baseMaterials.push({ mesh: rightArm, originalMat: camoMat });

  // Sleeve cargo patch on right arm bicep
  const rightSleevePatch = new THREE.Mesh(sleevePatchGeo, pocketMat);
  rightSleevePatch.position.set(0.09, 0.08, 0);
  rightArm.add(rightSleevePatch);
  baseMaterials.push({ mesh: rightSleevePatch, originalMat: pocketMat });

  const rightCuff = new THREE.Mesh(cuffGeo, camoMat);
  rightCuff.position.set(0, -0.18, 0);
  rightArm.add(rightCuff);

  const rightHand = new THREE.Mesh(handGeo, skinMat);
  rightHand.position.set(0, -0.26, 0.02);
  rightArm.add(rightHand);
  baseMaterials.push({ mesh: rightHand, originalMat: skinMat });

  const rightThumb = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.05), skinMat);
  rightThumb.position.set(-0.06, -0.23, 0.06);
  rightArm.add(rightThumb);

  // Weapon holder on right hand
  const weaponMount = new THREE.Group();
  weaponMount.position.set(0, -0.22, 0.15);
  rightArm.add(weaponMount);

  // Weapon Mesh (Pistol or Shotgun)
  const weaponMat = new THREE.MeshStandardMaterial({
    color: '#333533',
    roughness: 0.2,
    metalness: 0.8,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    color: '#7f4f24',
    roughness: 0.7,
    metalness: 0.0,
  });

  const gunGroup = new THREE.Group();
  if (weaponType === 'shotgun') {
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.24), woodMat);
    stock.position.set(0, 0, -0.1);
    gunGroup.add(stock);

    const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 8), weaponMat);
    barrel1.rotation.x = Math.PI / 2;
    barrel1.position.set(-0.03, 0.04, 0.25);
    gunGroup.add(barrel1);

    const barrel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 8), weaponMat);
    barrel2.rotation.x = Math.PI / 2;
    barrel2.position.set(0.03, 0.04, 0.25);
    gunGroup.add(barrel2);

    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.18), woodMat);
    pump.position.set(0, 0.02, 0.15);
    gunGroup.add(pump);
  } else {
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.18, 0.09), woodMat);
    grip.position.set(0, -0.05, 0);
    grip.rotation.x = -0.2;
    gunGroup.add(grip);

    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.34), weaponMat);
    slide.position.set(0, 0.05, 0.1);
    gunGroup.add(slide);
  }
  weaponMount.add(gunGroup);

  const muzzlePoint = new THREE.Vector3(0, 0.05, weaponType === 'shotgun' ? 0.6 : 0.3);

  group.userData = {
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    head: headGroup,
    torso,
    weaponMount,
    muzzlePoint,
    walkCycle: 0,
    hitFlashTime: 0,
    baseMaterials,
  };

  return group;
}

/**
 * Creates 3D Enemy models:
 * Chaser, Shooter, Bat, Brute, Turret.
 */
export function createEnemyModel(type: 'chaser' | 'shooter' | 'bat' | 'brute' | 'turret', phase = 1): CharacterGroup {
  const group = new THREE.Group() as CharacterGroup;
  const baseMaterials: { mesh: THREE.Mesh; originalMat: THREE.Material }[] = [];

  // Ground shadow
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  if (type === 'chaser') {
    // Hunched savage predator / goblin with horns and claws
    shadow.scale.set(1.4, 1.4, 1.4);
    const bodyCol = phase === 1 ? '#40916c' : phase === 2 ? '#4a4e69' : '#b23a22';
    const skinMat = new THREE.MeshStandardMaterial({ color: bodyCol, roughness: 0.6, metalness: 0.1 });
    const hornMat = new THREE.MeshStandardMaterial({ color: '#e9ecef', roughness: 0.3 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#ff0054' });

    // Torso (hunched forward)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.5), skinMat);
    torso.position.set(0, 0.65, 0);
    torso.rotation.x = 0.25;
    torso.castShadow = true;
    group.add(torso);
    baseMaterials.push({ mesh: torso, originalMat: skinMat });

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.42), skinMat);
    head.position.set(0, 0.35, 0.22);
    torso.add(head);
    baseMaterials.push({ mesh: head, originalMat: skinMat });

    // Horns
    const leftHorn = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.25, 4), hornMat);
    leftHorn.position.set(-0.16, 0.2, 0);
    leftHorn.rotation.z = 0.4;
    leftHorn.rotation.x = -0.3;
    head.add(leftHorn);

    const rightHorn = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.25, 4), hornMat);
    rightHorn.position.set(0.16, 0.2, 0);
    rightHorn.rotation.z = -0.4;
    rightHorn.rotation.x = -0.3;
    head.add(rightHorn);

    // Glowing Eyes
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.05), eyeMat);
    leftEye.position.set(-0.11, 0.05, 0.21);
    head.add(leftEye);
    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.05), eyeMat);
    rightEye.position.set(0.11, 0.05, 0.21);
    head.add(rightEye);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.14, 0.5, 0.14);
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.set(-0.32, 0, 0.1);
    leftArm.rotation.x = 0.4;
    torso.add(leftArm);
    baseMaterials.push({ mesh: leftArm, originalMat: skinMat });

    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.set(0.32, 0, 0.1);
    rightArm.rotation.x = 0.4;
    torso.add(rightArm);
    baseMaterials.push({ mesh: rightArm, originalMat: skinMat });

    // Legs
    const legGeo = new THREE.BoxGeometry(0.18, 0.4, 0.2);
    const leftLeg = new THREE.Mesh(legGeo, skinMat);
    leftLeg.position.set(-0.16, 0.2, 0);
    group.add(leftLeg);
    baseMaterials.push({ mesh: leftLeg, originalMat: skinMat });

    const rightLeg = new THREE.Mesh(legGeo, skinMat);
    rightLeg.position.set(0.16, 0.2, 0);
    group.add(rightLeg);
    baseMaterials.push({ mesh: rightLeg, originalMat: skinMat });

    group.userData = {
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      torso,
      walkCycle: 0,
      hitFlashTime: 0,
      baseMaterials,
    };
  } else if (type === 'shooter') {
    // Levitating dark sorcerer with hood and glowing floating orb
    shadow.scale.set(1.2, 1.2, 1.2);
    const robeCol = phase === 1 ? '#3a2e39' : phase === 2 ? '#1e1e24' : '#49111c';
    const robeMat = new THREE.MeshStandardMaterial({ color: robeCol, roughness: 0.8, metalness: 0.05 });
    const orbMat = new THREE.MeshStandardMaterial({
      color: '#c77dff',
      emissive: '#9d4edd',
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.6,
    });

    const torso = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.9, 8), robeMat);
    torso.position.y = 0.8;
    torso.castShadow = true;
    group.add(torso);
    baseMaterials.push({ mesh: torso, originalMat: robeMat });

    // Hood & Face Shadow
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), robeMat);
    hood.position.y = 0.55;
    torso.add(hood);
    baseMaterials.push({ mesh: hood, originalMat: robeMat });

    // Glowing Eyes inside hood
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#00f5d4' });
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
    leftEye.position.set(-0.08, 0.54, 0.18);
    torso.add(leftEye);
    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
    rightEye.position.set(0.08, 0.54, 0.18);
    torso.add(rightEye);

    // Floating magic orb on side
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), orbMat);
    orb.position.set(0.45, 0.3, 0.2);
    torso.add(orb);
    baseMaterials.push({ mesh: orb, originalMat: orbMat });

    group.userData = {
      torso,
      rightArm: orb,
      walkCycle: 0,
      hitFlashTime: 0,
      baseMaterials,
    };
  } else if (type === 'bat') {
    // Winged demonic bat / gargoyle with articulated flapping wings
    shadow.scale.set(0.9, 0.9, 0.9);
    const batCol = phase === 2 ? '#3c096c' : '#212529';
    const batMat = new THREE.MeshStandardMaterial({ color: batCol, roughness: 0.7 });
    const wingMat = new THREE.MeshStandardMaterial({ color: '#5a189a', roughness: 0.5, side: THREE.DoubleSide });
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#ffb703' });

    const torso = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), batMat);
    torso.position.y = 0.9;
    torso.scale.set(0.8, 1.2, 0.8);
    group.add(torso);
    baseMaterials.push({ mesh: torso, originalMat: batMat });

    // Head with ears
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.2), batMat);
    head.position.set(0, 0.25, 0.1);
    torso.add(head);

    const earGeo = new THREE.ConeGeometry(0.06, 0.16, 4);
    const leftEar = new THREE.Mesh(earGeo, batMat);
    leftEar.position.set(-0.09, 0.14, 0);
    head.add(leftEar);
    const rightEar = new THREE.Mesh(earGeo, batMat);
    rightEar.position.set(0.09, 0.14, 0);
    head.add(rightEar);

    const eyeGeo = new THREE.BoxGeometry(0.04, 0.04, 0.03);
    const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
    eye1.position.set(-0.06, 0.02, 0.1);
    head.add(eye1);
    const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
    eye2.position.set(0.06, 0.02, 0.1);
    head.add(eye2);

    // Left Wing Group
    const wingLeft = new THREE.Group();
    wingLeft.position.set(-0.2, 0.05, 0);
    torso.add(wingLeft);
    const wingShapeL = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.02, 0.35), wingMat);
    wingShapeL.position.x = -0.3;
    wingLeft.add(wingShapeL);
    baseMaterials.push({ mesh: wingShapeL, originalMat: wingMat });

    // Right Wing Group
    const wingRight = new THREE.Group();
    wingRight.position.set(0.2, 0.05, 0);
    torso.add(wingRight);
    const wingShapeR = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.02, 0.35), wingMat);
    wingShapeR.position.x = 0.3;
    wingRight.add(wingShapeR);
    baseMaterials.push({ mesh: wingShapeR, originalMat: wingMat });

    group.userData = {
      torso,
      wingLeft,
      wingRight,
      walkCycle: 0,
      hitFlashTime: 0,
      baseMaterials,
    };
  } else if (type === 'brute') {
    // Massive rocky / armored golem with boulder fists
    shadow.scale.set(2.2, 2.2, 2.2);
    const rockCol = phase === 3 ? '#370617' : '#343a40';
    const rockMat = new THREE.MeshStandardMaterial({ color: rockCol, roughness: 0.9, metalness: 0.1 });
    const lavaVeinMat = new THREE.MeshStandardMaterial({
      color: '#ff5400',
      emissive: '#e85d04',
      emissiveIntensity: 0.6,
      roughness: 0.4,
    });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 0.8), rockMat);
    torso.position.y = 1.1;
    torso.castShadow = true;
    group.add(torso);
    baseMaterials.push({ mesh: torso, originalMat: rockMat });

    // Core lava chest plate
    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.15), lavaVeinMat);
    chestPlate.position.set(0, 0.1, 0.4);
    torso.add(chestPlate);
    baseMaterials.push({ mesh: chestPlate, originalMat: lavaVeinMat });

    // Heavy Boulder Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.45), rockMat);
    head.position.set(0, 0.6, 0.1);
    torso.add(head);
    baseMaterials.push({ mesh: head, originalMat: rockMat });

    // Big heavy arms with boulder fists
    const armGeo = new THREE.BoxGeometry(0.35, 0.85, 0.35);
    const fistGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);

    const leftArm = new THREE.Mesh(armGeo, rockMat);
    leftArm.position.set(-0.75, -0.1, 0);
    torso.add(leftArm);
    const leftFist = new THREE.Mesh(fistGeo, rockMat);
    leftFist.position.y = -0.45;
    leftArm.add(leftFist);
    baseMaterials.push({ mesh: leftArm, originalMat: rockMat });
    baseMaterials.push({ mesh: leftFist, originalMat: rockMat });

    const rightArm = new THREE.Mesh(armGeo, rockMat);
    rightArm.position.set(0.75, -0.1, 0);
    torso.add(rightArm);
    const rightFist = new THREE.Mesh(fistGeo, rockMat);
    rightFist.position.y = -0.45;
    rightArm.add(rightFist);
    baseMaterials.push({ mesh: rightArm, originalMat: rockMat });
    baseMaterials.push({ mesh: rightFist, originalMat: rockMat });

    // Heavy Legs
    const legGeo = new THREE.BoxGeometry(0.4, 0.65, 0.4);
    const leftLeg = new THREE.Mesh(legGeo, rockMat);
    leftLeg.position.set(-0.35, 0.35, 0);
    group.add(leftLeg);
    baseMaterials.push({ mesh: leftLeg, originalMat: rockMat });

    const rightLeg = new THREE.Mesh(legGeo, rockMat);
    rightLeg.position.set(0.35, 0.35, 0);
    group.add(rightLeg);
    baseMaterials.push({ mesh: rightLeg, originalMat: rockMat });

    group.userData = {
      torso,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      walkCycle: 0,
      hitFlashTime: 0,
      baseMaterials,
    };
  } else {
    // Turret: Ancient stone obelisk base with rotating crystal cannon head
    shadow.scale.set(1.5, 1.5, 1.5);
    const stoneMat = new THREE.MeshStandardMaterial({ color: '#495057', roughness: 0.85 });
    const crystalMat = new THREE.MeshStandardMaterial({
      color: '#ff0054',
      emissive: '#d90429',
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.7,
    });

    // Base pillar
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.55, 1.2, 6), stoneMat);
    base.position.y = 0.6;
    base.castShadow = true;
    group.add(base);
    baseMaterials.push({ mesh: base, originalMat: stoneMat });

    // Rotating head mount
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.3;
    group.add(headGroup);

    const cannon = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.7), stoneMat);
    cannon.position.z = 0.15;
    headGroup.add(cannon);
    baseMaterials.push({ mesh: cannon, originalMat: stoneMat });

    // Glowing core crystal
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), crystalMat);
    crystal.position.set(0, 0.22, 0);
    headGroup.add(crystal);
    baseMaterials.push({ mesh: crystal, originalMat: crystalMat });

    group.userData = {
      head: headGroup,
      walkCycle: 0,
      hitFlashTime: 0,
      baseMaterials,
    };
  }

  return group;
}

/**
 * Creates Boss models for the 3 distinct phases.
 */
export function createBossModel(phase: number): CharacterGroup {
  const group = new THREE.Group() as CharacterGroup;
  const baseMaterials: { mesh: THREE.Mesh; originalMat: THREE.Material }[] = [];

  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(4.5, 4.5, 4.5);
  shadow.position.y = 0.03;
  group.add(shadow);

  if (phase === 1) {
    // GUARDIÁN DE LA CASA (Ancient Forest Treant Golem)
    const barkMat = new THREE.MeshStandardMaterial({ color: '#3e2723', roughness: 0.9 });
    const mossMat = new THREE.MeshStandardMaterial({ color: '#2d6a4f', roughness: 0.7 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#52b788' });

    // Massive Trunk Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 2.2, 8), barkMat);
    torso.position.y = 2.0;
    torso.castShadow = true;
    group.add(torso);
    baseMaterials.push({ mesh: torso, originalMat: barkMat });

    // Moss shoulder capes
    const mossTop = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 8), mossMat);
    mossTop.position.y = 1.1;
    mossTop.scale.set(1.2, 0.5, 1.2);
    torso.add(mossTop);
    baseMaterials.push({ mesh: mossTop, originalMat: mossMat });

    // Head with branch horns
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.8), barkMat);
    head.position.set(0, 1.5, 0.3);
    torso.add(head);
    baseMaterials.push({ mesh: head, originalMat: barkMat });

    // Glowing Eyes
    const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.1), eyeMat);
    eye1.position.set(-0.25, 0.1, 0.42);
    head.add(eye1);
    const eye2 = new THREE.Mesh(eye1.geometry, eyeMat);
    eye2.position.set(0.25, 0.1, 0.42);
    head.add(eye2);

    // Thick Log Arms
    const armGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.8, 6);
    const leftArm = new THREE.Mesh(armGeo, barkMat);
    leftArm.position.set(-1.6, 0.2, 0);
    leftArm.rotation.z = 0.3;
    torso.add(leftArm);
    baseMaterials.push({ mesh: leftArm, originalMat: barkMat });

    const rightArm = new THREE.Mesh(armGeo, barkMat);
    rightArm.position.set(1.6, 0.2, 0);
    rightArm.rotation.z = -0.3;
    torso.add(rightArm);
    baseMaterials.push({ mesh: rightArm, originalMat: barkMat });

    // Root legs
    const legGeo = new THREE.CylinderGeometry(0.5, 0.65, 1.2, 6);
    const leftLeg = new THREE.Mesh(legGeo, barkMat);
    leftLeg.position.set(-0.7, 0.6, 0);
    group.add(leftLeg);
    baseMaterials.push({ mesh: leftLeg, originalMat: barkMat });

    const rightLeg = new THREE.Mesh(legGeo, barkMat);
    rightLeg.position.set(0.7, 0.6, 0);
    group.add(rightLeg);
    baseMaterials.push({ mesh: rightLeg, originalMat: barkMat });

    group.userData = {
      torso,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      walkCycle: 0,
      hitFlashTime: 0,
      baseMaterials,
    };
  } else if (phase === 2) {
    // ESPECTRO DEL ABISMO (Abyssal Wraith / Phantom Lich)
    const shroudMat = new THREE.MeshStandardMaterial({
      color: '#10002b',
      roughness: 0.4,
      metalness: 0.3,
    });
    const spiritMat = new THREE.MeshStandardMaterial({
      color: '#7b2cbf',
      emissive: '#9d4edd',
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.5,
    });
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#00f5d4' });

    // Floating Torso Shroud
    const torso = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3.0, 10), shroudMat);
    torso.position.y = 2.4;
    group.add(torso);
    baseMaterials.push({ mesh: torso, originalMat: shroudMat });

    // Ribcage / Spirit Core
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.7), spiritMat);
    core.position.y = 0.5;
    torso.add(core);
    baseMaterials.push({ mesh: core, originalMat: spiritMat });

    // Horned Skull Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.8), shroudMat);
    head.position.set(0, 1.7, 0.2);
    torso.add(head);
    baseMaterials.push({ mesh: head, originalMat: shroudMat });

    const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.1), eyeMat);
    eye1.position.set(-0.22, 0.1, 0.42);
    head.add(eye1);
    const eye2 = new THREE.Mesh(eye1.geometry, eyeMat);
    eye2.position.set(0.22, 0.1, 0.42);
    head.add(eye2);

    // Giant spectral claws
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.8, 0.4), spiritMat);
    leftArm.position.set(-1.8, 0.6, 0.4);
    leftArm.rotation.z = 0.4;
    torso.add(leftArm);
    baseMaterials.push({ mesh: leftArm, originalMat: spiritMat });

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.8, 0.4), spiritMat);
    rightArm.position.set(1.8, 0.6, 0.4);
    rightArm.rotation.z = -0.4;
    torso.add(rightArm);
    baseMaterials.push({ mesh: rightArm, originalMat: spiritMat });

    group.userData = {
      torso,
      leftArm,
      rightArm,
      walkCycle: 0,
      hitFlashTime: 0,
      baseMaterials,
    };
  } else {
    // COLOSO DE MAGMA (Volcanic Magma Behemoth)
    const obsidianMat = new THREE.MeshStandardMaterial({ color: '#161a1d', roughness: 0.8, metalness: 0.2 });
    const magmaMat = new THREE.MeshStandardMaterial({
      color: '#ff4800',
      emissive: '#ff7b00',
      emissiveIntensity: 1.0,
      roughness: 0.3,
    });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.0, 1.8), obsidianMat);
    torso.position.y = 2.6;
    torso.castShadow = true;
    group.add(torso);
    baseMaterials.push({ mesh: torso, originalMat: obsidianMat });

    // Glowing Lava Fissures / Core
    const lavaChest = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.3), magmaMat);
    lavaChest.position.set(0, 0.2, 0.9);
    torso.add(lavaChest);
    baseMaterials.push({ mesh: lavaChest, originalMat: magmaMat });

    // Head with molten horns
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 1.0), obsidianMat);
    head.position.set(0, 1.4, 0.4);
    torso.add(head);
    baseMaterials.push({ mesh: head, originalMat: obsidianMat });

    const eyeMat = new THREE.MeshBasicMaterial({ color: '#ffea00' });
    const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.1), eyeMat);
    eye1.position.set(-0.3, 0.1, 0.52);
    head.add(eye1);
    const eye2 = new THREE.Mesh(eye1.geometry, eyeMat);
    eye2.position.set(0.3, 0.1, 0.52);
    head.add(eye2);

    // Massive Magma Fist Arms
    const armGeo = new THREE.BoxGeometry(0.7, 1.8, 0.7);
    const fistGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);

    const leftArm = new THREE.Mesh(armGeo, obsidianMat);
    leftArm.position.set(-1.8, -0.2, 0);
    torso.add(leftArm);
    const leftFist = new THREE.Mesh(fistGeo, magmaMat);
    leftFist.position.y = -1.0;
    leftArm.add(leftFist);
    baseMaterials.push({ mesh: leftArm, originalMat: obsidianMat });
    baseMaterials.push({ mesh: leftFist, originalMat: magmaMat });

    const rightArm = new THREE.Mesh(armGeo, obsidianMat);
    rightArm.position.set(1.8, -0.2, 0);
    torso.add(rightArm);
    const rightFist = new THREE.Mesh(fistGeo, magmaMat);
    rightFist.position.y = -1.0;
    rightArm.add(rightFist);
    baseMaterials.push({ mesh: rightArm, originalMat: obsidianMat });
    baseMaterials.push({ mesh: rightFist, originalMat: magmaMat });

    // Heavy Stomping Pillars
    const legGeo = new THREE.BoxGeometry(0.8, 1.4, 0.8);
    const leftLeg = new THREE.Mesh(legGeo, obsidianMat);
    leftLeg.position.set(-0.8, 0.8, 0);
    group.add(leftLeg);
    baseMaterials.push({ mesh: leftLeg, originalMat: obsidianMat });

    const rightLeg = new THREE.Mesh(legGeo, obsidianMat);
    rightLeg.position.set(0.8, 0.8, 0);
    group.add(rightLeg);
    baseMaterials.push({ mesh: rightLeg, originalMat: obsidianMat });

    group.userData = {
      torso,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      walkCycle: 0,
      hitFlashTime: 0,
      baseMaterials,
    };
  }

  return group;
}

/**
 * Creates the ornate 3D Golden Key model with floating aura and beacon.
 */
export function createKeyModel(index: number): THREE.Group {
  const group = new THREE.Group();

  const keyMat = new THREE.MeshStandardMaterial({
    color: '#ffb703',
    roughness: 0.15,
    metalness: 0.9,
    emissive: '#fb8500',
    emissiveIntensity: 0.35,
  });

  // Key Bow (Ring)
  const ringGeo = new THREE.TorusGeometry(0.25, 0.06, 12, 24);
  const ring = new THREE.Mesh(ringGeo, keyMat);
  ring.castShadow = true;
  group.add(ring);

  // Key Shaft
  const shaftGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.7, 12);
  const shaft = new THREE.Mesh(shaftGeo, keyMat);
  shaft.position.y = -0.45;
  shaft.castShadow = true;
  group.add(shaft);

  // Key Teeth
  const tooth1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.06), keyMat);
  tooth1.position.set(0.09, -0.65, 0);
  group.add(tooth1);

  const tooth2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.06), keyMat);
  tooth2.position.set(0.06, -0.5, 0);
  group.add(tooth2);

  // Outer glowing halo
  const haloMat = new THREE.MeshBasicMaterial({
    color: '#ffea00',
    transparent: true,
    opacity: 0.4,
    wireframe: true,
  });
  const halo = new THREE.Mesh(new THREE.IcosahedronGeometry(0.65, 1), haloMat);
  group.add(halo);

  // Soft contact shadow
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1.2, 1.2, 1.2);
  shadow.position.y = -1.1;
  group.add(shadow);

  // Pivot key slightly upward
  group.position.y = 1.2;
  return group;
}

/**
 * Creates the Sanctuary Temple / Portal where player enters the Boss Arena.
 */
export function createSanctuaryPortal(phase = 1): THREE.Group {
  const group = new THREE.Group();

  const stoneCol = phase === 1 ? '#495057' : phase === 2 ? '#212529' : '#343a40';
  const runeCol = phase === 1 ? '#52b788' : phase === 2 ? '#00b4d8' : '#ff7b00';

  const stoneMat = new THREE.MeshStandardMaterial({ color: stoneCol, roughness: 0.85 });
  const runeMat = new THREE.MeshStandardMaterial({
    color: runeCol,
    emissive: runeCol,
    emissiveIntensity: 0.9,
    roughness: 0.2,
  });

  // Base platform
  const base = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.0, 0.5, 8), stoneMat);
  base.position.y = 0.25;
  base.receiveShadow = true;
  group.add(base);

  // Pillars
  const pillarGeo = new THREE.CylinderGeometry(0.4, 0.45, 3.5, 8);
  const leftPillar = new THREE.Mesh(pillarGeo, stoneMat);
  leftPillar.position.set(-2.0, 2.0, 0);
  leftPillar.castShadow = true;
  group.add(leftPillar);

  const rightPillar = new THREE.Mesh(pillarGeo, stoneMat);
  rightPillar.position.set(2.0, 2.0, 0);
  rightPillar.castShadow = true;
  group.add(rightPillar);

  // Arch Header
  const arch = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.6, 0.9), stoneMat);
  arch.position.set(0, 3.8, 0);
  arch.castShadow = true;
  group.add(arch);

  // Portal energy vortex inside
  const portalVortex = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 3.2),
    new THREE.MeshBasicMaterial({
      color: runeCol,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    })
  );
  portalVortex.position.set(0, 2.0, 0);
  group.add(portalVortex);

  // Point light for glowing beacon
  const light = new THREE.PointLight(new THREE.Color(runeCol), 2.5, 12);
  light.position.set(0, 2.2, 0);
  group.add(light);

  group.userData = { vortex: portalVortex, light };
  return group;
}

/**
 * Creates 3D collectible items: Healing Potion, Bomb Crate, Gold Coin.
 */
export function createPickupModel(type: 'heal' | 'bomb' | 'coin'): THREE.Group {
  const group = new THREE.Group();

  if (type === 'heal') {
    // Glass elixir flask with red healing liquid
    const glassMat = new THREE.MeshStandardMaterial({
      color: '#ff4d6d',
      emissive: '#c9184a',
      emissiveIntensity: 0.4,
      roughness: 0.1,
      metalness: 0.2,
    });
    const flask = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), glassMat);
    flask.scale.set(1.0, 1.2, 1.0);
    group.add(flask);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.15, 8), glassMat);
    neck.position.y = 0.28;
    group.add(neck);

    const cork = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.07, 0.08, 8),
      new THREE.MeshStandardMaterial({ color: '#7f4f24', roughness: 0.8 })
    );
    cork.position.y = 0.38;
    group.add(cork);
  } else if (type === 'bomb') {
    // Spherical bomb with fuse & spark
    const bombMat = new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.3, metalness: 0.8 });
    const bomb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), bombMat);
    group.add(bomb);

    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.08, 8),
      new THREE.MeshStandardMaterial({ color: '#e0a96d', metalness: 0.9 })
    );
    cap.position.y = 0.28;
    group.add(cap);

    // Glowing spark on tip
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 6, 6),
      new THREE.MeshBasicMaterial({ color: '#ffb703' })
    );
    spark.position.set(0.04, 0.38, 0);
    group.add(spark);
  } else {
    // Golden Coin
    const coinMat = new THREE.MeshStandardMaterial({
      color: '#ffb703',
      metalness: 0.9,
      roughness: 0.2,
      emissive: '#e85d04',
      emissiveIntensity: 0.2,
    });
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 16), coinMat);
    coin.rotation.x = Math.PI / 2;
    group.add(coin);
  }

  // Contact shadow
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(0.7, 0.7, 0.7);
  shadow.position.y = -0.45;
  group.add(shadow);

  group.position.y = 0.55;
  return group;
}

/**
 * Creates the Boss Lair / House / Cave exterior building in the overworld.
 */
export function createBossLairExterior(phase = 1): THREE.Group {
  const group = new THREE.Group();

  if (phase === 1) {
    // Phase 1: Cabaña / Cueva del Guardián del Bosque (Rustic Stone & Timber Cabin / Cave)
    const stoneMat = new THREE.MeshStandardMaterial({ color: '#3d4035', roughness: 0.9 });
    const woodMat = new THREE.MeshStandardMaterial({ color: '#543d2b', roughness: 0.8 });
    const roofMat = new THREE.MeshStandardMaterial({ color: '#2b3a2a', roughness: 0.7 });
    const doorMat = new THREE.MeshStandardMaterial({ color: '#2b1d0c', roughness: 0.85 });
    const goldMat = new THREE.MeshStandardMaterial({ color: '#ffb703', metalness: 0.8, roughness: 0.2 });

    // Main Cabin Walls (Stone foundation + Timber logs)
    const baseBuilding = new THREE.Mesh(new THREE.BoxGeometry(8.5, 4.5, 7.5), stoneMat);
    baseBuilding.position.set(0, 2.25, 0);
    baseBuilding.castShadow = true;
    baseBuilding.receiveShadow = true;
    group.add(baseBuilding);

    // Front Timber Facade Beams
    const beamGeo = new THREE.BoxGeometry(0.5, 4.6, 0.5);
    const leftBeam = new THREE.Mesh(beamGeo, woodMat);
    leftBeam.position.set(-4.0, 2.3, 3.8);
    leftBeam.castShadow = true;
    group.add(leftBeam);

    const rightBeam = new THREE.Mesh(beamGeo, woodMat);
    rightBeam.position.set(4.0, 2.3, 3.8);
    rightBeam.castShadow = true;
    group.add(rightBeam);

    // Gabled Roof
    const roofGeo = new THREE.ConeGeometry(6.5, 3.2, 4);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 6.0, 0);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1.1, 1.0, 0.95);
    roof.castShadow = true;
    group.add(roof);

    // Stone Chimney with smoke
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.5, 1.2), stoneMat);
    chimney.position.set(2.8, 5.5, -1.5);
    chimney.castShadow = true;
    group.add(chimney);

    // Entrance Archway & Doorway
    const archFrame = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.8, 0.6), woodMat);
    archFrame.position.set(0, 1.9, 3.9);
    group.add(archFrame);

    // Door Portal Opening
    const doorOpening = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 3.2),
      new THREE.MeshBasicMaterial({ color: '#101410', side: THREE.DoubleSide })
    );
    doorOpening.position.set(0, 1.6, 4.22);
    group.add(doorOpening);

    // Glowing Entrance Vortex
    const vortex = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 3.0),
      new THREE.MeshBasicMaterial({
        color: '#52b788',
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      })
    );
    vortex.position.set(0, 1.6, 4.25);
    group.add(vortex);

    // 2 Lanterns beside the door
    [-1.7, 1.7].forEach((lx) => {
      const lanternBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.5, 0.35),
        new THREE.MeshStandardMaterial({ color: '#222222', metalness: 0.8 })
      );
      lanternBox.position.set(lx, 2.6, 4.2);
      group.add(lanternBox);

      const lampLight = new THREE.PointLight(0xffb703, 2.0, 8);
      lampLight.position.set(lx, 2.6, 4.5);
      group.add(lampLight);
    });

    // 3 Stone Pedestals with keyhole rune sockets in front of the door
    [-1.8, 0, 1.8].forEach((px, i) => {
      const plinth = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.45, 0.8, 6),
        stoneMat
      );
      plinth.position.set(px, 0.4, 5.5);
      plinth.castShadow = true;
      group.add(plinth);

      // Key socket rune
      const rune = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.25, 0.1),
        goldMat
      );
      rune.position.set(px, 0.85, 5.5);
      group.add(rune);
    });

    group.userData = { vortex, type: 'house' };
  } else if (phase === 2) {
    // Phase 2: Mausoleo / Cueva del Espectro (Gothic Crypt Tomb Facade)
    const darkStoneMat = new THREE.MeshStandardMaterial({ color: '#1e212d', roughness: 0.85 });
    const runeMat = new THREE.MeshStandardMaterial({ color: '#00f5d4', emissive: '#00f5d4', emissiveIntensity: 0.8 });

    // Main Crypt Structure
    const cryptBody = new THREE.Mesh(new THREE.BoxGeometry(9.0, 5.5, 7.5), darkStoneMat);
    cryptBody.position.set(0, 2.75, 0);
    cryptBody.castShadow = true;
    group.add(cryptBody);

    // Gothic Arch Pillars
    const colGeo = new THREE.CylinderGeometry(0.5, 0.6, 5.0, 8);
    const leftCol = new THREE.Mesh(colGeo, darkStoneMat);
    leftCol.position.set(-2.2, 2.5, 4.0);
    group.add(leftCol);

    const rightCol = new THREE.Mesh(colGeo, darkStoneMat);
    rightCol.position.set(2.2, 2.5, 4.0);
    group.add(rightCol);

    // Archway Header
    const archTop = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.9, 0.8), darkStoneMat);
    archTop.position.set(0, 5.2, 4.0);
    group.add(archTop);

    // Glowing Subterranean Portal
    const vortex = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 4.0),
      new THREE.MeshBasicMaterial({
        color: '#00b4d8',
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      })
    );
    vortex.position.set(0, 2.2, 3.9);
    group.add(vortex);

    // Cyan Soul Braziers
    [-2.6, 2.6].forEach((bx) => {
      const brazier = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.25, 1.2, 6),
        darkStoneMat
      );
      brazier.position.set(bx, 0.6, 5.0);
      group.add(brazier);

      const fire = new THREE.Mesh(new THREE.OctahedronGeometry(0.25), runeMat);
      fire.position.set(bx, 1.35, 5.0);
      group.add(fire);

      const light = new THREE.PointLight(0x00f5d4, 2.2, 10);
      light.position.set(bx, 1.5, 5.0);
      group.add(light);
    });

    group.userData = { vortex, type: 'crypt' };
  } else {
    // Phase 3: Cámara Volcánica del Coloso (Obsidian Magma Cavern Mouth)
    const basaltMat = new THREE.MeshStandardMaterial({ color: '#16191f', roughness: 0.9 });
    const lavaMat = new THREE.MeshStandardMaterial({
      color: '#ff4800',
      emissive: '#d00000',
      emissiveIntensity: 0.9,
    });

    // Basalt Arch Spires
    const mainMaw = new THREE.Mesh(new THREE.BoxGeometry(10.0, 6.5, 8.0), basaltMat);
    mainMaw.position.set(0, 3.25, 0);
    mainMaw.castShadow = true;
    group.add(mainMaw);

    // Jagged Horn Spikes on Top
    [-3.0, -1.0, 1.0, 3.0].forEach((sx, i) => {
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.7, 3.0, 5), basaltMat);
      spire.position.set(sx, 7.5, 0.5);
      spire.rotation.z = (i - 1.5) * 0.15;
      spire.castShadow = true;
      group.add(spire);
    });

    // Glowing Fiery Cavern Opening
    const vortex = new THREE.Mesh(
      new THREE.PlaneGeometry(3.5, 4.5),
      new THREE.MeshBasicMaterial({
        color: '#ff5400',
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
      })
    );
    vortex.position.set(0, 2.5, 4.1);
    group.add(vortex);

    // Lava Light
    const lavaLight = new THREE.PointLight(0xff5400, 3.5, 14);
    lavaLight.position.set(0, 2.5, 4.5);
    group.add(lavaLight);

    group.userData = { vortex, type: 'magma' };
  }

  return group;
}

/**
 * Creates the interior arena structure for the Boss fight (dedicated house / cave room).
 */
export function createInteriorBossArena(phase = 1): {
  group: THREE.Group;
  obstacles: WorldObstacle[];
  lights: THREE.Light[];
  hazardZones: { x: number; z: number; r: number }[];
  arenaRadius: number;
} {
  const group = new THREE.Group();
  const obstacles: WorldObstacle[] = [];
  const lights: THREE.Light[] = [];
  const hazardZones: { x: number; z: number; r: number }[] = [];
  const arenaRadius = 20;

  if (phase === 1) {
    // Interior: Cabaña de Piedra / Cueva del Guardián del Bosque
    const floorTexture = getCobblestoneTexture('#353d2d', '#23291d', 512);
    floorTexture.repeat.set(10, 10);
    const floorGeo = new THREE.PlaneGeometry(arenaRadius * 2.3, arenaRadius * 2.3);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);

    // Wall Materials
    const wallMat = new THREE.MeshStandardMaterial({ color: '#2a2e24', roughness: 0.95 });
    const wallCapMat = new THREE.MeshStandardMaterial({ color: '#3d4434', roughness: 0.85 });
    const woodBeamMat = new THREE.MeshStandardMaterial({ color: '#4a3525', roughness: 0.85 });

    // Build Circular Walls with Cut-Away Front (Zero camera occlusion)
    // Southern walls (z > 0) facing the camera are low curbs (0.75m high)
    // Northern walls (z <= -3) provide tall cavern backdrops (7.5m high)
    const numWallSegments = 24;
    for (let i = 0; i < numWallSegments; i++) {
      const angle = (i * Math.PI * 2) / numWallSegments;
      const x = Math.cos(angle) * arenaRadius;
      const z = Math.sin(angle) * arenaRadius;

      // Obstacle collision boundary always encircles the arena at full radius
      obstacles.push({ x, z, radius: 2.2, type: 'wall' });

      if (z > 0) {
        // Front wall facing camera: Low stone boundary foundation
        const lowWall = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.75, 1.8), wallMat);
        lowWall.position.set(x, 0.375, z);
        lowWall.rotation.y = -angle + Math.PI / 2;
        lowWall.castShadow = true;
        lowWall.receiveShadow = true;
        group.add(lowWall);

        // Stone cap trim
        const cap = new THREE.Mesh(new THREE.BoxGeometry(6.1, 0.12, 1.9), wallCapMat);
        cap.position.set(x, 0.81, z);
        cap.rotation.y = -angle + Math.PI / 2;
        group.add(cap);
      } else if (z > -3.5) {
        // Lateral transition walls: Mid-height stepped stones
        const midWall = new THREE.Mesh(new THREE.BoxGeometry(6.0, 3.0, 1.8), wallMat);
        midWall.position.set(x, 1.5, z);
        midWall.rotation.y = -angle + Math.PI / 2;
        midWall.castShadow = true;
        midWall.receiveShadow = true;
        group.add(midWall);

        const cap = new THREE.Mesh(new THREE.BoxGeometry(6.1, 0.15, 1.9), wallCapMat);
        cap.position.set(x, 3.07, z);
        cap.rotation.y = -angle + Math.PI / 2;
        group.add(cap);
      } else {
        // Back cavern walls: Full tall rustic stone
        const tallWall = new THREE.Mesh(new THREE.BoxGeometry(6.0, 7.8, 1.8), wallMat);
        tallWall.position.set(x, 3.9, z);
        tallWall.rotation.y = -angle + Math.PI / 2;
        tallWall.castShadow = true;
        tallWall.receiveShadow = true;
        group.add(tallWall);
      }
    }

    // Timber Roof Beams placed strictly along the back half (z <= -8, y = 8.0) so camera is never blocked
    [-14, -10].forEach((r) => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(arenaRadius * 1.6, 0.6, 0.6), woodBeamMat);
      beam.position.set(0, 7.8, r);
      group.add(beam);
    });

    // Torches on the rear tall walls
    for (let t = 0; t < 5; t++) {
      const angle = Math.PI + (t - 2) * 0.45; // Arranged along north half
      const tx = Math.cos(angle) * (arenaRadius - 1.2);
      const tz = Math.sin(angle) * (arenaRadius - 1.2);

      const sconce = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.1, 0.6, 6),
        new THREE.MeshStandardMaterial({ color: '#222222' })
      );
      sconce.position.set(tx, 3.6, tz);
      group.add(sconce);

      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.45, 6),
        new THREE.MeshBasicMaterial({ color: '#ff9e00' })
      );
      flame.position.set(tx, 4.0, tz);
      group.add(flame);

      const torchLight = new THREE.PointLight(0xff9e00, 2.5, 18);
      torchLight.position.set(tx, 4.2, tz);
      group.add(torchLight);
      lights.push(torchLight);
    }

    // Corner stone pillars for combat cover
    const coverPoints = [
      { x: -9, z: -8 },
      { x: 9, z: -8 },
      { x: -9, z: 6 },
      { x: 9, z: 6 },
    ];
    coverPoints.forEach((cp) => {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.9, cp.z > 0 ? 1.6 : 4.0, 8),
        wallMat
      );
      pillar.position.set(cp.x, cp.z > 0 ? 0.8 : 2.0, cp.z);
      pillar.castShadow = true;
      group.add(pillar);
      obstacles.push({ x: cp.x, z: cp.z, radius: 1.0, type: 'pillar' });
    });

    // Low entry threshold arch base at south entrance (z = 17)
    const doorThreshold = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.35, 1.2), woodBeamMat);
    doorThreshold.position.set(0, 0.18, arenaRadius - 1.5);
    group.add(doorThreshold);

  } else if (phase === 2) {
    // Interior: Cripta del Espectro del Abismo
    const floorTexture = getCobblestoneTexture('#141724', '#0c0e17', 512);
    floorTexture.repeat.set(12, 12);
    const floorGeo = new THREE.PlaneGeometry(arenaRadius * 2.3, arenaRadius * 2.3);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.7,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);

    const darkMat = new THREE.MeshStandardMaterial({ color: '#161926', roughness: 0.9 });
    const darkCapMat = new THREE.MeshStandardMaterial({ color: '#272b3d', roughness: 0.8 });
    const runeMat = new THREE.MeshStandardMaterial({ color: '#00f5d4', emissive: '#00f5d4', emissiveIntensity: 0.8 });

    // Perimeter Gothic Masonry Walls with Cut-Away Front
    const numWallSegments = 24;
    for (let i = 0; i < numWallSegments; i++) {
      const angle = (i * Math.PI * 2) / numWallSegments;
      const x = Math.cos(angle) * arenaRadius;
      const z = Math.sin(angle) * arenaRadius;

      obstacles.push({ x, z, radius: 2.2, type: 'wall' });

      if (z > 0) {
        // Low perimeter gothic foundation curb
        const lowWall = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.75, 1.8), darkMat);
        lowWall.position.set(x, 0.375, z);
        lowWall.rotation.y = -angle + Math.PI / 2;
        lowWall.castShadow = true;
        lowWall.receiveShadow = true;
        group.add(lowWall);

        const cap = new THREE.Mesh(new THREE.BoxGeometry(6.1, 0.12, 1.9), darkCapMat);
        cap.position.set(x, 0.81, z);
        cap.rotation.y = -angle + Math.PI / 2;
        group.add(cap);
      } else if (z > -3.5) {
        // Stepped lateral masonry
        const midWall = new THREE.Mesh(new THREE.BoxGeometry(6.0, 3.2, 1.8), darkMat);
        midWall.position.set(x, 1.6, z);
        midWall.rotation.y = -angle + Math.PI / 2;
        group.add(midWall);
      } else {
        // Tall gothic back masonry
        const tallWall = new THREE.Mesh(new THREE.BoxGeometry(6.0, 8.5, 1.8), darkMat);
        tallWall.position.set(x, 4.25, z);
        tallWall.rotation.y = -angle + Math.PI / 2;
        tallWall.castShadow = true;
        group.add(tallWall);
      }
    }

    // Subterranean Fluted Columns with Cyan Soul Braziers (positioned along sides and back)
    for (let c = 0; c < 6; c++) {
      const angle = Math.PI * 0.8 + (c * Math.PI * 1.4) / 5;
      const cx = Math.cos(angle) * 11;
      const cz = Math.sin(angle) * 11;

      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 5.5, 8), darkMat);
      col.position.set(cx, 2.75, cz);
      col.castShadow = true;
      group.add(col);
      obstacles.push({ x: cx, z: cz, radius: 0.9, type: 'pillar' });

      const soulFire = new THREE.Mesh(new THREE.OctahedronGeometry(0.25), runeMat);
      soulFire.position.set(cx, 4.5, cz);
      group.add(soulFire);

      const colLight = new THREE.PointLight(0x00f5d4, 2.0, 14);
      colLight.position.set(cx, 4.6, cz);
      group.add(colLight);
      lights.push(colLight);
    }

  } else {
    // Interior: Cámara Volcánica del Coloso de Magma
    const lavaTex = getLavaTexture(256);
    lavaTex.repeat.set(3, 3);

    const floorGeo = new THREE.PlaneGeometry(arenaRadius * 2.3, arenaRadius * 2.3);
    const floorMat = new THREE.MeshStandardMaterial({
      color: '#1a0c08',
      roughness: 0.9,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);

    const basaltMat = new THREE.MeshStandardMaterial({ color: '#13151b', roughness: 0.9, metalness: 0.3 });
    const lavaGlowMat = new THREE.MeshStandardMaterial({
      map: lavaTex,
      color: '#ff4800',
      emissive: '#d00000',
      emissiveIntensity: 1.0,
      roughness: 0.3,
    });

    // Perimeter Volcanic Cavern Walls with Cut-Away Front
    const numWallSegments = 24;
    for (let i = 0; i < numWallSegments; i++) {
      const angle = (i * Math.PI * 2) / numWallSegments;
      const x = Math.cos(angle) * arenaRadius;
      const z = Math.sin(angle) * arenaRadius;

      obstacles.push({ x, z, radius: 2.2, type: 'wall' });

      if (z > 0) {
        // Low volcanic basalt rocks curb
        const lowRock = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.8, 2.0), basaltMat);
        lowRock.position.set(x, 0.4, z);
        lowRock.rotation.y = -angle + Math.PI / 2;
        lowRock.castShadow = true;
        group.add(lowRock);
      } else if (z > -3.5) {
        // Stepped basalt formations
        const midRock = new THREE.Mesh(new THREE.BoxGeometry(6.0, 3.2, 2.0), basaltMat);
        midRock.position.set(x, 1.6, z);
        midRock.rotation.y = -angle + Math.PI / 2;
        group.add(midRock);
      } else {
        // Towering volcanic basalt cavern back wall
        const tallWall = new THREE.Mesh(new THREE.BoxGeometry(6.0, 9.0, 2.0), basaltMat);
        tallWall.position.set(x, 4.5, z);
        tallWall.rotation.y = -angle + Math.PI / 2;
        tallWall.castShadow = true;
        group.add(tallWall);
      }
    }

    // Outer Lava Moat Ring (Hazard zone inside the arena)
    const lavaMoatGeo = new THREE.RingGeometry(arenaRadius - 3.5, arenaRadius - 1.2, 32);
    const lavaMoat = new THREE.Mesh(lavaMoatGeo, lavaGlowMat);
    lavaMoat.rotation.x = -Math.PI / 2;
    lavaMoat.position.y = 0.05;
    group.add(lavaMoat);

    hazardZones.push({ x: 0, z: 0, r: arenaRadius - 1.2 });

    // Volcanic Basalt Spires for cover (tactically positioned)
    const spires = [
      { x: -8, z: -7, h: 5.0 },
      { x: 8, z: -7, h: 5.0 },
      { x: -8, z: 5, h: 2.2 },
      { x: 8, z: 5, h: 2.2 },
    ];
    spires.forEach((sp) => {
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, sp.h, 6), basaltMat);
      spire.position.set(sp.x, sp.h / 2, sp.z);
      spire.castShadow = true;
      group.add(spire);
      obstacles.push({ x: sp.x, z: sp.z, radius: 1.1, type: 'pillar' });
    });

    // Fiery Ambient Red-Orange Lights
    for (let l = 0; l < 4; l++) {
      const angle = (l * Math.PI * 2) / 4;
      const lx = Math.cos(angle) * 12;
      const lz = Math.sin(angle) * 12;

      const fireLight = new THREE.PointLight(0xff5400, 3.2, 18);
      fireLight.position.set(lx, 3.5, lz);
      group.add(fireLight);
      lights.push(fireLight);
    }
  }

  return {
    group,
    obstacles,
    lights,
    hazardZones,
    arenaRadius,
  };
}

/**
 * Creates the glowing Golden Victory Exit Portal inside the boss cave.
 */
export function createVictoryExitPortal(phase = 1): THREE.Group {
  const group = new THREE.Group();

  const goldMat = new THREE.MeshStandardMaterial({
    color: '#ffea00',
    emissive: '#ffb703',
    emissiveIntensity: 0.9,
    metalness: 0.8,
    roughness: 0.2,
  });

  // Base platform
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 0.4, 8), goldMat);
  base.position.y = 0.2;
  group.add(base);

  // Twin Golden Pillars
  const pillarGeo = new THREE.CylinderGeometry(0.3, 0.35, 3.8, 8);
  const leftCol = new THREE.Mesh(pillarGeo, goldMat);
  leftCol.position.set(-1.6, 2.1, 0);
  group.add(leftCol);

  const rightCol = new THREE.Mesh(pillarGeo, goldMat);
  rightCol.position.set(1.6, 2.1, 0);
  group.add(rightCol);

  // Arch Header
  const arch = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.5, 0.6), goldMat);
  arch.position.set(0, 4.0, 0);
  group.add(arch);

  // Radiant Golden Light Beam
  const beamMat = new THREE.MeshBasicMaterial({
    color: '#ffea00',
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 6.0, 16, 1, true), beamMat);
  beam.position.set(0, 3.2, 0);
  group.add(beam);

  // Floating rotating sacred relic / key above the exit
  const relic = createKeyModel(phase - 1);
  relic.position.set(0, 4.6, 0);
  relic.scale.set(1.4, 1.4, 1.4);
  group.add(relic);

  // Bright beacon point light
  const light = new THREE.PointLight(0xffea00, 3.5, 14);
  light.position.set(0, 2.5, 0);
  group.add(light);

  group.userData = { beam, relic, light };
  return group;
}

