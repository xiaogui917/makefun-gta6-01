// Neon Tide - Keyboard and Mouse Input Handler

export class InputHandler {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    this.mouse = {
      isDown: false,
      justClicked: false,
      deltaX: 0,
      deltaY: 0,
      pointerLocked: false
    };

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onPointerLockChange = this.onPointerLockChange.bind(this);

    this.init();
  }

  init() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
  }
  onKeyDown(e) {
    const code = e.code;
    if (!this.keys[code]) {
      this.justPressed[code] = true;
    }
    this.keys[code] = true;

    // Prevent default scrolling on space / arrow keys
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
      e.preventDefault();
    }
  }

  onKeyUp(e) {
    this.keys[e.code] = false;
  }

  onMouseDown(e) {
    if (e.button === 0) {
      this.mouse.isDown = true;
      this.mouse.justClicked = true;
    }
  }

  onMouseUp(e) {
    if (e.button === 0) {
      this.mouse.isDown = false;
    }
  }

  onMouseMove(e) {
    this.mouse.deltaX += e.movementX || 0;
    this.mouse.deltaY += e.movementY || 0;
  }

  onPointerLockChange() {
    this.mouse.pointerLocked = document.pointerLockElement !== null;
  }

  isDown(code) {
    return !!this.keys[code];
  }

  consumePress(code) {
    if (this.justPressed[code]) {
      this.justPressed[code] = false;
      return true;
    }
    return false;
  }

  consumeClick() {
    if (this.mouse.justClicked) {
      this.mouse.justClicked = false;
      return true;
    }
    return false;
  }

  getAndResetMouseDelta() {
    const dx = this.mouse.deltaX;
    const dy = this.mouse.deltaY;
    this.mouse.deltaX = 0;
    this.mouse.deltaY = 0;
    return { dx, dy };
  }

  reset() {
    this.keys = {};
    this.justPressed = {};
    this.mouse.isDown = false;
    this.mouse.justClicked = false;
    this.mouse.deltaX = 0;
    this.mouse.deltaY = 0;
  }
}
