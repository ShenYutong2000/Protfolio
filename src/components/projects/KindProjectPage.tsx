"use client";

import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUpRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type CSSProperties } from "react";
import type { Project } from "@/data/content";

const palettes = [
  { ink: "#27222c", green: "#71ad82", purple: "#6f54b5", yellow: "#efd16d", coral: "#ef795c" },
  { ink: "#27222c", green: "#4ca084", purple: "#7756a7", yellow: "#f0d16b", coral: "#df6e57" },
  { ink: "#27222c", green: "#5a9f8e", purple: "#6d4eaa", yellow: "#edc95e", coral: "#ed765d" },
] as const;

type SceneKind = "research" | "atlas" | "archive";
type SceneMode = "hero" | "manifesto" | "challenge" | "approach" | "outcome";
type Palette = (typeof palettes)[number];

function ribbonPath(kind: SceneKind, mode: SceneMode, x: number, y: number, vx: number, vy: number, phase: number) {
  const wave = Math.sin(phase) * 10;
  const momentumX = Math.max(-1, Math.min(1, vx * 3.2));
  const momentumY = Math.max(-1, Math.min(1, vy * 3.2));

  if (mode === "manifesto") {
    return `M 56 ${248 + y * 86} C ${196 + x * 132 + momentumX * 38} ${86 - y * 78 + wave}, ${414 - x * 150 - momentumX * 44} ${414 + y * 78 - wave}, 602 ${248 - y * 72}`;
  }
  if (mode === "challenge") {
    return `M 42 ${116 + y * 60} C ${118 + x * 120} ${410 - y * 122 + momentumY * 42}, ${408 - x * 170} ${58 + y * 126 - momentumY * 34}, 598 ${384 - y * 80}`;
  }
  if (mode === "approach") {
    return `M 28 ${374 - y * 72} C ${150 + x * 152 + momentumX * 42} ${78 + y * 120}, ${298 - x * 112 - momentumX * 34} ${436 - y * 138}, 612 ${126 + y * 86}`;
  }
  if (mode === "outcome") {
    return `M 24 ${254 + y * 90} C ${166 - x * 132} ${116 + momentumY * 34}, ${378 + x * 156} ${392 - momentumY * 34}, 616 ${224 - y * 78}`;
  }
  if (kind === "atlas") {
    return `M 46 ${386 - y * 74} C ${174 + x * 142 + momentumX * 42} ${310 + wave}, ${338 - x * 142 - momentumX * 36} ${132 - wave}, 602 ${108 + y * 84}`;
  }
  if (kind === "archive") {
    return `M 48 ${112 + y * 72} C ${196 - x * 136} ${60 + momentumY * 38 + wave}, ${404 + x * 156} ${392 - momentumY * 38 - wave}, 600 ${378 - y * 82}`;
  }
  return `M 28 ${132 + y * 74} C ${180 + x * 136 + momentumX * 44} ${34 - wave}, ${380 - x * 150 - momentumX * 36} ${438 + wave}, 612 ${262 - y * 82}`;
}

function sceneLabel(kind: SceneKind) {
  if (kind === "research") return "Research assistant interactive illustration";
  if (kind === "atlas") return "Community data atlas interactive illustration";
  return "Creative archive interactive illustration";
}

