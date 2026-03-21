import * as THREE from 'three';

export function createControls(camera, domElement) {
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const velocity = new THREE.Vector3();
  const direction = new THREE.Vector3();

  const SPEED = 60;
  const SPRINT_MULTIPLIER = 2.5;
  const MOUSE_SENSITIVITY = 0.002;

  const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    up: false,
    down: false,
  };

  let isLocked = false;

  // Pointer lock
  const instructions = document.getElementById('instructions');

  instructions.addEventListener('click', () => {
    domElement.requestPointerLock();
  });

  document.addEventListener('pointerlockchange', () => {
    isLocked = document.pointerLockElement === domElement;
    instructions.style.display = isLocked ? 'none' : 'block';
    document.getElementById('crosshair').style.display = isLocked ? 'block' : 'none';
  });

  // Mouse look
  document.addEventListener('mousemove', (event) => {
    if (!isLocked) return;

    euler.setFromQuaternion(camera.quaternion);
    euler.y -= event.movementX * MOUSE_SENSITIVITY;
    euler.x -= event.movementY * MOUSE_SENSITIVITY;
    euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
    camera.quaternion.setFromEuler(euler);
  });

  // Keyboard
  const onKeyDown = (event) => {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        keys.forward = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        keys.backward = true;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        keys.left = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        keys.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        keys.sprint = true;
        break;
      case 'Space':
        keys.up = true;
        break;
      case 'KeyQ':
        keys.down = true;
        break;
    }
  };

  const onKeyUp = (event) => {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        keys.forward = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        keys.backward = false;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        keys.left = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        keys.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        keys.sprint = false;
        break;
      case 'Space':
        keys.up = false;
        break;
      case 'KeyQ':
        keys.down = false;
        break;
    }
  };

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  return {
    update(delta) {
      if (!isLocked) return;

      // Deceleration
      velocity.x -= velocity.x * 10.0 * delta;
      velocity.y -= velocity.y * 10.0 * delta;
      velocity.z -= velocity.z * 10.0 * delta;

      // Direction
      direction.z = Number(keys.forward) - Number(keys.backward);
      direction.x = Number(keys.left) - Number(keys.right);
      direction.normalize();

      const currentSpeed = keys.sprint ? SPEED * SPRINT_MULTIPLIER : SPEED;
      if (keys.forward || keys.backward) velocity.z -= direction.z * currentSpeed * delta;
      if (keys.left || keys.right) velocity.x -= direction.x * currentSpeed * delta;
      if (keys.up) velocity.y += currentSpeed * delta;
      if (keys.down) velocity.y -= currentSpeed * delta;

      // Move camera
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      camera.position.addScaledVector(forward, -velocity.z * delta);
      camera.position.addScaledVector(right, velocity.x * delta);
      camera.position.y += velocity.y * delta;
    },
  };
}
