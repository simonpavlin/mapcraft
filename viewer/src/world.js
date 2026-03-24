import * as THREE from 'three';
import { createLoft } from './loft.js';
import { createKostel } from './kostel.js';
import { createLodArtemis } from './lod-artemis.js';
import { createChalupaObyvak } from './chalupa-obyvak.js';
import { createMestecko } from './mestecko.js';
import { createDomekGaraz } from './domek-garaz.js';
import { createPonorka } from './ponorka.js';
import { createSklep } from './sklep.js';
import { createOpevneni } from './opevneni.js';
import { createSchodiste } from './schodiste.js';
import { createPalacSchodiste } from './palac-schodiste.js';
import { createTociteSchodiste } from './tocite-schodiste.js';
// import { createHogwarts } from './hogwarts.js';

export function createWorld(scene) {
  createGround(scene);
  // createLoft(scene, -20, -15);
  // createKostel(scene, -40, -40);
  // createLodArtemis(scene, 20, -10);
  // createChalupaObyvak(scene, -5, 10);
  // createDomekGaraz(scene, 10, 20);
  // createPonorka(scene, -50, 30);
  // createSklep(scene, -15, 30);
  // createMestecko(scene, -100, 50);
  // createOpevneni(scene, 40, 30);
  // createSchodiste(scene, 60, 0);
  // createPalacSchodiste(scene, 80, 0);
  // createTociteSchodiste(scene, 100, 0);
  // createHogwarts(scene, 0, -100);
}

function createGround(scene) {
  const geometry = new THREE.PlaneGeometry(200, 200);
  const material = new THREE.MeshLambertMaterial({ color: 0x4a7c2e });
  const ground = new THREE.Mesh(geometry, material);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
}
