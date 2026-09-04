import gsap from 'gsap';
import { home, getMainTargets } from './pages/home.js';
import { index as indexPage, IndexFloat } from './pages/index-page.js';
import { Carousel } from './carousel.js';

const routes = {
  '/': { page: 'main', view: home },
  '/index': { page: 'index', view: indexPage },
};

// Old photo-detail bookmarks resolve to Selected; they cannot reopen Inner.
export function normalizeGalleryPath(path) {
  return path === '/index' ? '/index' : '/';
}

export class GalleryController {
  constructor({ app, renderer }) {
    this.app = app;
    this.renderer = renderer;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.onClick = this.onClick.bind(this);
    this.onHistory = this.onHistory.bind(this);
  }

  start() {
    const rawPath = location.hash.slice(1) || '/';
    const path = normalizeGalleryPath(rawPath);
    if (rawPath !== path) history.replaceState(history.state, '', `#${path}`);
    this.current = { path, ...routes[path] };
    this.app.innerHTML = this.current.view();
    this.enter(this.current, this.app.firstElementChild);
    this.setNav();
    this.renderer.update();
    this.notifyHost();
    // One short reveal; photos load independently and never block the page.
    if (!this.reducedMotion.matches) {
      this.intro = gsap.fromTo(this.renderer.planes, { opacity: 0 }, {
        opacity: 1, duration: 0.18, ease: 'power1.out',
      });
    }
    document.addEventListener('click', this.onClick);
    window.addEventListener('popstate', this.onHistory);
    window.addEventListener('hashchange', this.onHistory);
    this.renderer.onResizeLayout = () => {
      if (this.mutating) this.resizePending = true;
      else this.measure();
    };
  }

  enter(state, section) {
    if (state.page === 'main') {
      this.carousel ??= new Carousel(section);
      this.carousel.start();
      this.syncCarousel();
    } else {
      if (!this.indexFloat) {
        this.indexFloat = new IndexFloat(this.renderer);
        this.indexFloat.prepare();
      }
      this.indexFloat.start();
    }
  }

  leave() {
    this.carousel?.stop();
    this.indexFloat?.stop();
    this.carousel = null;
    this.indexFloat = null;
    for (const plane of this.renderer.planes) plane.tilt = 0;
  }

  syncCarousel() {
    const targetTilt = this.reducedMotion.matches ? 0 : Math.max(-0.05, Math.min(0.05, this.carousel.velocity * 0.005));
    this.renderer.planes.forEach((plane, i) => {
      Object.assign(plane.bounds, this.carousel.rects[i]);
      plane.bounds.z = 0;
      plane.tilt += (targetTilt - plane.tilt) * 0.09;
      if (Math.abs(plane.tilt) < 0.00001) plane.tilt = 0;
    });
  }

  tick() {
    if (this.mutating) return;
    if (this.carousel) {
      this.carousel.tick();
      this.syncCarousel();
    }
    this.indexFloat?.tick();
  }

  measure() {
    this.carousel?.measure();
    this.carousel?.applyTransforms();
    if (this.carousel) this.syncCarousel();
    this.indexFloat?.measure();
  }

  setNav() {
    for (const link of document.querySelectorAll('#nav a')) {
      const active = link.dataset.navKey === this.current.page;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
  }

  async navigate(rawPath, fromHistory = false) {
    const path = normalizeGalleryPath(rawPath);
    if (this.mutating) {
      if (fromHistory) this.pendingPath = path;
      return;
    }
    if (path === this.current.path) return;
    this.mutating = true;
    this.intro?.kill();
    for (const plane of this.renderer.planes) plane.opacity = 1;
    if (!fromHistory) history.pushState({ path }, '', `#${path}`);
    const oldSection = this.app.firstElementChild;
    this.leave();
    this.current = { path, ...routes[path] };
    this.app.insertAdjacentHTML('beforeend', this.current.view());
    const section = this.app.lastElementChild;
    let targets;
    if (this.current.page === 'main') {
      this.carousel = new Carousel(section);
      this.carousel.prepare();
      targets = getMainTargets(section);
    } else {
      this.indexFloat = new IndexFloat(this.renderer);
      this.indexFloat.prepare();
      targets = this.indexFloat.getTargets();
    }
    oldSection.style.pointerEvents = 'none';
    this.setNav();
    this.notifyHost();
    const duration = this.reducedMotion.matches ? 0 : 0.5;
    this.transition = gsap.timeline();
    this.renderer.planes.forEach((plane, i) => {
      this.transition.to(plane.bounds, { ...targets[i], z: targets[i].z ?? 0, duration, ease: 'power3.inOut' }, 0);
    });
    this.transition.to(oldSection, { opacity: 0, duration: duration * 0.5 }, 0);
    this.transition.from(section, { opacity: 0, duration: duration * 0.5 }, duration * 0.5);
    await this.transition;
    oldSection.remove();
    this.enter(this.current, section);
    this.mutating = false;
    if (this.resizePending) { this.resizePending = false; this.measure(); }
    if (this.pendingPath !== undefined) {
      const nextPath = this.pendingPath;
      this.pendingPath = undefined;
      this.navigate(nextPath, true);
    }
  }

  onClick(event) {
    const link = event.target.closest('a[data-link]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    this.navigate(link.getAttribute('href').slice(1));
  }

  onHistory() {
    const rawPath = location.hash.slice(1) || '/';
    const path = normalizeGalleryPath(rawPath);
    if (path !== rawPath) history.replaceState(history.state, '', `#${path}`);
    this.navigate(path, true);
    // Also normalize the parent query when an obsolete detail bookmark is used.
    this.notifyHost(path);
  }

  notifyHost(path = this.current.path) {
    if (parent !== window) parent.postMessage({ type: 'portfolio:route', path }, location.origin);
  }

  destroy() {
    this.intro?.kill();
    this.transition?.kill();
    this.leave();
    document.removeEventListener('click', this.onClick);
    window.removeEventListener('popstate', this.onHistory);
    window.removeEventListener('hashchange', this.onHistory);
  }
}
