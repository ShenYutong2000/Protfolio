"use client";

import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUpRight } from "lucide-react";
import { useEffect, useRef, type CSSProperties } from "react";
import type { Project } from "@/data/content";

const palettes = [
  { ink: "#27222c", green: "#71ad82", purple: "#6f54b5", yellow: "#efd16d", coral: "#ef795c" },
  { ink: "#27222c", green: "#4ca084", purple: "#7756a7", yellow: "#f0d16b", coral: "#df6e57" },
  { ink: "#27222c", green: "#5a9f8e", purple: "#6d4eaa", yellow: "#edc95e", coral: "#ed765d" },
] as const;

function KindRibbonField({ palette }: { palette: (typeof palettes)[number] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let ratio = 1;
    let lastY = window.scrollY;
    let scrollVelocity = 0;
    let targetVelocity = 0;
    let progress = 0;
    let raf = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      ratio = Math.min(window.devicePixelRatio || 1, 1.4);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const onScroll = () => {
      const currentY = window.scrollY;
      targetVelocity = reducedMotion.matches
        ? 0
        : Math.max(-42, Math.min(42, currentY - lastY));
      lastY = currentY;
      progress = currentY / Math.max(1, document.documentElement.scrollHeight - height);
    };

    const draw = (index: number, color: string) => {
      const direction = index % 2 ? -1 : 1;
      const wave = Math.sin(progress * Math.PI * (1.2 + index * 0.12) + index * 1.7);
      const lift = scrollVelocity * (0.55 + index * 0.07) * direction;
      const startX = -width * 0.12;
      const endX = width * 1.12;
      const startY = height * (0.15 + index * 0.17) + wave * height * 0.04 + lift;
      const endY = height * (0.85 - index * 0.13) - wave * height * 0.06 - lift * 0.72;

      context.beginPath();
      context.moveTo(startX, startY);
      context.bezierCurveTo(
        width * 0.25,
        startY - height * (0.16 + index * 0.022) - lift,
        width * 0.62,
        endY + height * (0.18 - index * 0.018) + lift,
        endX,
        endY,
      );
      context.strokeStyle = color;
      context.globalAlpha = 0.17 + Math.min(0.16, Math.abs(scrollVelocity) * 0.004);
      context.lineWidth = 2 + (index % 3) * 1.2;
      context.lineCap = "round";
      context.stroke();

      context.beginPath();
      context.moveTo(startX + width * 0.06, startY + 5);
      context.bezierCurveTo(
        width * 0.27,
        startY - height * (0.16 + index * 0.022) - lift + 5,
        width * 0.65,
        endY + height * (0.18 - index * 0.018) + lift + 5,
        endX,
        endY + 5,
      );
      context.strokeStyle = palette.yellow;
      context.globalAlpha = 0.12;
      context.lineWidth = 1;
      context.stroke();
    };

    const render = () => {
      scrollVelocity += (targetVelocity - scrollVelocity) * 0.11;
      targetVelocity *= 0.87;
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "multiply";
      [palette.green, palette.purple, palette.coral, palette.green, palette.purple].forEach((color, index) => draw(index, color));
      context.globalCompositeOperation = "source-over";
      context.globalAlpha = 1;
      raf = requestAnimationFrame(render);
    };

    resize();
    onScroll();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    reducedMotion.addEventListener("change", onScroll);
    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      reducedMotion.removeEventListener("change", onScroll);
    };
  }, [palette]);

  return <canvas className="kind-project-ribbons" ref={canvasRef} aria-hidden="true" />;
}