function KindInteractiveScene({
  kind,
  mode,
  palette,
  motionEnabled,
  className = "",
}: {
  kind: SceneKind;
  mode: SceneMode;
  palette: Palette;
  motionEnabled: boolean;
  className?: string;
}) {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const ribbonRef = useRef<SVGPathElement | null>(null);
  const target = useRef({ x: 0, y: 0, active: false });
  const current = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const visible = useRef(true);

  useEffect(() => {
    const node = sceneRef.current;
    if (!node || !motionEnabled) return;

    let raf = 0;
    let phase = 0;
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
    }, { threshold: 0.08 });
    observer.observe(node);

    const render = () => {
      if (visible.current) {
        const spring = target.current.active ? .19 : .13;
        current.current.vx += (target.current.x - current.current.x) * spring;
        current.current.vy += (target.current.y - current.current.y) * spring;
        current.current.vx *= .76;
        current.current.vy *= .76;
        current.current.x += current.current.vx;
        current.current.y += current.current.vy;
        phase += target.current.active ? .028 + Math.min(.025, Math.hypot(current.current.vx, current.current.vy) * .04) : .012;
        const { x, y, vx, vy } = current.current;
        node.style.setProperty("--scene-x", x.toFixed(4));
        node.style.setProperty("--scene-y", y.toFixed(4));
        node.style.setProperty("--scene-tilt", `${(x * 8).toFixed(2)}deg`);
        ribbonRef.current?.setAttribute("d", ribbonPath(kind, mode, x, y, vx, vy, phase));
      }
      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [kind, mode, motionEnabled]);

  const updatePointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!motionEnabled || event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    target.current = {
      x: Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1)),
      y: Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1)),
      active: true,
    };
  };

  const leavePointer = () => {
    target.current = { x: 0, y: 0, active: false };
  };

  return (
    <div
      ref={sceneRef}
      className={`kind-interactive-scene kind-scene-${kind} kind-scene-${mode} ${className}`}
      aria-label={sceneLabel(kind)}
      role="img"
      onPointerMove={updatePointer}
      onPointerEnter={updatePointer}
      onPointerLeave={leavePointer}
    >
      <svg className="kind-scene-svg" viewBox="0 0 640 500" aria-hidden="true">
        <defs>
          <clipPath id={`scene-clip-${kind}`}><rect x="15" y="15" width="610" height="470" rx="36" /></clipPath>
        </defs>
        <rect className="kind-scene-paper" x="15" y="15" width="610" height="470" rx="36" fill="#fffbed" />
        <g clipPath={`url(#scene-clip-${kind})`} className="kind-scene-ribbons" aria-hidden="true">
          <path
            ref={ribbonRef}
            d={ribbonPath(kind, mode, 0, 0, 0, 0, 0)}
            stroke={palette.green}
            className="kind-scene-ribbon"
          />
        </g>
        {kind === "research" && (
          <g className="kind-scene-objects kind-research-objects">
            <rect x="132" y="126" width="376" height="246" rx="20" fill="#fffbed" stroke={palette.ink} strokeWidth="4" />
            <rect x="156" y="156" width="328" height="160" rx="12" fill={palette.green} opacity=".82" />
            <path d="M190 198h116M190 226h192M190 254h145" stroke={palette.ink} strokeWidth="8" strokeLinecap="round" opacity=".6" />
            <circle cx="444" cy="198" r="26" fill={palette.purple} />
            <path d="M432 198h24M444 186v24" stroke="#fffbed" strokeWidth="5" strokeLinecap="round" />
            <rect x="205" y="346" width="230" height="16" rx="8" fill={palette.ink} opacity=".72" />
            <circle className="kind-scene-orb orb-one" cx="98" cy="148" r="22" fill={palette.coral} stroke={palette.ink} strokeWidth="4" />
            <circle className="kind-scene-orb orb-two" cx="548" cy="342" r="30" fill={palette.yellow} stroke={palette.ink} strokeWidth="4" />
          </g>
        )}
        {kind === "atlas" && (
          <g className="kind-scene-objects kind-atlas-objects">
            <path d="M110 144 180 110 256 136 329 96 419 142 514 112 548 202 500 270 524 350 426 386 350 356 270 396 188 354 112 370 86 268Z" fill={palette.green} opacity=".68" stroke={palette.ink} strokeWidth="4" />
            <path d="M128 238 205 210 278 242 359 182 450 226 510 198M158 310 224 272 306 300 394 260 475 300" fill="none" stroke="#fffbed" strokeWidth="8" strokeLinecap="round" opacity=".75" />
            {[[176,188],[285,244],[386,190],[464,277],[232,326]].map(([cx, cy], index) => (
              <circle key={`${cx}-${cy}`} className={`kind-scene-node node-${index}`} cx={cx} cy={cy} r={index % 2 ? 14 : 18} fill={index % 2 ? palette.yellow : palette.coral} stroke={palette.ink} strokeWidth="4" />
            ))}
          </g>
        )}
        {kind === "archive" && (
          <g className="kind-scene-objects kind-archive-objects">
            <rect className="archive-card archive-card-back" x="146" y="104" width="292" height="230" rx="18" fill={palette.green} stroke={palette.ink} strokeWidth="4" />
            <rect className="archive-card archive-card-mid" x="186" y="138" width="292" height="230" rx="18" fill={palette.yellow} stroke={palette.ink} strokeWidth="4" />
            <rect className="archive-card archive-card-front" x="226" y="172" width="292" height="230" rx="18" fill="#fffbed" stroke={palette.ink} strokeWidth="4" />
            <circle cx="310" cy="248" r="42" fill={palette.coral} stroke={palette.ink} strokeWidth="4" />
            <path d="m295 248 12 12 22-28" fill="none" stroke="#fffbed" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M276 330h152M276 352h98" stroke={palette.purple} strokeWidth="8" strokeLinecap="round" opacity=".75" />
          </g>
        )}
      </svg>
    </div>
  );
}

function MotionToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button className="kind-motion-toggle" type="button" aria-pressed={!enabled} onClick={onToggle}>
      {enabled ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
      <span>{enabled ? "Pause motion" : "Play motion"}</span>
    </button>
  );
}

