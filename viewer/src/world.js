import * as THREE from 'three';
import { createPanelak } from './panelak.js';
import { createPanelak2 } from './panelak2.js';

export function createWorld(scene) {
  createGround(scene);
  createPanelak(scene, 0, 0);
  createPanelak2(scene, 27, -30);
  createTrees(scene);
  createPaths(scene);
}

function createGround(scene) {
  const geometry = new THREE.PlaneGeometry(200, 200);
  const material = new THREE.MeshLambertMaterial({ color: 0x4a7c2e });
  const ground = new THREE.Mesh(geometry, material);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
}

function createBuildings(scene) {
  const buildings = [
    { x: -10, z: -10, w: 6, h: 8, d: 6, color: 0xb8860b },
    { x: 10, z: -15, w: 8, h: 12, d: 5, color: 0x8b7355 },
    { x: -15, z: 10, w: 5, h: 6, d: 7, color: 0xa0522d },
    { x: 15, z: 8, w: 7, h: 10, d: 6, color: 0x8b6914 },
    { x: 0, z: -25, w: 10, h: 15, d: 8, color: 0x7b7b7b },
    { x: -25, z: -5, w: 5, h: 5, d: 5, color: 0xcd853f },
    { x: 25, z: -8, w: 6, h: 7, d: 4, color: 0x9e9e9e },
    { x: -8, z: 25, w: 8, h: 9, d: 6, color: 0xbc8f8f },
  ];

  for (const b of buildings) {
    // Main body
    const geometry = new THREE.BoxGeometry(b.w, b.h, b.d);
    const material = new THREE.MeshLambertMaterial({ color: b.color, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(b.x, b.h / 2, b.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // Roof
    const roofGeometry = new THREE.ConeGeometry(Math.max(b.w, b.d) * 0.75, 3, 4);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(b.x, b.h + 1.5, b.z);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    scene.add(roof);

    // Windows
    addWindows(scene, b);
  }
}

function addWindows(scene, b) {
  const windowMaterial = new THREE.MeshLambertMaterial({ color: 0xadd8e6, emissive: 0x112233, side: THREE.DoubleSide });
  const windowSize = 0.8;
  const windowGeometry = new THREE.PlaneGeometry(windowSize, windowSize);

  const floors = Math.floor(b.h / 3);
  for (let floor = 0; floor < floors; floor++) {
    const y = 2 + floor * 3;

    // Front & back windows
    for (let wx = -1; wx <= 1; wx += 2) {
      const winFront = new THREE.Mesh(windowGeometry, windowMaterial);
      winFront.position.set(b.x + wx * (b.w * 0.25), y, b.z + b.d / 2 + 0.01);
      scene.add(winFront);

      const winBack = new THREE.Mesh(windowGeometry, windowMaterial);
      winBack.position.set(b.x + wx * (b.w * 0.25), y, b.z - b.d / 2 - 0.01);
      winBack.rotation.y = Math.PI;
      scene.add(winBack);
    }
  }
}

function createTrees(scene) {
  const treePositions = [
    { x: 5, z: 5 }, { x: -5, z: 5 }, { x: 3, z: -5 },
    { x: -20, z: -20 }, { x: 20, z: 20 }, { x: -20, z: 20 },
    { x: 20, z: -20 }, { x: 0, z: 15 }, { x: 12, z: 0 },
    { x: -12, z: 0 }, { x: 30, z: 10 }, { x: -30, z: -15 },
    { x: 8, z: 18 }, { x: -18, z: -25 }, { x: 22, z: -25 },
  ];

  for (const pos of treePositions) {
    const height = 3 + Math.random() * 3;

    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, height, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(pos.x, height / 2, pos.z);
    trunk.castShadow = true;
    scene.add(trunk);

    // Canopy (two layers)
    const canopyRadius = 1.5 + Math.random();
    for (let i = 0; i < 2; i++) {
      const canopyGeometry = new THREE.SphereGeometry(canopyRadius - i * 0.3, 8, 8);
      const canopyMaterial = new THREE.MeshLambertMaterial({
        color: new THREE.Color().setHSL(0.28 + Math.random() * 0.05, 0.6, 0.3 + Math.random() * 0.1),
      });
      const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
      canopy.position.set(pos.x, height + canopyRadius * 0.5 + i * 0.8, pos.z);
      canopy.castShadow = true;
      scene.add(canopy);
    }
  }
}

function createPaths(scene) {
  const pathMaterial = new THREE.MeshLambertMaterial({ color: 0x999080 });

  // Main cross paths
  const pathH = new THREE.Mesh(new THREE.PlaneGeometry(100, 3), pathMaterial);
  pathH.rotation.x = -Math.PI / 2;
  pathH.position.y = 0.01;
  scene.add(pathH);

  const pathV = new THREE.Mesh(new THREE.PlaneGeometry(3, 100), pathMaterial);
  pathV.rotation.x = -Math.PI / 2;
  pathV.position.y = 0.01;
  scene.add(pathV);
}
