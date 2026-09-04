const LERP = 0.1;
const GAP_PX = 48;

export class Carousel {
  constructor(rootEl) {
    this.slots = Array.from(rootEl.querySelectorAll('.slot'));
    this.scrollX = 0;
    this.targetScrollX = 0;
    this.cellW = 0;
    this.stepX = 0;
    this.periodX = 0;
    this.velocity = 0; // signed px/frame the carousel moved this tick
    this.rects = [];
    this.heights = [];
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.onWheel = this.onWheel.bind(this);
    this.onDown = (event) => {
      if (event.button !== 0 || event.target.closest('a, button')) return;
      this.dragX = event.clientX;
    };
    this.onMove = (event) => {
      if (this.dragX === undefined) return;
      this.targetScrollX += this.dragX - event.clientX;
      this.dragX = event.clientX;
    };
    this.onUp = () => { this.dragX = undefined; };
    this.onKey = (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || event.target.closest('a, button, input, textarea')) return;
      event.preventDefault();
      this.targetScrollX += (event.key === 'ArrowRight' ? 1 : -1) * this.stepX;
    };
  }

  prepare() {
    this.measure();
    void this.slots[0]?.offsetHeight;
    this.applyTransforms();
  }

  start() {
    this.prepare();
    window.addEventListener('wheel', this.onWheel, {
      capture: true,
      passive: false,
    });
    window.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
    window.addEventListener('keydown', this.onKey);
  }

  stop() {
    window.removeEventListener('wheel', this.onWheel, { capture: true });
    window.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
    window.removeEventListener('keydown', this.onKey);
  }

  measure() {
    this.cellW = this.slots[0]?.offsetWidth ?? 0;
    this.stepX = this.cellW + GAP_PX;
    this.periodX = this.slots.length * this.stepX;
    this.heights = this.slots.map(slot => slot.offsetHeight);
  }

  onWheel(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    const delta =
      Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    this.targetScrollX += delta;
  }

  applyTransforms() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const half = this.periodX / 2;
    const c = Math.floor(this.slots.length / 2);
    for (let i = 0; i < this.slots.length; i++) {
      let relX = (i - c) * this.stepX - this.scrollX;
      relX = ((relX % this.periodX) + this.periodX) % this.periodX;
      if (relX >= half) relX -= this.periodX;
      const cellH = this.heights[i];
      const x = vw / 2 + relX - this.cellW / 2;
      const y = vh / 2 - cellH / 2;
      this.slots[i].style.transform = `translate(${x}px, ${y}px)`;
      this.rects[i] = { x, y, w: this.cellW, h: cellH };
    }
  }

  tick() {
    const prev = this.scrollX;
    if (Math.abs(this.targetScrollX - prev) < 0.01 && this.velocity === 0) return;
    this.scrollX += (this.targetScrollX - this.scrollX) * (this.reducedMotion.matches ? 1 : LERP);
    if (Math.abs(this.targetScrollX - this.scrollX) < 0.01) this.scrollX = this.targetScrollX;
    this.velocity = this.scrollX - prev;
    this.applyTransforms();
  }
}
