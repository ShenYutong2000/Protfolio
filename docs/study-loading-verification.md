# Study loading: implementation and verification

Verified locally on 2026-09-01/02 using production Next.js builds and the in-app Chromium browser. The current loading path also uses tiered asset loading, an optimized floor texture, and WebGL2-first renderer selection; these changes preserve the room layout and continuous rendering quality.

## Scope preserved

- `studyModels.ts` and all public assets are unchanged. Existing model placement, scale, material overrides, wall/floor texture repeats and lighting/shadows are retained.
- Removed the superseded procedural furniture, decorations, dedicated canvas textures, and chair/handbag loading placeholders from `StudyScene.tsx`. Historical GLB files remain on disk; previous source is recoverable from Git.
- Kept the room structure, laptop screen, transparent hit areas, hover prompts, phone guestbook, download action, focus cameras and routes. The drawer hit area now lives outside the deleted desk visual group. The ID camera uses an equivalent empty reference node.

## Preparation contract

- One store per homepage visit; the enabled configuration produces 24 model entries and two texture entries, with nine critical entries and the remainder loaded in the background.
- Models register after parsing, normalization and mounting, including cache hits. Texture registration is followed by a separate room-shell commit confirmation.
- Resource completion occupies 0–90%; committed rug lift and initial camera preparation precede shader compilation; compilation reaches 95%; a subsequent rendered frame reaches 100%. Only the exit fade uses a 250 ms timer. Reduced-motion mode omits that fade.
- The same Canvas remains mounted throughout normal preparation, retry and reveal. Events are disabled and the scene/header are inert while preparation is incomplete.
- The custom renderer factory memoizes one renderer per Canvas, including overlapping Fiber configuration calls. The shadow mode is explicitly PCF, the same effective mode Three already substituted for its deprecated PCFSoft default, avoiding repeated shader-variant changes during loading.
- A dedicated GLB loading manager aborts stalled model requests on retry. Only failed/pending resources have their cache keys cleared and attempt URLs changed; successful entries are retained. Stale attempt callbacks cannot complete a new run.
- Required failures prevent entry. Optional failures require an explicit retry/skip choice. Skipping the closed book also hides its dessert cup. A 30-second notice does not manufacture progress or automatically skip resources.
- WebGL initialization/context failures show ordinary page navigation. Fatal scene errors show retry and navigation.

## Production comparison

The comparable cold-transfer samples used the same 1280×720 desktop viewport, local production server and no-store proxy. These are individual local observations, not statistical averages or an Internet/mobile performance guarantee.

- Scene assembly preparation: **1776 ms before → 980 ms after** (about 45% lower).
- Recorded main-thread long-task duration: **1188 ms → 339 ms** (about 71% lower). This is the sum of observed long tasks, not total CPU time.
- Scene meshes / unique geometries / unique materials: **289 / 289 / 289 → 44 / 44 / 44**.
- Meshes beneath invisible ancestors: **246 → 0**. These previously consumed creation/setup resources even though they were not visible draw calls.
- GPU textures in the sample: **76 → 64**.
- Study asset requests remain 26 after the first frame, while the floor texture is now **106 KB instead of 3.28 MB**. The critical first-entry set is approximately **1.21 MB instead of 4.71 MB**; background resources continue loading after the room is ready.
- A subsequent final renderer-guard sample measured 853 ms assembly preparation and 293 ms long tasks; timing varies across runs.

`StudyDiagnostics.tsx` is opt-in via `?study-diagnostics=1`. It writes a hidden `#study-diagnostics` JSON output after all enabled model roots exist and three frames have advanced. `preparedMs` is measured from navigation to that assembly checkpoint, **not** the end of the loading screen's fade. The screen's stricter shader/first-frame checkpoint is separately marked as `study:first-ready-frame`.

## Browser checks completed

- Production cold load: progress screen first, automatic entry, no visible replacement placeholders or carpet/furniture height jump. Before/after overview screenshots inspected.
- Client-side return from Projects, Research, Portfolio, Teaching and Experience: cached resources re-register and the new Canvas becomes ready without a stuck loading screen.
- Laptop: inspect, screen-button navigation to Projects, return home.
- Student ID: inspect, retained front-facing camera alignment, Escape returns to overview.
- Phone: inspect, message editor and inbox/menu available, Escape returns. No message was submitted.
- Open book, top shelf, handbag and drawer: inspect and second-click navigation to Portfolio, Teaching, Experience and Research respectively.
- Printer: click produced a browser download event for the existing resume action.
- Mobile-sized 390×844 viewport: loading controls and completed room checked.
- Reduced-motion preference: demand-rendered scene reaches ready successfully.
- Optional closed-book 503: retry recovers; choosing continue removes both book and cup while showing the rest of the room.
- Required desk and floor-texture 503: entry blocked, no continue action; retry recovers.
- Stalled asset responses beyond 30 seconds: wait/retry notice appears without false completion; after removing the delay, retry aborts stalled GLBs and completes.
- WebGL unavailable: navigation fallback displayed and Projects remains accessible.
- Final QA caught intermittent black/garbled geometry. The renderer factory now guards against overlapping initialization, and the effective shadow mode is pinned. After these changes, three consecutive no-store starts had intact geometry (44 GPU geometries each); assembly checkpoints were 853, 857 and 857 ms. The earlier artifact did not recur in those checks.

The slow-network check injected request latency; it did **not** reproduce a specific Fast 3G bandwidth/CPU profile. Physical phones, alternate browser engines, production hosting/CDN behavior and steady-state frame-rate profiling remain outside this verification.

## Reproduction tools

Run `npm run build`, then `npm run start -- --port 3100`. For deterministic local asset failure/latency checks, run `node scripts/serve-study-qa.mjs` and visit `http://127.0.0.1:3120/`. The proxy binds only to loopback and is not part of the deployed app.

The proxy optionally reads `.study-qa.json`; an absent file means a normal no-store pass-through. Supported settings are `fail` (asset path array), `recoverOnRetry`, `delayMs`, `noWebGL`, and `reducedMotion`. Remove the temporary configuration after testing. For example, `fail: ["/models/study/old-book.glb"]` with `recoverOnRetry: true` fails the first request but allows its explicit retry URL.

Checks: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run check:study-model`, and `npm run check:study-loading`. The seven loading-state tests cover completion gates, cache registration, required failures, dependent skipping, retry/stale callbacks, fatal preparation errors and idempotent renderer failure handling.
