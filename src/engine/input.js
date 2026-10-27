/** Keyboard / mouse input with pointer lock and per-frame edge detection. */
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set();
    this.released = new Set();
    this.mouse = { x: 0, y: 0, dx: 0, dy: 0, left: false, right: false, middle: false };
    this.mousePressed = new Set();
    this.mouseReleased = new Set();
    this.locked = false;
    this.enabled = true;
    this.sensitivity = 1.0;
    this.invertY = false;
    this.wheel = 0;
    this._bind();
  }

  _bind() {
    const onKeyDown = (e) => {
      if (!this.enabled) return;
      const c = e.code;
      if (!this.keys.has(c)) this.pressed.add(c);
      this.keys.add(c);
      if (['Tab', 'Space', 'KeyE', 'KeyQ', 'F1'].includes(c)) e.preventDefault();
    };
    const onKeyUp = (e) => {
      this.keys.delete(e.code);
      this.released.add(e.code);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.mouse.left = false;
      this.mouse.right = false;
    });
    document.addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.mouse.dx += e.movementX;
      this.mouse.dy += e.movementY;
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    const down = (e) => {
      if (!this.locked) return;
      const b = e.button;
      if (b === 0) {
        this.mouse.left = true;
        this.mousePressed.add(0);
      }
      if (b === 2) {
        this.mouse.right = true;
        this.mousePressed.add(2);
      }
      if (b === 1) {
        this.mouse.middle = true;
        this.mousePressed.add(1);
      }
      e.preventDefault();
    };
    const up = (e) => {
      const b = e.button;
      if (b === 0) {
        this.mouse.left = false;
        this.mouseReleased.add(0);
      }
      if (b === 2) {
        this.mouse.right = false;
        this.mouseReleased.add(2);
      }
      if (b === 1) this.mouse.middle = false;
    };
    this.canvas.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
    window.addEventListener('contextmenu', (e) => {
      if (this.locked) e.preventDefault();
    });
    window.addEventListener('wheel', (e) => {
      if (!this.locked) return;
      this.wheel += Math.sign(e.deltaY);
      e.preventDefault();
    }, { passive: false });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.canvas;
      if (!this.locked) {
        this.mouse.left = false;
        this.mouse.right = false;
      }
      this.onLockChange?.(this.locked);
    });
  }

  requestLock() {
    if (!this.locked && this.canvas.requestPointerLock) {
      const p = this.canvas.requestPointerLock();
      if (p && p.catch) p.catch(() => {});
    }
  }

  exitLock() {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  down(code) {
    return this.keys.has(code);
  }

  justPressed(code) {
    return this.pressed.has(code);
  }

  justReleased(code) {
    return this.released.has(code);
  }

  mouseDown(btn) {
    return btn === 0 ? this.mouse.left : btn === 2 ? this.mouse.right : this.mouse.middle;
  }

  mouseJustPressed(btn) {
    return this.mousePressed.has(btn);
  }

  mouseJustReleased(btn) {
    return this.mouseReleased.has(btn);
  }

  /** Mouse delta in screen-relative radians. */
  lookDelta() {
    const s = 0.0022 * this.sensitivity;
    return { x: this.mouse.dx * s, y: this.mouse.dy * s * (this.invertY ? -1 : 1) };
  }

  endFrame() {
    this.pressed.clear();
    this.released.clear();
    this.mousePressed.clear();
    this.mouseReleased.clear();
    this.mouse.dx = 0;
    this.mouse.dy = 0;
    this.wheel = 0;
  }
}