function KindArtwork({ variant, palette }: { variant: number; palette: (typeof palettes)[number] }) {
  if (variant === 0) {
    return (
      <svg className="kind-artwork" viewBox="0 0 560 460" aria-hidden="true">
        <rect x="28" y="30" width="504" height="390" rx="18" fill="#fffdf5" stroke={palette.ink} strokeWidth="3" />
        <path d="M28 95h504" stroke={palette.ink} strokeWidth="3" />
        <circle cx="55" cy="63" r="7" fill={palette.coral} /><circle cx="78" cy="63" r="7" fill={palette.yellow} /><circle cx="101" cy="63" r="7" fill={palette.green} />
        <rect x="68" y="136" width="178" height="216" rx="12" fill={palette.green} />
        <path d="M93 185h106M93 215h78M93 245h99" stroke={palette.ink} strokeWidth="6" strokeLinecap="round" opacity=".7" />
        <circle cx="345" cy="238" r="86" fill={palette.yellow} stroke={palette.ink} strokeWidth="3" />
        <circle cx="345" cy="238" r="42" fill="#fffdf5" stroke={palette.ink} strokeWidth="3" />
        <path d="M276 322c42 24 112 27 166-13" fill="none" stroke={palette.purple} strokeWidth="8" strokeLinecap="round" />
        <path d="M365 170c44-40 88-23 103 8" fill="none" stroke={palette.coral} strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (variant === 1) {
    return (
      <svg className="kind-artwork" viewBox="0 0 560 460" aria-hidden="true">
        <path d="M38 104c68-67 138-67 203 0s140 67 204 0 81-51 100-26" fill="none" stroke={palette.purple} strokeWidth="3" />
        <path d="M38 335c87-64 165-58 236 0s154 59 248-12" fill="none" stroke={palette.green} strokeWidth="3" />
        <circle cx="161" cy="220" r="92" fill={palette.coral} stroke={palette.ink} strokeWidth="3" />
        <circle cx="161" cy="220" r="44" fill="#fffdf5" stroke={palette.ink} strokeWidth="3" />
        <path d="M161 176v88M117 220h88" stroke={palette.ink} strokeWidth="3" />
        <rect x="318" y="145" width="160" height="36" rx="18" fill="#fffdf5" stroke={palette.ink} strokeWidth="3" />
        <rect x="318" y="200" width="115" height="36" rx="18" fill={palette.yellow} stroke={palette.ink} strokeWidth="3" />
        <rect x="318" y="255" width="184" height="36" rx="18" fill={palette.green} stroke={palette.ink} strokeWidth="3" />
        <path d="M85 384h389" stroke={palette.ink} strokeWidth="3" strokeDasharray="8 10" />
      </svg>
    );
  }

  return (
    <svg className="kind-artwork" viewBox="0 0 560 460" aria-hidden="true">
      <rect x="70" y="65" width="420" height="320" rx="150" fill={palette.yellow} stroke={palette.ink} strokeWidth="3" />
      <circle cx="190" cy="188" r="72" fill={palette.purple} stroke={palette.ink} strokeWidth="3" />
      <circle cx="190" cy="188" r="23" fill="#fffdf5" stroke={palette.ink} strokeWidth="3" />
      <circle cx="383" cy="260" r="92" fill={palette.green} stroke={palette.ink} strokeWidth="3" />
      <path d="M350 260h67M383 227v67" stroke={palette.ink} strokeWidth="3" />
      <rect x="96" y="313" width="146" height="42" rx="21" fill={palette.coral} stroke={palette.ink} strokeWidth="3" />
      <path d="M299 104c36 19 60 50 70 91" fill="none" stroke={palette.coral} strokeWidth="7" strokeLinecap="round" />
      <path d="M280 374c34-10 66-10 96 0" fill="none" stroke={palette.purple} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function KindProjectPage({ project, nextProject }: { project: Project; nextProject: Project }) {
  const index = Math.max(0, Number(project.index) - 1);
  const palette = palettes[index % palettes.length];
  const chapters = [
    { label: "01 / Challenge", title: "Start with the question, not the interface.", body: project.challenge },
    { label: "02 / Approach", title: "Make the path easier to follow.", body: project.approach },
    { label: "03 / Outcome", title: "Leave people with more room to think.", body: project.outcome },
  ];

  return (
    <main className="kind-project-page" style={{ "--kind-green": palette.green, "--kind-purple": palette.purple, "--kind-yellow": palette.yellow, "--kind-coral": palette.coral } as CSSProperties}>
      <KindRibbonField palette={palette} />
      <nav className="kind-project-nav" aria-label="Project navigation">
        <Link href="/" className="kind-project-brand">Interactive study</Link>
        <div><Link href="/projects">All projects</Link><span aria-hidden="true">·</span><span>Project / {project.index}</span></div>
        <Link href={`/projects/${nextProject.slug}`}>Next <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </nav>

      <header className="kind-project-hero">
        <div className="kind-project-hero-meta"><span>{project.meta}</span><span>{project.year} · {project.duration}</span></div>
        <div className="kind-project-hero-grid">
          <div>
            <p className="kind-project-eyebrow">Project / {project.index}</p>
            <h1>{project.title}</h1>
          </div>
          <p className="kind-project-lede">{project.summary}</p>
        </div>
        <a className="kind-project-scroll" href="#kind-overview"><span>Scroll to explore</span><ArrowDown size={18} aria-hidden="true" /></a>
      </header>

      <section className="kind-project-overview" id="kind-overview">
        <p className="kind-project-section-label">A closer look</p>
        <div>
          <h2>Useful things are made of small, considered decisions.</h2>
          <p>{project.summary}</p>
        </div>
        <dl>
          <div><dt>Role</dt><dd>{project.role}</dd></div>
          <div><dt>Focus</dt><dd>{project.meta}</dd></div>
          <div><dt>Topics</dt><dd>{project.tags.join(" · ")}</dd></div>
        </dl>
      </section>

      <div className="kind-project-chapters">
        {chapters.map((chapter, chapterIndex) => (
          <section className={`kind-project-chapter ${chapterIndex % 2 ? "is-reversed" : ""}`} key={chapter.label}>
            <div className="kind-project-art-wrap"><KindArtwork variant={(index + chapterIndex) % 3} palette={palette} /><span className="kind-project-art-note">{String(chapterIndex + 1).padStart(2, "0")} / {project.year}</span></div>
            <div className="kind-project-chapter-copy"><p className="kind-project-section-label">{chapter.label}</p><h2>{chapter.title}</h2><p>{chapter.body}</p></div>
          </section>
        ))}
      </div>

      <footer className="kind-project-footer">
        <Link href="/projects" className="kind-project-back"><ArrowLeft size={16} aria-hidden="true" /> Back to all projects</Link>
        <Link href={`/projects/${nextProject.slug}`} className="kind-project-next"><span>Next project / {nextProject.index}</span><strong>{nextProject.title}</strong><ArrowUpRight size={34} aria-hidden="true" /></Link>
      </footer>
    </main>
  );
}
