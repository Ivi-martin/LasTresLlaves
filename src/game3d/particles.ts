import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
}

interface DamageNumber {
  mesh: THREE.Sprite;
  position: THREE.Vector3;
  life: number;
  maxLife: number;
  velY: number;
}

export class ParticleEngine {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  private damageNumbers: DamageNumber[] = [];
  private pointsMesh: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private maxParticles = 800;

  // Expanding shockwave meshes for bombs
  private shockwaves: { mesh: THREE.Mesh; scale: number; maxScale: number; alpha: number }[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    // Circle point texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const particleTex = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      map: particleTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.pointsMesh = new THREE.Points(this.geometry, material);
    this.pointsMesh.frustumCulled = false;
    this.scene.add(this.pointsMesh);
  }

  public emit(pos: THREE.Vector3, count = 8, colorHex = 0xffb703, speed = 4, size = 0.3) {
    const col = new THREE.Color(colorHex);
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.2) * 2;
      const spd = (0.5 + Math.random()) * speed;
      this.particles.push({
        position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2)),
        velocity: new THREE.Vector3(Math.cos(angle) * spd, elevation * spd * 0.8, Math.sin(angle) * spd),
        color: col.clone(),
        size: size * (0.8 + Math.random() * 0.4),
        life: 0.35 + Math.random() * 0.35,
        maxLife: 0.7,
      });
    }
  }

  public emitShockwave(pos: THREE.Vector3, maxRadius = 6.0, colorHex = 0xff5400) {
    const geo = new THREE.RingGeometry(0.2, 0.4, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(pos);
    mesh.position.y = 0.1;
    this.scene.add(mesh);

    this.shockwaves.push({
      mesh,
      scale: 1,
      maxScale: maxRadius * 2.5,
      alpha: 1.0,
    });

    // Also blast out tons of fire and spark particles
    this.emit(pos, 35, 0xff7b00, 8, 0.5);
    this.emit(pos, 25, 0xffea00, 6, 0.4);
  }

  public emitDamageNumber(pos: THREE.Vector3, text: string, isCrit = false, isHeal = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.font = `bold ${isCrit ? '44px' : '36px'} sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.fillStyle = isHeal ? '#2ec4b6' : isCrit ? '#ff0054' : '#ffffff';
    ctx.fillText(text, 64, 32);

    const tex = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.5, 0.75, 1);
    sprite.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 0.4, 1.2, (Math.random() - 0.5) * 0.4));
    this.scene.add(sprite);

    this.damageNumbers.push({
      mesh: sprite,
      position: sprite.position,
      life: 0.8,
      maxLife: 0.8,
      velY: 1.8,
    });
  }

  public update(dt: number) {
    // 1. Update point particles
    let activeCount = 0;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.position.addScaledVector(p.velocity, dt);
      p.velocity.y -= 9.8 * 0.4 * dt; // mild gravity

      const idx = activeCount;
      this.positions[idx * 3] = p.position.x;
      this.positions[idx * 3 + 1] = p.position.y;
      this.positions[idx * 3 + 2] = p.position.z;

      const progress = p.life / p.maxLife;
      this.colors[idx * 3] = p.color.r * progress;
      this.colors[idx * 3 + 1] = p.color.g * progress;
      this.colors[idx * 3 + 2] = p.color.b * progress;

      this.sizes[idx] = p.size * progress;
      activeCount++;
    }

    // Zero out unused slots
    for (let i = activeCount; i < this.maxParticles; i++) {
      this.sizes[i] = 0;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
    this.geometry.setDrawRange(0, activeCount);

    // 2. Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.scale += (sw.maxScale - sw.scale) * 12 * dt;
      sw.alpha -= 1.8 * dt;
      sw.mesh.scale.set(sw.scale, sw.scale, 1);
      (sw.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, sw.alpha);

      if (sw.alpha <= 0) {
        this.scene.remove(sw.mesh);
        sw.mesh.geometry.dispose();
        (sw.mesh.material as THREE.Material).dispose();
        this.shockwaves.splice(i, 1);
      }
    }

    // 3. Update floating damage numbers
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.life -= dt;
      dn.position.y += dn.velY * dt;
      const progress = Math.max(0, dn.life / dn.maxLife);
      (dn.mesh.material as THREE.SpriteMaterial).opacity = progress;

      if (dn.life <= 0) {
        this.scene.remove(dn.mesh);
        (dn.mesh.material as THREE.SpriteMaterial).map?.dispose();
        (dn.mesh.material as THREE.Material).dispose();
        this.damageNumbers.splice(i, 1);
      }
    }
  }

  public dispose() {
    this.scene.remove(this.pointsMesh);
    this.geometry.dispose();
    (this.pointsMesh.material as THREE.Material).dispose();
    for (const sw of this.shockwaves) {
      this.scene.remove(sw.mesh);
      sw.mesh.geometry.dispose();
      (sw.mesh.material as THREE.Material).dispose();
    }
    for (const dn of this.damageNumbers) {
      this.scene.remove(dn.mesh);
      (dn.mesh.material as THREE.SpriteMaterial).map?.dispose();
      (dn.mesh.material as THREE.Material).dispose();
    }
  }
}
