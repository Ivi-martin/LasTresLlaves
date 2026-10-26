import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createKeyModel } from '../game3d/models';

export const Title3DBackdrop: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0e130f, 0.035);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 3, 9);
    camera.lookAt(0, 0.8, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Warm key light and cool ambient
    const ambientLight = new THREE.AmbientLight(0x2a3d2c, 1.5);
    scene.add(ambientLight);

    const keyLight = new THREE.PointLight(0xffb703, 3.5, 20);
    keyLight.position.set(0, 3.5, 3);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x7209b7, 2.0, 15);
    fillLight.position.set(-4, 2, -2);
    scene.add(fillLight);

    // Group for the 3 orbiting keys
    const keysCenter = new THREE.Group();
    scene.add(keysCenter);

    const keyModels: THREE.Group[] = [];
    for (let i = 0; i < 3; i++) {
      const keyMesh = createKeyModel(i);
      const angle = (i * Math.PI * 2) / 3;
      const radius = 2.2;
      keyMesh.position.set(Math.cos(angle) * radius, 0.8, Math.sin(angle) * radius);
      keysCenter.add(keyMesh);
      keyModels.push(keyMesh);
    }

    // Pedestal base
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 2.0, 0.4, 8),
      new THREE.MeshStandardMaterial({ color: '#242b26', roughness: 0.8, metalness: 0.2 })
    );
    pedestal.position.y = -0.2;
    scene.add(pedestal);

    // Floating particles (embers/fireflies)
    const particleCount = 40;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 12;
      pPositions[i * 3 + 1] = Math.random() * 5;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xffb703,
      size: 0.15,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    let frameId = 0;
    let clock = 0;

    const tick = () => {
      clock += 0.016;

      // Orbit keys
      keysCenter.rotation.y = clock * 0.4;
      keyModels.forEach((km, idx) => {
        km.rotation.y = clock * 1.5 + idx;
        km.position.y = 0.8 + Math.sin(clock * 2 + idx) * 0.15;
      });

      // Float particles
      const posAttr = pGeo.attributes.position;
      for (let i = 0; i < particleCount; i++) {
        let py = posAttr.getY(i) + 0.008;
        if (py > 5) py = 0;
        posAttr.setY(i, py);
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      pGeo.dispose();
      pMat.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 pointer-events-none opacity-45" />;
};
