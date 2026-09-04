const LERP = 0.2;
const HOVER_SELECTOR = '#nav a, #footer a';

export class Cursor {
  constructor() {
    this.el = document.getElementById('cursor');
    this.x = 0;
    this.y = 0;
    this.tx = 0;
    this.ty = 0;
    this.rafId = null;
    this.hovering = false;
    this.onMove = this.onMove.bind(this);
    this.tick = this.tick.bind(this);
  }

  start() {
    if (!this.el || window.matchMedia('(hover: none)').matches) return;
    window.addEventListener('mousemove', this.onMove);
    this.rafId = requestAnimationFrame(this.tick);
  }

  onMove(e) {
    this.tx = e.clientX;
    this.ty = e.clientY;
    if (!this.rafId) this.rafId = requestAnimationFrame(this.tick);
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const isHot = !!el?.closest?.(HOVER_SELECTOR);
    if (isHot !== this.hovering) {
      this.hovering = isHot;
      this.el.classList.toggle('is-hover', isHot);
    }
  }

  tick() {
    this.x += (this.tx - this.x) * LERP;
    this.y += (this.ty - this.y) * LERP;
    this.el.style.transform = `translate(${this.x}px, ${this.y}px) translate(-50%, -50%)`;
    this.rafId = Math.abs(this.tx - this.x) + Math.abs(this.ty - this.y) > 0.1 ? requestAnimationFrame(this.tick) : null;
  }

  destroy() {
    window.removeEventListener('mousemove', this.onMove);
    cancelAnimationFrame(this.rafId);
  }
}
