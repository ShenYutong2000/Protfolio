import * as THREE from "three";
import type { MutableRefObject } from "react";
import type { StudyLoadingStore } from "./studyLoadingState";

type RendererDefaults = {
  canvas: EventTarget;
  alpha?: boolean;
  antialias?: boolean;
  powerPreference?: WebGLPowerPreference;
};

export function createStudyRenderer(
  store: StudyLoadingStore,
  renderer: MutableRefObject<THREE.WebGLRenderer | null>,
  rendererSetup: MutableRefObject<Promise<THREE.WebGLRenderer> | null>,
  defaults: RendererDefaults,
) {
  if (renderer.current) return Promise.resolve(renderer.current);
  if (rendererSetup.current) return rendererSetup.current;

  rendererSetup.current = (async () => {
    const canvas = defaults.canvas as HTMLCanvasElement;
    const forceWebGpu = new URLSearchParams(window.location.search).has("webgpu");
    const contextAttributes: WebGLContextAttributes = {
      alpha: false,
      antialias: true,
      depth: true,
      failIfMajorPerformanceCaveat: false,
      powerPreference: "default",
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      stencil: false,
    };

    const context = !forceWebGpu && typeof canvas.getContext === "function"
      ? canvas.getContext("webgl2", contextAttributes) as WebGL2RenderingContext | null
        ?? canvas.getContext("webgl2") as WebGL2RenderingContext | null
      : null;

    if (context) {
      try {
        return new THREE.WebGLRenderer({ canvas, ...contextAttributes, context });
      } catch {
        // Continue to the WebGPU fallback below.
      }
    }

    try {
      const { WebGPURenderer } = await import("three/webgpu");
      const webGpuRenderer = new WebGPURenderer({ alpha: false, antialias: true, canvas });
      await webGpuRenderer.init();
      return webGpuRenderer as unknown as THREE.WebGLRenderer;
    } catch {
      // The accessible non-GPU experience remains available.
    }

    store.fail("3D graphics are unavailable on this device.", true);
    return new Promise<THREE.WebGLRenderer>(() => undefined);
  })();

  rendererSetup.current.then((value) => {
    renderer.current = value;
  });
  return rendererSetup.current;
}
