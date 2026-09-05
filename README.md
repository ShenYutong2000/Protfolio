# Interactive Study Portfolio

An English-language personal portfolio built around an interactive 3D
study-room concept. The room is rendered with React Three Fiber and a small set of optimized local models and textures.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available pages

- `/` — interactive study preview
- `/projects/:slug` — project case studies
- `/research/:slug` — research case studies
- `/experience`
- `/portfolio`

The home page maps six interactive room objects to these content sections:
portrait, computer, books, notebook, calendar, and camera. Text navigation
remains available as an accessible fallback.

Update the focused files in `src/data/` and the individual page files before publishing.

## Content structure

Editable content is grouped by domain:

- `profile.ts` — name, role, biography, contact details, navigation, and social links
- `projects.ts` — project summaries and full case-study sections
- `experience.ts` — degrees, institutions, roles, outcomes, and tools
- `research.ts` — papers, projects, methods, and findings
- `portfolio.ts` — creative work, process notes, and media categories
- `types.ts` — shared content types

Projects, research entries, and portfolio items use a unique `slug` to create
shareable detail pages. Replace placeholder `#` links before publishing.
