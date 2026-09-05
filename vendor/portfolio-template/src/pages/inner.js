export const INNER_X_OFFSETS_VW = [0, -14, 10, -6, 16];

// Keyed by image index, aligned to the home-page captions.
const FACTS = [
  "A watercolor study of a traditional Chinese gate, built around saturated reds, layered ornament, and the quiet view beyond the threshold.",
  "An architectural sketch made from observation, focusing on the relationship between a campus building, its roofline, and the surrounding trees.",
  "A pen-and-ink study of Gothic architecture, using repeated windows, vertical lines, and cross-hatching to understand the building's structure.",
  "Whale Watching pairs a blue digital landscape with a small moving subject, while the adjacent studio photograph records the painting process in place.",
  "A calligraphy study exploring rhythm, spacing, and the physical movement of the brush across paper, from practice sheets to red New Year couplets.",
];

export function inner(image) {
  return function innerView() {
    const slots = [0, 1, 2, 3, 4]
      .map(
        (i) =>
          `<div class="slot" style="transform: translateX(${INNER_X_OFFSETS_VW[i] ?? 0}vw);"><figure></figure></div>`,
      )
      .join('');
    return `
      <section data-page="inner" data-image="${image}" class="page page-inner">
        <h1 class="page-title">Inner</h1>
        <p class="inner-fact">${FACTS[image]}</p>
        <div class="stack">${slots}</div>
      </section>
    `;
  };
}

export function getInnerTargets(rootEl) {
  const slots = rootEl.querySelectorAll('.stack .slot');
  const rects = [];
  for (let i = 0; i < slots.length; i++) {
    const r = slots[i].getBoundingClientRect();
    rects.push({ x: r.left, y: r.top, w: r.width, h: r.height });
  }
  return rects;
}
