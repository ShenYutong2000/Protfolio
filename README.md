# Interactive Study Portfolio

An English-language personal portfolio built around an interactive 3D
study-room concept. The room is rendered procedurally with React Three Fiber,
so it does not depend on a large external model download.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available pages

- `/` — interactive study preview
- `/about`
- `/projects`
- `/education`
- `/research`
- `/experience`
- `/portfolio`

The home page maps six interactive room objects to these content sections:
portrait, computer, books, notebook, calendar, and camera. Text navigation
remains available as an accessible fallback.

Update placeholder content in `src/data/content.ts` and the individual page
files before publishing.

## Content structure

Most editable content lives in `src/data/content.ts`:

- `siteProfile` — name, role, biography, contact details, and social links
- `projects` — project summaries and full case-study sections
- `education` — degrees, institutions, and achievements
- `research` — papers, projects, methods, and findings
- `experience` — roles, outcomes, and tools
- `portfolioItems` — creative work, process notes, and media categories

Projects, research entries, and portfolio items use a unique `slug` to create
shareable detail pages. Replace placeholder `#` links before publishing.

## img2threejs integration

The `/image-to-3d` page is the runtime integration point. It renders a small
procedural factory that follows the `img2threejs` contract: a `THREE.Group` with
named component pivots, sockets, collider metadata, and destruction groups. A
factory generated from an `ObjectSculptSpec` can replace the demo factory in
`src/components/image3d/ImageTo3DLab.tsx` without changing the viewer.

`img2threejs` itself is a local Python 3.10+ code-generation and review pipeline,
not a browser-side image-to-mesh API. Point the bridge at a checkout of the
repository, then run:

```powershell
$env:IMG2THREEJS_ROOT = "C:\path\to\img2threejs"
npm run img2threejs -- probe .\reference.png
npm run img2threejs -- assess "My object" --image .\reference.png --out assessment.json
npm run img2threejs -- spec "My object" --image .\reference.png --assessment assessment.json --out object-sculpt-spec.json
npm run img2threejs -- validate object-sculpt-spec.json --strict-quality
npm run img2threejs -- build object-sculpt-spec.json --out src\components\image3d\generated\createObjectModel.ts
```

The full workflow is staged and evidence-backed: intake, quality contract,
detail inventory, strict spec validation, locked build passes, browser render,
side-by-side comparison, and deterministic geometry/review gates. The output is
diffable TypeScript plus JSON evidence, rather than a downloaded mesh asset.
