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
