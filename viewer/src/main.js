import * as THREE from 'three';
import { createWorld } from './world.js';
import { createControls } from './controls.js';
import { updateDoors, setCamera } from './mcp-renderer.js';
import { updateEntranceDoors, setupEntranceDoorInteraction } from './models/panelak/entrance-door.js';
import { updatePlayground, setPlaygroundCamera } from './playground-anim.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // sky blue
scene.fog = new THREE.Fog(0x87ceeb, 80, 300);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 500);
camera.position.set(60, 40, -20); // overview of obytna ctvrt

const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x606070, 4);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 2);
sunLight.position.set(30, 50, 20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 300;
sunLight.shadow.camera.left = -100;
sunLight.shadow.camera.right = 100;
sunLight.shadow.camera.top = 100;
sunLight.shadow.camera.bottom = -100;
scene.add(sunLight);

// Controls
const controls = createControls(camera, renderer.domElement);
setCamera(camera);
setPlaygroundCamera(camera);
setupEntranceDoorInteraction(camera);

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Game loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  controls.update(delta);
  updateDoors(delta);
  updateEntranceDoors(delta);
  updatePlayground(delta);
  renderer.render(scene, camera);
}

// Build world (async), then start rendering
createWorld(scene).then(() => {
  console.log('World loaded from MCP');
}).catch(e => {
  console.error('Failed to load MCP world:', e);
});

animate();
