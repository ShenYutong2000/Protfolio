# Local Portfolio integration

Source: https://github.com/bnpne/page-transitions-with-webgpu-vanilla-js

Imported commit: `70e5c0eafb14cd1fdf02aef0799ba486dead46dc`.
The MIT license, original author links, mountain photographs, layout, shaders,
carousel, cursor, typography and all six transition implementations are retained.
Image author credits are in README.md. The original project is by Ben Paine / Codrops.

`npm install` from the repository root installs this workspace. `npm run dev`
and `npm run build` first compile the demo into `public/portfolio-template`.
The generated bundle is intentionally ignored by Git; the source and original
images are versioned here. This is hosted locally, not an embedded remote site.

The Next.js `/portfolio` page mounts the demo in a viewport-sized same-origin
frame to isolate its CSS, document scroll and renderer lifecycle from the study.
When unmounted, the frame releases its render loops and GPU context.

Integration differences:

- Vite's base and texture URLs point to the local public folder.
- Internal paths use hash history inside the frame to avoid taking over the
  Next.js application's routes. The parent mirrors the active view to the
  `view` query parameter so refresh restores Selected, Index or the inner page.
- Back/forward requests arriving during a transition are applied on completion.
- Escape returns to the study, and initialization errors offer reload/return.
- The gallery now has only Selected and Index. Photos are browseable images,
  not detail links; obsolete numeric view URLs resolve to Selected.
- The two layouts use native images and CSS perspective, retaining the original
  carousel geometry, float projection and morphing positions. The original GPU
  and Inner modules are retained as reference source but are not bundled.
- First paint does not wait for GPU initialization or all images to decode.
  The intro is 180ms without staggering. Gallery images are optimized copies
  in public/gallery (regenerate with node scripts/optimize-portfolio-images.mjs
  from the repository root); author credits and original photos remain intact.
- The build emits entry.json for warming assets from the study. No iframe or
  background renderer is started until the user enters Portfolio.
- Existing `/portfolio/[slug]` content routes remain available unchanged.
