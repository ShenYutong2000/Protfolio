const CAPTIONS = [
  "Seealpsee",
  "K2",
  "The North Face",
  "Mount Cook",
  "Mount Everest",
];

export function home() {
  const slots = [0, 1, 2, 3, 4]
    .map(
      (i) =>
        `<div class="slot slot-${i}"><figure aria-hidden="true"></figure><div class="slot-caption">${CAPTIONS[i]}</div></div>`,
    )
    .join("");

  return `
    <section data-page="main" class="page page-main">
      <h1 class="page-title">Selected</h1>
      <div class="carousel">${slots}</div>
    </section>
  `;
}

export function getMainTargets(rootEl) {
  const slots = rootEl.querySelectorAll(".slot");
  const rects = [];
  for (let i = 0; i < slots.length; i++) {
    const r = slots[i].getBoundingClientRect();
    rects.push({ x: r.left, y: r.top, w: r.width, h: r.height });
  }
  return rects;
}
