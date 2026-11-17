// Neon Tide - Input Manager
// Handles Keyboard, Mouse orbit, and Action states

export class InputManager {
  constructor() {
    this.keys = new Map();
    this.prevKeys = new Map();
    this.justPressedKeys = new Set();

    this.mouse = {
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      leftDown: false,
      rightDown: false,
      leftJustPressed: false,
      isLocked: false,
    };

    this.domElement = null;
    this.enabled = true;
  }

  init(domElement = window) {
    this.domElement = domElement;

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mouseup', (e) => this.onMouseUp(e));
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('pointerlockchange', () => {
      this.mouse.isLocked = document.pointerLockElement === this.domElement;
    });
  }

  requestPointerLock() {
    if (this.domElement && this.domElement.requestPointerLock) {
      try {
        this.domElement.requestPointerLock();
      } catch (_) {}
    }
  }

  exitPointerLock() {
    if (document.exitPointerLock) {
      try {
        document.exitPointerLock();
      } catch (_) {}
    }
  }

  onKeyDown(e) {
    const code = e.code;
    if (!this.keys.get(code)) {
      this.justPressedKeys.add(code);
    }
    this.keys.set(code, true);

    // Prevent scrolling for game controls
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
      e.preventDefault();
    }
  }

  onKeyUp(e) {
    this.keys.set(e.code, false);
  }

  onMouseMove(e) {
    if (this.mouse.isLocked) {
      this.mouse.dx += e.movementX || 0;
      this.mouse.dy += e.movementY || 0;
    } else if (this.mouse.rightDown || this.mouse.leftDown) {
      this.mouse.dx += e.movementX || 0;
      this.mouse.dy += e.movementY || 0;
    }
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }

  onMouseDown(e) {
    if (e.button === 0) {
      this.mouse.leftDown = true;
      this.mouse.leftJustPressed = true;
    } else if (e.button === 2) {
      this.mouse.rightDown = true;
    }
  }

  onMouseUp(e) {
    if (e.button === 0) {
      this.mouse.leftDown = false;
    } else if (e.button === 2) {
      this.mouse.rightDown = false;
    }
  }

  // Poll & clear one-frame triggers
  update() {
    this.justPressedKeys.clear();
    this.mouse.leftJustPressed = false;
  }

  consumeMouseDelta() {
    const dx = this.mouse.dx;
    const dy = this.mouse.dy;
    this.mouse.dx = 0;
    this.mouse.dy = 0;
    return { dx, dy };
  }

  isDown(code) {
    return !!this.keys.get(code);
  }

  wasJustPressed(code) {
    return this.justPressedKeys.has(code);
  }

  // High-level gameplay queries
  isForward() {
    return this.isDown('KeyW') || this.isDown('ArrowUp');
  }

  isBackward() {
    return this.isDown('KeyS') || this.isDown('ArrowDown');
  }

  isLeft() {
    return this.isDown('KeyA') || this.isDown('ArrowLeft');
  }

  isRight() {
    return this.isDown('KeyD') || this.isDown('ArrowRight');
  }

  isSprint() {
    return this.isDown('ShiftLeft') || this.isDown('ShiftRight');
  }

  isHandbrake() {
    return this.isDown('Space');
  }

  justEnterVehicle() {
    return this.wasJustPressed('KeyE');
  }

  justPunch() {
    return this.wasJustPressed('KeyF');
  }

  justShoot() {
    return this.mouse.leftJustPressed;
  }

  justPause() {
    return this.wasJustPressed('KeyP') || this.wasJustPressed('Escape');
  }

  justMute() {
    return this.wasJustPressed('KeyM');
  }

  reset() {
    this.keys.clear();
    this.prevKeys.clear();
    this.justPressedKeys.clear();
    this.mouse.dx = 0;
    this.mouse.dy = 0;
    this.mouse.leftDown = false;
    this.mouse.rightDown = false;
    this.mouse.leftJustPressed = false;
  }
}
