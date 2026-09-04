"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Project } from "@/data/content";

type Palette = {
  background: string;
  ink: string;
  accent: string;
  soft: string;
};

const palettes: Palette[] = [
  { background: "#d8f0ae", ink: "#18332f", accent: "#3154df", soft: "#fffdf7" },
  { background: "#3154df", ink: "#f7f5ed", accent: "#d2ee5f", soft: "#bdd6ff" },
  { background: "#202525", ink: "#fff9ed", accent: "#f29281", soft: "#8bcfc6" },
];

function drawProjectArtwork(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  palette: Palette,
  variant: number,
) {
  const sx = width / 1000;
  const sy = height / 720;
  context.save();
  context.scale(sx, sy);
  context.fillStyle = palette.background;
  context.fillRect(0, 0, 1000, 720);

  context.fillStyle = palette.ink;
  context.font = "700 22px Arial, sans-serif";
  context.letterSpacing = "3px";
  context.fillText(`RESEARCH / ${String(variant + 1).padStart(2, "0")}`, 58, 68);

  if (variant === 0) {
    context.fillStyle = palette.soft;
    context.fillRect(58, 112, 884, 520);
    context.fillStyle = palette.ink;
    context.fillRect(58, 112, 884, 54);
    context.fillStyle = palette.accent;
    context.fillRect(86, 198, 178, 394);
    context.fillStyle = palette.background;
    context.fillRect(116, 234, 118, 16);
    context.fillRect(116, 274, 82, 16);
    context.fillRect(116, 314, 103, 16);
    context.fillStyle = palette.ink;
    context.fillRect(302, 210, 590, 114);
    context.fillStyle = palette.soft;
    context.fillRect(326, 238, 332, 16);
    context.fillRect(326, 274, 470, 12);
    context.fillStyle = palette.accent;
    context.fillRect(302, 352, 278, 240);
    context.fillStyle = palette.background;
    context.beginPath();
    context.arc(441, 472, 74, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = palette.ink;
    context.fillRect(610, 352, 282, 68);
    context.fillRect(610, 448, 216, 18);
    context.fillRect(610, 488, 252, 18);
    context.fillRect(610, 528, 176, 18);
  } else if (variant === 1) {
    context.fillStyle = palette.soft;
    context.fillRect(54, 112, 892, 518);
    context.fillStyle = palette.background;
    context.beginPath();
    context.arc(300, 354, 178, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = palette.accent;
    context.beginPath();
    context.arc(300, 354, 109, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = palette.ink;
    context.beginPath();
    context.arc(300, 354, 45, 0, Math.PI * 2);
    context.fill();
    const bars = [192, 126, 238, 164, 290];
    bars.forEach((bar, index) => {
      context.fillStyle = index === 3 ? palette.accent : palette.ink;
      context.fillRect(550 + index * 65, 550 - bar, 34, bar);
    });
    context.fillStyle = palette.background;
    context.fillRect(550, 184, 280, 20);
    context.fillRect(550, 224, 354, 12);
    context.fillRect(550, 252, 214, 12);
  } else {
    const tiles = [
      [58, 118, 292, 205, palette.accent],
      [374, 118, 214, 205, palette.soft],
      [612, 118, 330, 205, palette.background],
      [58, 347, 214, 278, palette.soft],
      [296, 347, 354, 278, palette.background],
      [674, 347, 268, 278, palette.accent],
    ] as const;
    tiles.forEach(([x, y, w, h, color], index) => {
      context.fillStyle = color;
      context.fillRect(x, y, w, h);
      context.fillStyle = index % 2 === 0 ? palette.ink : palette.accent;
      context.fillRect(x + 28, y + 28, Math.min(w - 56, 122), 13);
      context.strokeStyle = palette.ink;
      context.lineWidth = 4;
      context.strokeRect(x + 28, y + 70, w - 56, h - 100);
    });
  }

  context.restore();
}

function PixelProjectVisual({
  caption,
  variant,
}: {
  caption: string;
  variant: number;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const context = canvas.getContext("2d");
    const source = document.createElement("canvas");
    const small = document.createElement("canvas");
    const sourceContext = source.getContext("2d");
    const smallContext = small.getContext("2d");
    if (!context || !sourceContext || !smallContext) return;

    const palette = palettes[variant % palettes.length];
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let intensity = media.matches ? 0 : 0.82;
    let lastY = window.scrollY;
    let lastTime = performance.now();
    let frame = 0;
    let inRenderRange = false;
    let sourceDirty = true;
    let hasPainted = false;

    const paint = () => {
      const rect = wrap.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio, 1.25, 1400 / Math.max(rect.width, 1));
      const width = Math.max(1, Math.round(rect.width * pixelRatio));
      const height = Math.max(1, Math.round(rect.height * pixelRatio));
      if (sourceDirty || canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        source.width = width;
        source.height = height;
        drawProjectArtwork(sourceContext, width, height, palette, variant % 3);
        sourceDirty = false;
      }

      if (source.width < 1 || source.height < 1) return;

      const blockSize = Math.max(1, Math.round(1 + intensity * 34));
      small.width = Math.max(1, Math.ceil(width / blockSize));
      small.height = Math.max(1, Math.ceil(height / blockSize));
      smallContext.imageSmoothingEnabled = true;
      smallContext.clearRect(0, 0, small.width, small.height);
      smallContext.drawImage(source, 0, 0, small.width, small.height);
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, width, height);
      context.drawImage(small, 0, 0, small.width, small.height, 0, 0, width, height);

      if (intensity > 0.025) {
        const cell = Math.max(18, Math.round((16 + intensity * 58) * pixelRatio));
        const alpha = Math.min(0.92, intensity * 0.9);
        for (let y = 0; y < height; y += cell) {
          for (let x = 0; x < width; x += cell) {
            const noise = Math.abs(Math.sin((x + 17) * 12.9898 + (y + variant * 31) * 78.233));
            if (noise < 0.56 + (1 - intensity) * 0.34) continue;
            context.fillStyle = noise > 0.82
              ? `rgba(255,255,255,${alpha})`
              : `rgba(12,15,15,${alpha})`;
            context.fillRect(x, y, cell + 1, cell + 1);
          }
        }
      }
      hasPainted = true;
    };

    const tick = () => {
      frame = 0;
      if (!inRenderRange) return;
      paint();
      if (!media.matches && intensity > 0.012) {
        intensity *= 0.8;
        frame = window.requestAnimationFrame(tick);
      } else if (intensity !== 0) {
        intensity = 0;
        paint();
      }
    };

    const wake = () => {
      if (!inRenderRange || frame) return;
      frame = window.requestAnimationFrame(tick);
    };

    const onScroll = () => {
      const now = performance.now();
      const distance = Math.abs(window.scrollY - lastY);
      const elapsed = Math.max(12, now - lastTime);
      lastY = window.scrollY;
      lastTime = now;
      if (media.matches || !inRenderRange) return;
      intensity = Math.min(1, Math.max(intensity, distance / elapsed / 1.15));
      wake();
    };

    const onMotionChange = () => {
      intensity = media.matches ? 0 : 0.7;
      wake();
    };

    const resizeObserver = new ResizeObserver(() => {
      sourceDirty = true;
      wake();
    });
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        inRenderRange = entry.isIntersecting;
        if (!inRenderRange) {
          window.cancelAnimationFrame(frame);
          frame = 0;
          return;
        }
        if (!hasPainted) intensity = media.matches ? 0 : 0.82;
        wake();
      },
      { rootMargin: "280px 0px" },
    );
    resizeObserver.observe(wrap);
    intersectionObserver.observe(wrap);
    window.addEventListener("scroll", onScroll, { passive: true });
    media.addEventListener("change", onMotionChange);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      media.removeEventListener("change", onMotionChange);
    };
  }, [variant]);

  return (
    <figure className="pixel-project-figure">
      <div className="pixel-project-canvas" ref={wrapRef}>
        <canvas ref={canvasRef} aria-hidden="true" />
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export function ResearchPixelPage({
  project,
  nextProject,
  entryType,
}: {
  project: Project;
  nextProject: Project;
  entryType: string;
}) {
  const projectNumber = Math.max(0, Number(project.index) - 1);
  const sections = [
    { label: "Question", title: "What the research asks", body: project.challenge },
    { label: "Method", title: "How the question was investigated", body: project.approach },
    { label: "Finding", title: "What the work contributes", body: project.outcome },
  ];

  return (
    <main className="pixel-project-page">
      <nav className="pixel-project-nav" aria-label="Research navigation">
        <Link href="/research">Research / {project.index}</Link>
        <Link href="/" className="pixel-project-home">
          <ArrowLeft size={13} aria-hidden="true" /> Study
        </Link>
        <Link href={`/research/${nextProject.slug}`}>
          Next research <ArrowUpRight size={13} aria-hidden="true" />
        </Link>
      </nav>

      <header className="pixel-project-hero">
        <PixelProjectVisual
          caption={`${project.meta} — ${project.year}`}
          variant={projectNumber}
        />
        <div className="pixel-project-title">
          <p>{project.year} / {entryType}</p>
          <h1>{project.title}</h1>
        </div>
      </header>

      <section className="pixel-project-intro" aria-label="Research overview">
        <p className="pixel-project-kicker">Overview</p>
        <p>{project.summary}</p>
        <dl>
          <div><dt>With</dt><dd>{project.role}</dd></div>
          <div><dt>Status</dt><dd>{project.duration}</dd></div>
          <div><dt>Venue</dt><dd>{project.meta}</dd></div>
        </dl>
      </section>

      <div className="pixel-project-chapters">
        {sections.map((section, index) => (
          <section className="pixel-project-chapter" key={section.label}>
            <PixelProjectVisual
              caption={`${String(index + 1).padStart(2, "0")} — ${section.label}`}
              variant={projectNumber + index + 1}
            />
            <div className="pixel-project-copy">
              <p>{String(index + 1).padStart(2, "0")} / {section.label}</p>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </div>
          </section>
        ))}
      </div>

      <footer className="pixel-project-footer">
        <div>
          <p>Topics &amp; methods</p>
          <ul aria-label="Related skills and topics">
            {project.tags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
        </div>
        {project.links.length > 0 && (
          <div className="pixel-project-links">
            {project.links.map((link) => (
              <a href={link.href} key={link.label}>
                {link.label}<ArrowUpRight size={16} aria-hidden="true" />
              </a>
            ))}
          </div>
        )}
        <Link className="pixel-project-next" href={`/research/${nextProject.slug}`}>
          <span>Next research / {nextProject.index}</span>
          <strong>{nextProject.title}</strong>
          <ArrowUpRight size={36} aria-hidden="true" />
        </Link>
      </footer>
    </main>
  );
}
