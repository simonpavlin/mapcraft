import * as THREE from 'three';
import { createByt4kk } from './byt4kk.js';

export function createWorld(scene) {
  createGround(scene);
  createByt4kk(scene, 0, 0);
}

function createGround(scene) {
  const geometry = new THREE.PlaneGeometry(200, 200);
  const material = new THREE.MeshLambertMaterial({ color: 0x4a7c2e });
  const ground = new THREE.Mesh(geometry, material);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
}
