import images from '../../../src/data/portfolio-images.json';

export const MAIN_COUNT = images.length;
export const mainIdx = (image) => image;

// Selected and Index only need five textured rectangles. Native images and
// CSS perspective preserve their framing without a WebGPU startup barrier.
export class GalleryRenderer {
  constructor() {
    this.planes = [];
    this.aspects = images.map(({ width, height }) => width / height);
    this.onResize = () => this.onResizeLayout?.();
  }

  init() {
    this.layer = document.createElement('div');
    this.layer.id = 'gallery-images';
    this.layer.setAttribute('aria-label', 'Portfolio art projects');
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const el = document.createElement('img');
      el.alt = image.title;
      el.width = image.width;
      el.height = image.height;
      el.draggable = false;
      el.decoding = 'sync';
      el.fetchPriority = i === 2 ? 'high' : 'auto';
      el.src = `${import.meta.env.BASE_URL}gallery/${image.file}`;
      this.layer.append(el);
      this.planes.push({
        el, kind: 'main', image: i, opacity: 1, tilt: 0, tiltX: 0,
        bounds: { x: 0, y: 0, w: 0, h: 0, z: 0 },
        lastStyle: '',
      });
    }
    document.body.append(this.layer);
    window.addEventListener('resize', this.onResize);
  }

  update() {
    for (const plane of this.planes) {
      const { x, y, w, h, z = 0 } = plane.bounds;
      const tilt = plane.tilt || plane.tiltX ? ` perspective(1000px) rotateY(${plane.tilt}rad) rotateX(${-plane.tiltX}rad)` : '';
      const style = `width:${w}px;height:${h}px;transform:translate(${x}px,${y}px)${tilt};opacity:${plane.opacity};z-index:${Math.round(1000 - z)};`;
      if (style === plane.lastStyle) continue;
      plane.el.style.cssText = style;
      plane.lastStyle = style;
    }
  }

  destroy() {
    window.removeEventListener('resize', this.onResize);
    this.layer.remove();
  }
}
