import gsap from "gsap";

// Full-screen intro overlay with a 0–100% counter in the top-left corner. It
// counts up (run in parallel with texture loading) and then fades away, after
// which the caller plays the page intro. Driven from #preloader in index.html
// so it paints on the very first frame, before this module even runs.
const COUNT_DURATION = 1.6;
const FADE_DURATION = 0.6;

export class Preloader {
  constructor() {
    this.el = document.getElementById("preloader");
    this.countEl = this.el?.querySelector(".preloader-count") ?? null;
  }

  // Count from 0 to 100. Resolves once the counter has reached 100%.
  async count() {
    if (!this.countEl) return;
    const counter = { value: 0 };
    await gsap.to(counter, {
      value: 100,
      duration: COUNT_DURATION,
      ease: "power1.inOut",
      onUpdate: () => {
        this.countEl.textContent = `${Math.round(counter.value)}%`;
      },
    });
  }

  // Fade the overlay out and remove it from the stacking/interaction flow.
  async reveal() {
    if (!this.el) return;
    await gsap.to(this.el, {
      autoAlpha: 0,
      duration: FADE_DURATION,
      ease: "power2.inOut",
    });
    this.el.style.display = "none";
  }
}
