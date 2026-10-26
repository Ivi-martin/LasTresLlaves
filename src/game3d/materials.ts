import * as THREE from 'three';

// Procedural texture cache so we only create canvases once
const textureCache: Record<string, THREE.CanvasTexture> = {};

export function getProceduralNoiseTexture(color1 = '#3a5a40', color2 = '#588157', size = 256): THREE.CanvasTexture {
  const key = `noise_${color1}_${color2}_${size}`;
  if (textureCache[key]) return textureCache[key];

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = color1;
  ctx.fillRect(0, 0, size, size);

  // Stylized painterly dabs
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 2 + Math.random() * 8;
    ctx.fillStyle = color2;
    ctx.globalAlpha = 0.15 + Math.random() * 0.25;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache[key] = tex;
  return tex;
}

export function getCobblestoneTexture(bg = '#2b2d42', mortar = '#1a1b26', size = 256): THREE.CanvasTexture {
  const key = `cobble_${bg}_${mortar}_${size}`;
  if (textureCache[key]) return textureCache[key];

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = mortar;
  ctx.fillRect(0, 0, size, size);

  // Stylized stones
  const rows = 8;
  const cols = 8;
  const w = size / cols;
  const h = size / rows;

  for (let r = 0; r < rows; r++) {
    const offsetX = (r % 2) * (w / 2);
    for (let c = -1; c <= cols; c++) {
      const x = c * w + offsetX + 2;
      const y = r * h + 2;
      const stoneW = w - 4;
      const stoneH = h - 4;

      // Color variation per stone
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, stoneW, stoneH, 4) : ctx.rect(x, y, stoneW, stoneH);
      ctx.fill();

      // Soft stone highlight
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.08;
      ctx.fillRect(x + 2, y + 2, stoneW - 4, 3);
      ctx.globalAlpha = 1.0;
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache[key] = tex;
  return tex;
}

export function getLavaTexture(size = 256): THREE.CanvasTexture {
  const key = `lava_${size}`;
  if (textureCache[key]) return textureCache[key];

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#780000';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 60; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 10 + Math.random() * 30;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, '#ffbe0b');
    grad.addColorStop(0.5, '#fb5607');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache[key] = tex;
  return tex;
}

export function getRadialShadowTexture(): THREE.CanvasTexture {
  const key = 'radial_shadow';
  if (textureCache[key]) return textureCache[key];

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,0.75)');
  grad.addColorStop(0.5, 'rgba(0,0,0,0.3)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  textureCache[key] = tex;
  return tex;
}

export function getDigitalCamoTexture(size = 256): THREE.CanvasTexture {
  const key = `camo_${size}`;
  if (textureCache[key]) return textureCache[key];

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Spanish Army M09 Digital Woodland Camo palette matching 6ak9y.jpg
  const palette = [
    '#576646', // primary olive green
    '#687650', // mid army green
    '#7e7856', // khaki tan
    '#8d8764', // light khaki tan
    '#3b472e', // dark moss / forest
    '#2c251c', // deep earth brown / charcoal
    '#493f2f', // warm field brown
    '#8a956e', // sage highlight
  ];

  const gridSize = 20;
  const tileSize = size / gridSize;

  // Base fill
  ctx.fillStyle = palette[0];
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      // Pick random color from authentic camo palette
      const color = palette[Math.floor(Math.random() * palette.length)];
      ctx.fillStyle = color;
      ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);

      // Micro pixel cluster details (digital square blocks)
      if (Math.random() > 0.45) {
        ctx.fillStyle = palette[Math.floor(Math.random() * palette.length)];
        const subX = Math.random() > 0.5 ? 0 : tileSize * 0.5;
        const subY = Math.random() > 0.5 ? 0 : tileSize * 0.5;
        ctx.fillRect(x * tileSize + subX, y * tileSize + subY, tileSize * 0.5, tileSize * 0.5);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestMipmapNearestFilter;
  tex.generateMipmaps = true;
  textureCache[key] = tex;
  return tex;
}
