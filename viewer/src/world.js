import * as THREE from 'three';
import { createLoft } from './loft.js';

export function createWorld(scene) {
  createGround(scene);
  createLoft(scene, -20, -15);
}

function createGround(scene) {
  const geometry = new THREE.PlaneGeometry(200, 200);
  const material = new THREE.MeshLambertMaterial({ color: 0x4a7c2e });
  const ground = new THREE.Mesh(geometry, material);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
}
