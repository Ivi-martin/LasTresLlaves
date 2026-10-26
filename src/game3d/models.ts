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

  // Digital Camouflage Texture
  const camoTex = getDigitalCamoTexture(256);
  camoTex.repeat.set(2, 2);

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: '#f5cbb0',
    roughness: 0.55,
    metalness: 0.02,
  });

  const camoMat = new THREE.MeshStandardMaterial({
    map: camoTex,
    color: '#95a17a',
    roughness: 0.65,
    metalness: 0.05,
  });

  const innerShirtMat = new THREE.MeshStandardMaterial({
    color: '#38432a',
    roughness: 0.8,
    metalness: 0.05,
  });

  const pocketMat = new THREE.MeshStandardMaterial({
    color: '#495632',
    roughness: 0.7,
    metalness: 0.05,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: '#463223',
    roughness: 0.85,
    metalness: 0.05,
  });

  const hairHighlightMat = new THREE.MeshStandardMaterial({
    color: '#5c412e',
    roughness: 0.85,
  });

  const bootMat = new THREE.MeshStandardMaterial({
    color: '#1a1b1d',
    roughness: 0.7,
    metalness: 0.15,
  });

  const soleMat = new THREE.MeshStandardMaterial({
    color: '#111213',
    roughness: 0.9,
  });

  // 1. Contact shadow on ground
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1.4, 1.4, 1.4);
  shadow.position.y = 0.02;
  group.add(shadow);

  // 2. Torso: Military Camo Jacket
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 0.78;
  group.add(torsoGroup);

  const torsoGeo = new THREE.BoxGeometry(0.56, 0.62, 0.36);
  const torso = new THREE.Mesh(torsoGeo, camoMat);
  torso.castShadow = true;
  torso.receiveShadow = true;
  torsoGroup.add(torso);
  baseMaterials.push({ mesh: torso, originalMat: camoMat });

  // Inner crewneck collar (dark olive)
  const innerCollar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.08), innerShirtMat);
  innerCollar.position.set(0, 0.28, 0.15);
  torsoGroup.add(innerCollar);
  baseMaterials.push({ mesh: innerCollar, originalMat: innerShirtMat });

  // Folded collar lapels in V-neck shape
  const lapelGeo = new THREE.BoxGeometry(0.12, 0.22, 0.06);
  const leftLapel = new THREE.Mesh(lapelGeo, pocketMat);
  leftLapel.position.set(-0.11, 0.23, 0.18);
  leftLapel.rotation.z = -0.3;
  torsoGroup.add(leftLapel);
  baseMaterials.push({ mesh: leftLapel, originalMat: pocketMat });

  const rightLapel = new THREE.Mesh(lapelGeo, pocketMat);
  rightLapel.position.set(0.11, 0.23, 0.18);
  rightLapel.rotation.z = 0.3;
  torsoGroup.add(rightLapel);
  baseMaterials.push({ mesh: rightLapel, originalMat: pocketMat });

  // 4 Front Military Flap Cargo Pockets
  const pocketGeo = new THREE.BoxGeometry(0.16, 0.15, 0.05);
  const buttonMat = new THREE.MeshBasicMaterial({ color: '#272e1e' });

  // Upper Chest Pockets
  const upLeftPocket = new THREE.Mesh(pocketGeo, pocketMat);
  upLeftPocket.position.set(-0.16, 0.09, 0.18);
  torsoGroup.add(upLeftPocket);
  baseMaterials.push({ mesh: upLeftPocket, originalMat: pocketMat });

  const upRightPocket = new THREE.Mesh(pocketGeo, pocketMat);
  upRightPocket.position.set(0.16, 0.09, 0.18);
  torsoGroup.add(upRightPocket);
  baseMaterials.push({ mesh: upRightPocket, originalMat: pocketMat });

  // Lower Torso Pockets
  const lowLeftPocket = new THREE.Mesh(pocketGeo, pocketMat);
  lowLeftPocket.position.set(-0.16, -0.15, 0.18);
  torsoGroup.add(lowLeftPocket);
  baseMaterials.push({ mesh: lowLeftPocket, originalMat: pocketMat });

  const lowRightPocket = new THREE.Mesh(pocketGeo, pocketMat);
  lowRightPocket.position.set(0.16, -0.15, 0.18);
  torsoGroup.add(lowRightPocket);
  baseMaterials.push({ mesh: lowRightPocket, originalMat: pocketMat });

  // Shoulder Epaulets / Straps
  const epauletGeo = new THREE.BoxGeometry(0.18, 0.05, 0.24);
  const leftEpaulet = new THREE.Mesh(epauletGeo, pocketMat);
  leftEpaulet.position.set(-0.32, 0.31, 0);
  torsoGroup.add(leftEpaulet);
  baseMaterials.push({ mesh: leftEpaulet, originalMat: pocketMat });

  const rightEpaulet = new THREE.Mesh(epauletGeo, pocketMat);
  rightEpaulet.position.set(0.32, 0.31, 0);
  torsoGroup.add(rightEpaulet);
  baseMaterials.push({ mesh: rightEpaulet, originalMat: pocketMat });

  // 3. Head & Face (Martín's Chibi Anime Face & Voxel Hair)
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.48;
  torsoGroup.add(headGroup);

  const headGeo = new THREE.BoxGeometry(0.44, 0.44, 0.4);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.castShadow = true;
  headGroup.add(head);
  baseMaterials.push({ mesh: head, originalMat: skinMat });

  // Anime Eyes with Catchlight Highlights
  const eyeScleraMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const eyeIrisMat = new THREE.MeshBasicMaterial({ color: '#382115' });
  const eyeGleamMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const eyebrowMat = new THREE.MeshBasicMaterial({ color: '#27170e' });

  // Left Eye Group
  const eyeL = new THREE.Group();
  eyeL.position.set(-0.12, 0.03, 0.205);
  const scleraL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.12, 0.02), eyeScleraMat);
  const irisL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, 0.03), eyeIrisMat);
  const gleamL = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.035), eyeGleamMat);
  gleamL.position.set(-0.02, 0.03, 0.01);
  eyeL.add(scleraL);
  eyeL.add(irisL);
  eyeL.add(gleamL);
  headGroup.add(eyeL);

  // Right Eye Group
  const eyeR = new THREE.Group();
  eyeR.position.set(0.12, 0.03, 0.205);
  const scleraR = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.12, 0.02), eyeScleraMat);
  const irisR = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, 0.03), eyeIrisMat);
  const gleamR = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.035), eyeGleamMat);
  gleamR.position.set(-0.02, 0.03, 0.01);
  eyeR.add(scleraR);
  eyeR.add(irisR);
  eyeR.add(gleamR);
  headGroup.add(eyeR);

  // Eyebrows
  const browL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.02), eyebrowMat);
  browL.position.set(-0.12, 0.12, 0.21);
  browL.rotation.z = -0.08;
  headGroup.add(browL);

  const browR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.02), eyebrowMat);
  browR.position.set(0.12, 0.12, 0.21);
  browR.rotation.z = 0.08;
  headGroup.add(browR);

  // Nose and Smile
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.03), new THREE.MeshBasicMaterial({ color: '#e5b89a' }));
  nose.position.set(0, -0.04, 0.21);
  headGroup.add(nose);

  const smile = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.02), new THREE.MeshBasicMaterial({ color: '#884a3b' }));
  smile.position.set(0, -0.1, 0.205);
  headGroup.add(smile);

  // Ears
  const earL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.08), skinMat);
  earL.position.set(-0.24, 0, 0);
  headGroup.add(earL);

  const earR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.08), skinMat);
  earR.position.set(0.24, 0, 0);
  headGroup.add(earR);

  // Martín's Layered Spiky Voxel Hair (Iconic brown locks from image)
  const hairGroup = new THREE.Group();
  headGroup.add(hairGroup);

  // Main Hair Helmet base
  const hairBase = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.24, 0.46), hairMat);
  hairBase.position.set(0, 0.21, -0.02);
  hairGroup.add(hairBase);
  baseMaterials.push({ mesh: hairBase, originalMat: hairMat });

  // Back layered drape
  const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.28, 0.14), hairMat);
  hairBack.position.set(0, 0.06, -0.18);
  hairGroup.add(hairBack);
  baseMaterials.push({ mesh: hairBack, originalMat: hairMat });

  // Front Bang Spikes (sweeping across forehead as seen in the picture)
  const spike1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.12), hairMat);
  spike1.position.set(-0.06, 0.18, 0.2);
  hairGroup.add(spike1);
  baseMaterials.push({ mesh: spike1, originalMat: hairMat });

  const spike2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.14), hairHighlightMat);
  spike2.position.set(0.08, 0.19, 0.19);
  hairGroup.add(spike2);
  baseMaterials.push({ mesh: spike2, originalMat: hairHighlightMat });

  const spike3 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.12), hairMat);
  spike3.position.set(-0.18, 0.15, 0.17);
  hairGroup.add(spike3);
  baseMaterials.push({ mesh: spike3, originalMat: hairMat });

  const spike4 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.12), hairMat);
  spike4.position.set(0.19, 0.15, 0.16);
  hairGroup.add(spike4);
  baseMaterials.push({ mesh: spike4, originalMat: hairMat });

  // Top Textured Voxel Clusters (Volumetric crown spikes)
  const topSpike1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), hairHighlightMat);
  topSpike1.position.set(-0.02, 0.33, 0.02);
  hairGroup.add(topSpike1);
  baseMaterials.push({ mesh: topSpike1, originalMat: hairHighlightMat });

  const topSpike2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), hairMat);
  topSpike2.position.set(-0.14, 0.31, -0.04);
  hairGroup.add(topSpike2);
  baseMaterials.push({ mesh: topSpike2, originalMat: hairMat });

  const topSpike3 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), hairHighlightMat);
  topSpike3.position.set(0.13, 0.3, -0.02);
  hairGroup.add(topSpike3);
  baseMaterials.push({ mesh: topSpike3, originalMat: hairHighlightMat });

  const topSpike4 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.15, 0.16), hairMat);
  topSpike4.position.set(0.03, 0.28, -0.16);
  hairGroup.add(topSpike4);
  baseMaterials.push({ mesh: topSpike4, originalMat: hairMat });

  // 4. Hat (if equipped by user)
  if (hat && hat.drawType !== 'none') {
    const hatGroup = new THREE.Group();
    hatGroup.position.y = 0.26;

    const hatCol = new THREE.Color(hat.color || '#ffb020');
    const customHatMat = new THREE.MeshStandardMaterial({
      color: hatCol,
      roughness: 0.3,
      metalness: hat.drawType === 'crown' ? 0.8 : 0.2,
    });

    if (hat.drawType === 'crown') {
      const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.22, 0.16, 8), customHatMat);
      crownBase.castShadow = true;
      hatGroup.add(crownBase);
      for (let i = 0; i < 4; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 4), customHatMat);
        const angle = (i * Math.PI) / 2;
        spike.position.set(Math.cos(angle) * 0.22, 0.14, Math.sin(angle) * 0.22);
        hatGroup.add(spike);
      }
    } else if (hat.drawType === 'fedora') {
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 16), customHatMat);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.22, 12), customHatMat);
      top.position.y = 0.11;
      hatGroup.add(brim);
      hatGroup.add(top);
    } else if (hat.drawType === 'horns') {
      const hornMat = new THREE.MeshStandardMaterial({ color: '#e63946', roughness: 0.3 });
      const hornGeo = new THREE.ConeGeometry(0.07, 0.32, 6);
      const leftHorn = new THREE.Mesh(hornGeo, hornMat);
      leftHorn.position.set(-0.22, 0.1, 0);
      leftHorn.rotation.z = 0.5;
      leftHorn.rotation.x = -0.2;
      const rightHorn = new THREE.Mesh(hornGeo, hornMat);
      rightHorn.position.set(0.22, 0.1, 0);
      rightHorn.rotation.z = -0.5;
      rightHorn.rotation.x = -0.2;
      hatGroup.add(leftHorn);
      hatGroup.add(rightHorn);
    } else if (hat.drawType === 'halo') {
      const haloMat = new THREE.MeshBasicMaterial({ color: '#ffea00' });
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.04, 8, 24), haloMat);
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 0.3;
      hatGroup.add(halo);
    } else if (hat.drawType === 'visor') {
      const visorMat = new THREE.MeshBasicMaterial({ color: '#00f5d4' });
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.15), visorMat);
      visor.position.set(0, -0.15, 0.2);
      hatGroup.add(visor);
    } else {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.1, 12), customHatMat);
      band.position.y = -0.1;
      hatGroup.add(band);
    }
    headGroup.add(hatGroup);
  }

  // 5. Legs: Military Camo Cargo Pants
  const legGeo = new THREE.BoxGeometry(0.2, 0.44, 0.22);
  const cargoPocketGeo = new THREE.BoxGeometry(0.06, 0.16, 0.14);

  // Left Leg
  const leftLeg = new THREE.Mesh(legGeo, camoMat);
  leftLeg.position.set(-0.16, 0.25, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);
  baseMaterials.push({ mesh: leftLeg, originalMat: camoMat });

  const leftCargo = new THREE.Mesh(cargoPocketGeo, pocketMat);
  leftCargo.position.set(-0.12, 0.04, 0);
  leftLeg.add(leftCargo);
  baseMaterials.push({ mesh: leftCargo, originalMat: pocketMat });

  // Right Leg
  const rightLeg = new THREE.Mesh(legGeo, camoMat);
  rightLeg.position.set(0.16, 0.25, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);
  baseMaterials.push({ mesh: rightLeg, originalMat: camoMat });

  const rightCargo = new THREE.Mesh(cargoPocketGeo, pocketMat);
  rightCargo.position.set(0.12, 0.04, 0);
  rightLeg.add(rightCargo);
  baseMaterials.push({ mesh: rightCargo, originalMat: pocketMat });

  // Tactical Combat Boots (Chunky black tread boots from reference)
  const bootAnkleGeo = new THREE.BoxGeometry(0.22, 0.16, 0.24);
  const bootFootGeo = new THREE.BoxGeometry(0.22, 0.14, 0.32);
  const bootSoleGeo = new THREE.BoxGeometry(0.24, 0.06, 0.34);

  // Left Boot
  const leftBootAnkle = new THREE.Mesh(bootAnkleGeo, bootMat);
  leftBootAnkle.position.set(0, -0.16, 0.01);
  leftBootAnkle.castShadow = true;
  leftLeg.add(leftBootAnkle);
  baseMaterials.push({ mesh: leftBootAnkle, originalMat: bootMat });

  const leftBootFoot = new THREE.Mesh(bootFootGeo, bootMat);
  leftBootFoot.position.set(0, -0.21, 0.05);
  leftLeg.add(leftBootFoot);
  baseMaterials.push({ mesh: leftBootFoot, originalMat: bootMat });

  const leftBootSole = new THREE.Mesh(bootSoleGeo, soleMat);
  leftBootSole.position.set(0, -0.25, 0.05);
  leftLeg.add(leftBootSole);
  baseMaterials.push({ mesh: leftBootSole, originalMat: soleMat });

  // Right Boot
  const rightBootAnkle = new THREE.Mesh(bootAnkleGeo, bootMat);
  rightBootAnkle.position.set(0, -0.16, 0.01);
  rightBootAnkle.castShadow = true;
  rightLeg.add(rightBootAnkle);
  baseMaterials.push({ mesh: rightBootAnkle, originalMat: bootMat });

  const rightBootFoot = new THREE.Mesh(bootFootGeo, bootMat);
  rightBootFoot.position.set(0, -0.21, 0.05);
  rightLeg.add(rightBootFoot);
  baseMaterials.push({ mesh: rightBootFoot, originalMat: bootMat });

  const rightBootSole = new THREE.Mesh(bootSoleGeo, soleMat);
  rightBootSole.position.set(0, -0.25, 0.05);
  rightLeg.add(rightBootSole);
  baseMaterials.push({ mesh: rightBootSole, originalMat: soleMat });

  // 6. Arms and Hands (Camo sleeves and tactical grip)
  const armGeo = new THREE.BoxGeometry(0.16, 0.44, 0.18);
  const handGeo = new THREE.BoxGeometry(0.12, 0.14, 0.14);

  // Left Arm
  const leftArm = new THREE.Mesh(armGeo, camoMat);
  leftArm.position.set(-0.38, 0.05, 0);
  leftArm.castShadow = true;
  torsoGroup.add(leftArm);
  baseMaterials.push({ mesh: leftArm, originalMat: camoMat });

  // Sleeve pocket on left arm
  const sleevePocket = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.12), pocketMat);
  sleevePocket.position.set(-0.08, 0.08, 0);
  leftArm.add(sleevePocket);
  baseMaterials.push({ mesh: sleevePocket, originalMat: pocketMat });

  const leftHand = new THREE.Mesh(handGeo, skinMat);
  leftHand.position.set(0, -0.25, 0.02);
  leftArm.add(leftHand);
  baseMaterials.push({ mesh: leftHand, originalMat: skinMat });

  // Right Arm
  const rightArm = new THREE.Mesh(armGeo, camoMat);
  rightArm.position.set(0.38, 0.05, 0);
  rightArm.castShadow = true;
  torsoGroup.add(rightArm);
  baseMaterials.push({ mesh: rightArm, originalMat: camoMat });

  const rightHand = new THREE.Mesh(handGeo, skinMat);
  rightHand.position.set(0, -0.25, 0.02);
  rightArm.add(rightHand);
  baseMaterials.push({ mesh: rightHand, originalMat: skinMat });

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
    // Shotgun: stock, double barrels, pump
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
    // Pistol: frame, grip, slide
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.18, 0.09), woodMat);
    grip.position.set(0, -0.05, 0);
    grip.rotation.x = -0.2;
    gunGroup.add(grip);

    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.34), weaponMat);
    slide.position.set(0, 0.05, 0.1);
    gunGroup.add(slide);
  }
  weaponMount.add(gunGroup);

  // Muzzle point offset in weapon space
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

    // Wall Material: High Rustic Stone Cavern Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: '#2a2e24', roughness: 0.95 });
    const woodBeamMat = new THREE.MeshStandardMaterial({ color: '#4a3525', roughness: 0.85 });

    // Build Circular Enclosed Walls (24 segmented wall blocks around perimeter)
    const numWallSegments = 24;
    for (let i = 0; i < numWallSegments; i++) {
      const angle = (i * Math.PI * 2) / numWallSegments;
      const x = Math.cos(angle) * arenaRadius;
      const z = Math.sin(angle) * arenaRadius;

      const wallBlock = new THREE.Mesh(new THREE.BoxGeometry(6.0, 7.5, 1.8), wallMat);
      wallBlock.position.set(x, 3.75, z);
      wallBlock.rotation.y = -angle + Math.PI / 2;
      wallBlock.castShadow = true;
      wallBlock.receiveShadow = true;
      group.add(wallBlock);

      obstacles.push({ x, z, radius: 2.2, type: 'wall' });
    }

    // Timber Roof Beams spanning the room
    for (let r = -12; r <= 12; r += 6) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(arenaRadius * 1.9, 0.6, 0.6), woodBeamMat);
      beam.position.set(0, 7.2, r);
      group.add(beam);
    }

    // 6 Burning Iron Wall Torches with warm flickering point lights
    for (let t = 0; t < 6; t++) {
      const angle = (t * Math.PI * 2) / 6;
      const tx = Math.cos(angle) * (arenaRadius - 1.2);
      const tz = Math.sin(angle) * (arenaRadius - 1.2);

      const sconce = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.1, 0.6, 6),
        new THREE.MeshStandardMaterial({ color: '#222222' })
      );
      sconce.position.set(tx, 3.2, tz);
      group.add(sconce);

      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.45, 6),
        new THREE.MeshBasicMaterial({ color: '#ff9e00' })
      );
      flame.position.set(tx, 3.6, tz);
      group.add(flame);

      const torchLight = new THREE.PointLight(0xff9e00, 2.2, 16);
      torchLight.position.set(tx, 3.8, tz);
      group.add(torchLight);
      lights.push(torchLight);
    }

    // Corner decorative crates, barrels and stone pillars (combat cover)
    const coverPoints = [
      { x: -9, z: -9 },
      { x: 9, z: -9 },
      { x: -9, z: 9 },
      { x: 9, z: 9 },
    ];
    coverPoints.forEach((cp) => {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.9, 4.0, 8),
        wallMat
      );
      pillar.position.set(cp.x, 2.0, cp.z);
      pillar.castShadow = true;
      group.add(pillar);
      obstacles.push({ x: cp.x, z: cp.z, radius: 1.0, type: 'pillar' });
    });

    // Sealed Entrance Door at z = 17
    const door = new THREE.Mesh(new THREE.BoxGeometry(4.0, 4.5, 0.6), woodBeamMat);
    door.position.set(0, 2.25, arenaRadius - 1.5);
    door.castShadow = true;
    group.add(door);
    obstacles.push({ x: 0, z: arenaRadius - 1.5, radius: 1.8, type: 'wall' });

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
    const runeMat = new THREE.MeshStandardMaterial({ color: '#00f5d4', emissive: '#00f5d4', emissiveIntensity: 0.8 });

    // Perimeter Gothic Masonry Walls
    const numWallSegments = 24;
    for (let i = 0; i < numWallSegments; i++) {
      const angle = (i * Math.PI * 2) / numWallSegments;
      const x = Math.cos(angle) * arenaRadius;
      const z = Math.sin(angle) * arenaRadius;

      const wallBlock = new THREE.Mesh(new THREE.BoxGeometry(6.0, 8.5, 1.8), darkMat);
      wallBlock.position.set(x, 4.25, z);
      wallBlock.rotation.y = -angle + Math.PI / 2;
      wallBlock.castShadow = true;
      group.add(wallBlock);

      obstacles.push({ x, z, radius: 2.2, type: 'wall' });
    }

    // 8 Subterranean Fluted Columns with Cyan Soul Braziers
    for (let c = 0; c < 8; c++) {
      const angle = (c * Math.PI * 2) / 8;
      const cx = Math.cos(angle) * 11;
      const cz = Math.sin(angle) * 11;

      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 6.0, 8), darkMat);
      col.position.set(cx, 3.0, cz);
      col.castShadow = true;
      group.add(col);
      obstacles.push({ x: cx, z: cz, radius: 0.9, type: 'pillar' });

      const soulFire = new THREE.Mesh(new THREE.OctahedronGeometry(0.25), runeMat);
      soulFire.position.set(cx, 4.5, cz);
      group.add(soulFire);

      const colLight = new THREE.PointLight(0x00f5d4, 1.8, 12);
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

    // Perimeter Volcanic Cavern Walls
    const numWallSegments = 24;
    for (let i = 0; i < numWallSegments; i++) {
      const angle = (i * Math.PI * 2) / numWallSegments;
      const x = Math.cos(angle) * arenaRadius;
      const z = Math.sin(angle) * arenaRadius;

      const wallBlock = new THREE.Mesh(new THREE.BoxGeometry(6.0, 9.0, 2.0), basaltMat);
      wallBlock.position.set(x, 4.5, z);
      wallBlock.rotation.y = -angle + Math.PI / 2;
      wallBlock.castShadow = true;
      group.add(wallBlock);

      obstacles.push({ x, z, radius: 2.2, type: 'wall' });
    }

    // Outer Lava Moat Ring (Hazard zone inside the arena)
    const lavaMoatGeo = new THREE.RingGeometry(arenaRadius - 3.5, arenaRadius - 1.2, 32);
    const lavaMoat = new THREE.Mesh(lavaMoatGeo, lavaGlowMat);
    lavaMoat.rotation.x = -Math.PI / 2;
    lavaMoat.position.y = 0.05;
    group.add(lavaMoat);

    // Hazard zone around perimeter
    hazardZones.push({ x: 0, z: 0, r: arenaRadius - 1.2 }); // Checked by distance to center if > arenaRadius - 3.5

    // Volcanic Basalt Spires for cover
    const spires = [
      { x: -8, z: -7 },
      { x: 8, z: -7 },
      { x: -8, z: 7 },
      { x: 8, z: 7 },
    ];
    spires.forEach((sp) => {
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 5.0, 6), basaltMat);
      spire.position.set(sp.x, 2.5, sp.z);
      spire.castShadow = true;
      group.add(spire);
      obstacles.push({ x: sp.x, z: sp.z, radius: 1.1, type: 'pillar' });
    });

    // Fiery Ambient Red-Orange Lights
    for (let l = 0; l < 4; l++) {
      const angle = (l * Math.PI * 2) / 4;
      const lx = Math.cos(angle) * 12;
      const lz = Math.sin(angle) * 12;

      const fireLight = new THREE.PointLight(0xff5400, 3.0, 16);
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

