import * as THREE from 'three';
import { createEnglishGarden } from './models/english-garden/model.js';
import { createPanelak } from './models/panelak/model.js';
import { createSimpleHouse } from './models/simple-house/model.js';

export async function createWorld(scene) {
  createGround(scene);
  // createEnglishGarden(scene, 0, 0);
  // createPanelak(scene, 0, 0);
  createSimpleHouse(scene, 0, 0);
}

function createGround(scene) {
  const geometry = new THREE.PlaneGeometry(300, 300);
  const material = new THREE.MeshLambertMaterial({ color: 0x4a7c2e });
  const ground = new THREE.Mesh(geometry, material);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
}
