// Input Manager for Neon Tide (Keyboard and Mouse)
export class InputManager {
  constructor() {
    this.keys = {};
    this.prevKeys = {};
    this.mouse = {
      isDown: false,
      justClicked: false,
      movementX: 0,
      movementY: 0,
    };
    this.onMuteToggle = null;
    this.onPauseToggle = null;
    this.pointerLocked = false;
    this.initListeners();
  }

  initListeners() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (!this.keys[code]) {
        this.keys[code] = true;
      }
      if (code === 'KeyM' && !e.repeat && this.onMuteToggle) {
        this.onMuteToggle();
      }
      if ((code === 'KeyP' || code === 'Escape') && !e.repeat && this.onPauseToggle) {
        this.onPauseToggle();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.isDown = true;
        this.mouse.justClicked = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouse.isDown = false;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement) {
        this.mouse.movementX += e.movementX;
        this.mouse.movementY += e.movementY;
      }
    });
  }
  isDown(code) {
    return !!this.keys[code];
  }

  isJustPressed(code) {
    return !!this.keys[code] && !this.prevKeys[code];
  }

  getForward() {
    let f = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) f += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) f -= 1;
    return f;
  }

  getTurn() {
    let t = 0;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) t -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) t += 1;
    return t;
  }

  isSprinting() {
    return !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']);
  }

  isHandbrake() {
    return !!this.keys['Space'];
  }

  isActionEnterExit() {
    return this.isJustPressed('KeyE');
  }

  isActionPunch() {
    return this.isJustPressed('KeyF');
  }

  isActionShoot() {
    const shot = this.mouse.justClicked;
    this.mouse.justClicked = false;
    return shot;
  }

  consumeMouseDelta() {
    const dx = this.mouse.movementX;
    const dy = this.mouse.movementY;
    this.mouse.movementX = 0;
    this.mouse.movementY = 0;
    return { dx, dy };
  }

  update() {
    this.prevKeys = { ...this.keys };
  }
}
