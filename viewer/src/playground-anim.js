import * as THREE from 'three';

// ════════════════════════════════════════════════
// PLAYGROUND ANIMATIONS — interactive playground objects
// Click to start/stop, physics-like motion
// ════════════════════════════════════════════════

const animatedObjects = [];
let _camera = null;
let _raycaster = null;

export function setPlaygroundCamera(camera) {
  _camera = camera;
}

// Register an animated playground object
export function registerPlaygroundAnim(mesh, config) {
  mesh.userData._pgAnim = {
    type: config.type,       // 'swing', 'springRider', 'merryGoRound', 'seesaw', 'slideBall'
    active: false,
    time: Math.random() * 10, // offset so objects don't sync
    ...config,
  };
  animatedObjects.push(mesh);
}

// Call from main animate loop
export function updatePlayground(delta) {
  for (const obj of animatedObjects) {
    const a = obj.userData._pgAnim;
    if (!a.active) continue;

    a.time += delta;

    switch (a.type) {
      case 'swing':
        updateSwing(obj, a, delta);
        break;
      case 'springRider':
        updateSpringRider(obj, a, delta);
        break;
      case 'merryGoRound':
        updateMerryGoRound(obj, a, delta);
        break;
      case 'seesaw':
        updateSeesaw(obj, a, delta);
        break;
      case 'slideBall':
        updateSlideBall(obj, a, delta);
        break;
    }
  }
}

// ════════════════════════════════════════════════
// SWING — pendulum motion around top beam attachment point
// Swings the chain+seat group by rotating around X axis at pivot
// ════════════════════════════════════════════════

function updateSwing(obj, a, delta) {
  // Damped oscillation — swings for a while then slows
  const elapsed = a.time - a.startTime;
  const decay = Math.exp(-elapsed * 0.08); // slow decay
  const angle = a.maxAngle * decay * Math.sin(elapsed * a.frequency);

  if (decay < 0.01) {
    a.active = false;
    obj.rotation.x = 0;
    return;
  }

  obj.rotation.x = angle;
}

// ════════════════════════════════════════════════
// SPRING RIDER — rocks forward/backward + slight bounce
// ════════════════════════════════════════════════

function updateSpringRider(obj, a, delta) {
  const elapsed = a.time - a.startTime;
  const decay = Math.exp(-elapsed * 0.15);
  const tilt = a.maxTilt * decay * Math.sin(elapsed * a.frequency);
  const bounce = a.bounceHeight * decay * Math.abs(Math.sin(elapsed * a.frequency * 2));

  if (decay < 0.01) {
    a.active = false;
    obj.rotation.x = 0;
    obj.position.y = a.baseY;
    return;
  }

  obj.rotation.x = tilt;
  obj.position.y = a.baseY + bounce;
}

// ════════════════════════════════════════════════
// MERRY-GO-ROUND — continuous spin that slows down
// ════════════════════════════════════════════════

function updateMerryGoRound(obj, a, delta) {
  const elapsed = a.time - a.startTime;
  const speed = a.maxSpeed * Math.exp(-elapsed * 0.05); // very slow decay

  if (speed < 0.01) {
    a.active = false;
    return;
  }

  obj.rotation.y += speed * delta;
}

// ════════════════════════════════════════════════
// SEESAW — rocking back and forth around center pivot
// ════════════════════════════════════════════════

function updateSeesaw(obj, a, delta) {
  const elapsed = a.time - a.startTime;
  const decay = Math.exp(-elapsed * 0.1);
  const angle = a.maxAngle * decay * Math.sin(elapsed * a.frequency);

  if (decay < 0.01) {
    a.active = false;
    obj.rotation.z = 0;
    return;
  }

  obj.rotation.z = angle;
}

// ════════════════════════════════════════════════
// SLIDE BALL — ball slides down the curve, resets at bottom
// ════════════════════════════════════════════════

function updateSlideBall(obj, a, delta) {
  const elapsed = a.time - a.startTime;
  const t = Math.min(elapsed / a.duration, 1);

  // Ease-in acceleration (gravity-like)
  const eased = t * t;
  const point = a.curve.getPoint(eased);
  obj.position.copy(point);

  if (t >= 1) {
    // Reset after short pause
    a.pauseTimer = (a.pauseTimer || 0) + delta;
    if (a.pauseTimer > 1.5) {
      a.startTime = a.time;
      a.pauseTimer = 0;
    }
  }
}

// ════════════════════════════════════════════════
// INTERACTION — click to activate/deactivate
// ════════════════════════════════════════════════

export function setupPlaygroundInteraction(group) {
  if (!_raycaster) {
    _raycaster = new THREE.Raycaster();
    _raycaster.far = 6;

    window.addEventListener('click', () => {
      if (!document.pointerLockElement || !_camera) return;

      _raycaster.setFromCamera(new THREE.Vector2(0, 0), _camera);
      const hits = _raycaster.intersectObjects(group.children, true);

      for (const hit of hits) {
        let obj = hit.object;
        // Walk up to find animated parent
        while (obj && !obj.userData?._pgAnim) {
          obj = obj.parent;
        }

        if (obj?.userData?._pgAnim) {
          const a = obj.userData._pgAnim;
          if (a.active) {
            // Stop — let it decay naturally by not resetting
            // Or force stop for merry-go-round
            if (a.type === 'merryGoRound') {
              a.active = false;
            }
          } else {
            // Start
            a.active = true;
            a.startTime = a.time;
            if (a.pauseTimer) a.pauseTimer = 0;
          }
          break;
        }
      }
    });
  }
}
