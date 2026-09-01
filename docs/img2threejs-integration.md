# img2threejs integration

This project integrates the `img2threejs` workflow in two layers:

1. `/image-to-3d` is the browser runtime surface. It previews a reference image
   and mounts a procedural `THREE.Group` factory using the same runtime shape as
   an img2threejs-generated factory.
2. `npm run img2threejs -- ...` is a thin command bridge to the checked-out
   `img2threejs/forge` scripts. It keeps the generation pipeline outside the
   Next.js bundle, where it can create specs, evidence, and TypeScript factories.

## Test the integration

Start the app and open `http://localhost:3000/image-to-3d`:

```powershell
npm run dev
```

The page should show a rotating camera-like demo object. Drag to orbit it. The
object has named runtime nodes (`body`, `lens`, `shutter`) and sockets that can
be inspected from `root.userData.sculptRuntime` in the browser console. Choose a
PNG, JPEG, or WebP to verify reference-image preview and object URL handling.

Run project checks:

```powershell
npm run typecheck
npm run lint
npm run build
```

## Generate a real object from an image

The repository is not a runtime neural model and does not turn an uploaded image
into a mesh in the browser. It generates procedural code from a reference image.
Use a clean, readable image of one object and point the bridge at a local
checkout:

```powershell
$env:IMG2THREEJS_ROOT = "C:\path\to\img2threejs"
# If Python is not on PATH, also set IMG2THREEJS_PYTHON to a Python 3.10+ executable.
npm run img2threejs -- probe .\reference.png
npm run img2threejs -- assess "Desk camera" --image .\reference.png --out assessment.json
npm run img2threejs -- spec "Desk camera" --image .\reference.png --assessment assessment.json --out object-sculpt-spec.json
npm run img2threejs -- validate object-sculpt-spec.json --strict-quality
npm run img2threejs -- init --state .img2threejs/state.json --reference .\reference.png --profile generic --spec object-sculpt-spec.json
npm run img2threejs -- next --state .img2threejs/state.json object-sculpt-spec.json
npm run img2threejs -- build object-sculpt-spec.json --out src\components\image3d\generated\createObjectModel.ts
```

Then import the generated factory into `ImageTo3DLab.tsx` in place of
`createDemoObjectModel`. Keep the generated source and JSON spec in version
control. For higher-fidelity work, continue through the repository's state,
render, comparison, turntable, attachment, material, and self-correction gates.

## What it provides

- A structured `ObjectSculptSpec` describing components, materials, repetition,
  sockets, colliders, and review history.
- A readable TypeScript factory returning a `THREE.Group`, rather than a binary
  model download.
- Staged reconstruction from blockout to interaction and optimization, with
  strict-quality checks before code generation.
- Optional character rig metadata and skeleton binding for character builds.
- Reference-derived material/PBR evidence, camera matching, projection-first
  surface workflows, and comparison sheets.
- Action-ready runtime metadata so parts can be animated, clicked, detached, or
  connected to physics later.

## Important limits

A single image cannot prove hidden geometry, exact scale, or unseen material
regions. The result is procedural and should be described as approximate or
stylized unless additional views and review evidence support stronger claims.
The generated factory is also not the same thing as a production GLB asset: the
project intentionally favors code, inspectability, and runtime hierarchy.