export function KindProjectPage({ project, nextProject }: { project: Project; nextProject: Project }) {
  const index = Math.max(0, Number(project.index) - 1);
  const palette = palettes[index % palettes.length];
  const scene: SceneKind = index === 0 ? "research" : index === 1 ? "atlas" : "archive";
  const [motionEnabled, setMotionEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem("kind-motion-enabled");
    if (stored !== null) return stored !== "false";
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const chapters = [
    { label: "01 / Challenge", title: "Start with the question, not the interface.", body: project.challenge, mode: "challenge" as const },
    { label: "02 / Approach", title: "Make the path easier to follow.", body: project.approach, mode: "approach" as const },
    { label: "03 / Outcome", title: "Leave people with more room to think.", body: project.outcome, mode: "outcome" as const },
  ];

  useEffect(() => {
    const reveals = document.querySelectorAll<HTMLElement>(".kind-reveal");
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) (entry.target as HTMLElement).dataset.visible = "true";
    }), { threshold: .14 });
    reveals.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const toggleMotion = () => {
    setMotionEnabled((current) => {
      const next = !current;
      window.localStorage.setItem("kind-motion-enabled", String(next));
      return next;
    });
  };

  const pageStyle = {
    "--kind-green": palette.green,
    "--kind-purple": palette.purple,
    "--kind-yellow": palette.yellow,
    "--kind-coral": palette.coral,
    "--kind-ink": palette.ink,
  } as CSSProperties;

  return (
    <main className="kind-project-page" style={pageStyle}>
      <nav className="kind-project-nav" aria-label="Project navigation">
        <Link href="/" className="kind-project-brand"><span className="kind-brand-mark" aria-hidden="true">✦</span> Interactive study</Link>
        <div className="kind-project-nav-center"><Link href="/projects">All projects</Link><span aria-hidden="true">·</span><span>Project / {project.index}</span></div>
        <Link href={`/projects/${nextProject.slug}`} className="kind-project-nav-next">Next <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </nav>

      <header className="kind-project-hero">
        <div className="kind-project-hero-meta"><span>{project.meta}</span><span>{project.year} · {project.duration}</span></div>
        <div className="kind-project-hero-grid">
          <div className="kind-project-hero-copy kind-reveal">
            <p className="kind-project-eyebrow">Project / {project.index}</p>
            <h1>{project.title}</h1>
            <p className="kind-project-lede">{project.summary}</p>
            <Link className="kind-project-cta" href="#kind-overview">Explore the project <ArrowDown size={16} aria-hidden="true" /></Link>
          </div>
          <KindInteractiveScene kind={scene} mode="hero" palette={palette} motionEnabled={motionEnabled} className="kind-project-hero-scene kind-reveal" />
        </div>
        <a className="kind-project-scroll" href="#kind-overview"><span>Scroll to explore</span><ArrowDown size={18} aria-hidden="true" /></a>
      </header>

      <section className="kind-project-manifesto kind-reveal" id="kind-overview">
        <p className="kind-project-section-label">A closer look</p>
        <h2>Useful things are made of small, considered decisions<span>.</span></h2>
        <KindInteractiveScene kind={scene} mode="manifesto" palette={palette} motionEnabled={motionEnabled} className="kind-project-manifesto-scene" />
        <p>{project.summary}</p>
        <dl>
          <div><dt>Role</dt><dd>{project.role}</dd></div>
          <div><dt>Focus</dt><dd>{project.meta}</dd></div>
          <div><dt>Topics</dt><dd>{project.tags.join(" · ")}</dd></div>
        </dl>
      </section>

      <div className="kind-project-chapters">
        {chapters.map((chapter, chapterIndex) => (
          <section className={`kind-project-chapter kind-reveal ${chapterIndex % 2 ? "is-reversed" : ""}`} key={chapter.label}>
            <KindInteractiveScene kind={scene} mode={chapter.mode} palette={palette} motionEnabled={motionEnabled} className="kind-project-art-wrap" />
            <div className="kind-project-chapter-copy"><p className="kind-project-section-label">{chapter.label}</p><h2>{chapter.title}</h2><p>{chapter.body}</p></div>
          </section>
        ))}
      </div>

      <footer className="kind-project-footer kind-reveal">
        <Link href="/projects" className="kind-project-back"><ArrowLeft size={16} aria-hidden="true" /> Back to all projects</Link>
        <Link href={`/projects/${nextProject.slug}`} className="kind-project-next"><span>Next project / {nextProject.index}</span><strong>{nextProject.title}</strong><ArrowUpRight size={34} aria-hidden="true" /></Link>
      </footer>
      <MotionToggle enabled={motionEnabled} onToggle={toggleMotion} />
    </main>
  );
}
