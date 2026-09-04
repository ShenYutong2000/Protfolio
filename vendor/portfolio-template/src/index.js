import { GalleryRenderer } from "./gallery-renderer.js";
import { GalleryController } from "./gallery-controller.js";
import { Cursor } from "./cursor.js";

async function start() {
  const renderer = new GalleryRenderer();
  renderer.init();
  const controller = new GalleryController({
    app: document.getElementById("app"),
    renderer,
  });
  controller.start();

  let frame;
  function raf() {
    controller.tick();
    renderer.update();
    frame = requestAnimationFrame(raf);
  }
  frame = requestAnimationFrame(raf);

  const cursor = new Cursor();
  cursor.start();
  const onVisibility = () => {
    cancelAnimationFrame(frame);
    if (!document.hidden) frame = requestAnimationFrame(raf);
  };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    cancelAnimationFrame(frame);
    document.removeEventListener('visibilitychange', onVisibility);
    controller.destroy();
    renderer.destroy();
    cursor.destroy();
  });
}

// Host integration does not alter the demo's rendered UI.
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && window.parent !== window) {
    window.parent.postMessage({ type: "portfolio:return" }, window.location.origin);
  }
});

start().catch((error) => {
  console.error("Portfolio renderer could not start", error);
  if (window.parent !== window) window.parent.postMessage({ type: "portfolio:error" }, window.location.origin);
});
