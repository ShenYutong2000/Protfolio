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
  const target = useRef({ x: 0, y: 0, active: false });
  const current = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const visible = useRef(true);

  useEffect(() => {
    const node = sceneRef.current;
    if (!node || !motionEnabled) return;

    let raf = 0;
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
        const { x, y } = current.current;
        node.style.setProperty("--scene-x", x.toFixed(4));
        node.style.setProperty("--scene-y", y.toFixed(4));
        node.style.setProperty("--scene-tilt", `${(x * 8).toFixed(2)}deg`);
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
        <rect className="kind-scene-paper" x="15" y="15" width="610" height="470" rx="36" fill="#fffbed" />
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

type RibbonSection = "hero" | "manifesto" | "challenge" | "approach" | "outcome" | "footer";
type RibbonPoint = readonly [number, number];

const ribbonSequence: RibbonSection[] = ["hero", "manifesto", "challenge", "approach", "outcome", "footer"];
const ribbonShapes: Record<RibbonSection, RibbonPoint[]> = {
  hero: [[.38, .39], [.48, .25], [.61, .14], [.73, .12], [.83, .18], [.91, .29], [.97, .39]],
  manifesto: [[.06, .78], [.16, .53], [.36, .34], [.58, .29], [.78, .39], [.88, .58], [.76, .80]],
  challenge: [[.11, .22], [.23, .43], [.40, .59], [.58, .56], [.76, .40], [.84, .21], [.71, .12]],
  approach: [[.06, .72], [.19, .51], [.37, .34], [.56, .30], [.73, .42], [.86, .64], [.94, .78]],
  outcome: [[.04, .42], [.18, .22], [.36, .18], [.55, .32], [.70, .57], [.84, .73], [.96, .53]],
  footer: [[.10, .82], [.24, .66], [.40, .61], [.57, .70], [.71, .84], [.84, .74], [.93, .59]],
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function interpolateRibbonShape(stage: number): RibbonPoint[] {
  const index = clamp(Math.floor(stage), 0, ribbonSequence.length - 1);
  const nextIndex = Math.min(ribbonSequence.length - 1, index + 1);
  const amount = clamp(stage - index, 0, 1);
  const first = ribbonShapes[ribbonSequence[index]];
  const second = ribbonShapes[ribbonSequence[nextIndex]];
  return first.map((point, pointIndex) => [
    point[0] + (second[pointIndex][0] - point[0]) * amount,
    point[1] + (second[pointIndex][1] - point[1]) * amount,
  ] as const);
}

function drawRibbon(ctx: CanvasRenderingContext2D, points: RibbonPoint[]) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const afterNext = points[index + 2] ?? next;
    const controlOne: RibbonPoint = [
      current[0] + (next[0] - previous[0]) / 6,
      current[1] + (next[1] - previous[1]) / 6,
    ];
    const controlTwo: RibbonPoint = [
      next[0] - (afterNext[0] - current[0]) / 6,
      next[1] - (afterNext[1] - current[1]) / 6,
    ];
    ctx.bezierCurveTo(controlOne[0], controlOne[1], controlTwo[0], controlTwo[1], next[0], next[1]);
  }
  ctx.stroke();
}

function KindFloatingRibbon({ palette, motionEnabled }: { palette: Palette; motionEnabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const page = canvas?.closest<HTMLElement>(".kind-project-page");
    if (!canvas || !page) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const state = {
      pointerX: .5,
      pointerY: .42,
      targetPointerX: .5,
      targetPointerY: .42,
      pointerVX: 0,
      pointerVY: 0,
      scrollY: window.scrollY,
      targetScrollY: window.scrollY,
      scrollKick: 0,
      stage: 0,
      lastScrollY: window.scrollY,
    };
    const viewport = { width: window.innerWidth, height: window.innerHeight, ratio: 1 };
    let frame = 0;
    let previousTime = performance.now();
    let anchors: { section: RibbonSection; top: number }[] = [];

    const measure = () => {
      anchors = ribbonSequence.map((section) => {
        const element = page.querySelector<HTMLElement>(`[data-ribbon-section="${section}"]`);
        return { section, top: element ? element.getBoundingClientRect().top + window.scrollY : 0 };
      });
    };

    const resize = () => {
      viewport.width = window.innerWidth;
      viewport.height = window.innerHeight;
      viewport.ratio = Math.min(1.75, window.devicePixelRatio || 1);
      canvas.width = Math.round(viewport.width * viewport.ratio);
      canvas.height = Math.round(viewport.height * viewport.ratio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      context.setTransform(viewport.ratio, 0, 0, viewport.ratio, 0, 0);
      measure();
    };

    const getStage = (scrollY: number) => {
      const probe = scrollY + viewport.height * .42;
      if (anchors.length < 2 || anchors.every((anchor) => anchor.top === 0)) {
        return clamp(scrollY / Math.max(1, document.documentElement.scrollHeight - viewport.height) * (ribbonSequence.length - 1), 0, ribbonSequence.length - 1);
      }
      if (probe <= anchors[0].top) return 0;
      for (let index = 0; index < anchors.length - 1; index += 1) {
        const start = anchors[index].top;
        const end = Math.max(start + 1, anchors[index + 1].top);
        if (probe <= end) return index + clamp((probe - start) / (end - start), 0, 1);
      }
      return ribbonSequence.length - 1;
    };

    const draw = () => {
      const stage = motionEnabled ? state.stage : getStage(state.scrollY);
      const base = interpolateRibbonShape(stage);
      const pointerOffsetX = (state.pointerX - .5) * .18;
      const pointerOffsetY = (state.pointerY - .5) * .22;
      const pointerVelocityX = clamp(state.pointerVX * .012, -.045, .045);
      const pointerVelocityY = clamp(state.pointerVY * .012, -.055, .055);
      const scrollOffsetY = clamp(-state.scrollKick * .15, -.22, .22);
      const points = base.map(([x, y], index) => {
        const weight = Math.sin((index / (base.length - 1)) * Math.PI);
        const edgeWeight = index / (base.length - 1) - .5;
        const mobileHeroDrop = viewport.width < 760 && stage < 1 ? .42 : 0;
        return [
          clamp(x + pointerOffsetX * (.4 + weight) + pointerVelocityX * weight + edgeWeight * pointerVelocityY * .2, -.08, 1.08) * viewport.width,
          clamp(y + mobileHeroDrop + pointerOffsetY * weight + pointerVelocityY * weight + scrollOffsetY * (.45 + weight), -.16, 1.16) * viewport.height,
        ] as const;
      });

      context.clearRect(0, 0, viewport.width, viewport.height);
      context.strokeStyle = palette.green;
      context.lineWidth = 2.35;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.globalAlpha = .9;
      drawRibbon(context, points);
      context.globalAlpha = 1;
    };

    const pointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      state.targetPointerX = clamp(event.clientX / Math.max(1, viewport.width), 0, 1);
      state.targetPointerY = clamp(event.clientY / Math.max(1, viewport.height), 0, 1);
    };
    const pointerLeave = () => {
      state.targetPointerX = .5;
      state.targetPointerY = .42;
    };
    const scroll = () => {
      const next = window.scrollY;
      const delta = next - state.lastScrollY;
      state.targetScrollY = next;
      state.scrollKick = clamp(state.scrollKick + delta / Math.max(260, viewport.height * .42), -1.5, 1.5);
      state.lastScrollY = next;
      if (!motionEnabled) draw();
    };

    const render = (time: number) => {
      const delta = Math.min(.05, Math.max(.001, (time - previousTime) / 1000));
      previousTime = time;
      if (document.visibilityState !== "hidden") {
        const pointerBlend = 1 - Math.exp(-delta * 11);
        const scrollBlend = 1 - Math.exp(-delta * 8);
        const previousX = state.pointerX;
        const previousY = state.pointerY;
        state.pointerX += (state.targetPointerX - state.pointerX) * pointerBlend;
        state.pointerY += (state.targetPointerY - state.pointerY) * pointerBlend;
        state.pointerVX = (state.pointerX - previousX) / delta;
        state.pointerVY = (state.pointerY - previousY) / delta;
        state.scrollY += (state.targetScrollY - state.scrollY) * scrollBlend;
        state.stage += (getStage(state.scrollY) - state.stage) * (1 - Math.exp(-delta * 7));
        state.scrollKick *= Math.exp(-delta * 2.7);
        draw();
      }
      frame = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", pointerMove, { passive: true });
    window.addEventListener("blur", pointerLeave);
    window.addEventListener("scroll", scroll, { passive: true });
    if (motionEnabled) frame = requestAnimationFrame(render);
    else draw();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("blur", pointerLeave);
      window.removeEventListener("scroll", scroll);
    };
  }, [motionEnabled, palette.green]);

  return <canvas ref={canvasRef} className="kind-floating-ribbon" aria-hidden="true" />;
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
      <KindFloatingRibbon palette={palette} motionEnabled={motionEnabled} />
      <nav className="kind-project-nav" aria-label="Project navigation">
        <Link href="/" className="kind-project-brand"><span className="kind-brand-mark" aria-hidden="true">✦</span> Interactive study</Link>
        <div className="kind-project-nav-center"><Link href="/projects">All projects</Link><span aria-hidden="true">·</span><span>Project / {project.index}</span></div>
        <Link href={`/projects/${nextProject.slug}`} className="kind-project-nav-next">Next <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </nav>

      <header className="kind-project-hero" data-ribbon-section="hero">
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

      <section className="kind-project-manifesto kind-reveal" id="kind-overview" data-ribbon-section="manifesto">
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
          <section className={`kind-project-chapter kind-reveal ${chapterIndex % 2 ? "is-reversed" : ""}`} data-ribbon-section={chapter.mode} key={chapter.label}>
            <KindInteractiveScene kind={scene} mode={chapter.mode} palette={palette} motionEnabled={motionEnabled} className="kind-project-art-wrap" />
            <div className="kind-project-chapter-copy"><p className="kind-project-section-label">{chapter.label}</p><h2>{chapter.title}</h2><p>{chapter.body}</p></div>
          </section>
        ))}
      </div>

      <footer className="kind-project-footer kind-reveal" data-ribbon-section="footer">
        <Link href="/projects" className="kind-project-back"><ArrowLeft size={16} aria-hidden="true" /> Back to all projects</Link>
        <Link href={`/projects/${nextProject.slug}`} className="kind-project-next"><span>Next project / {nextProject.index}</span><strong>{nextProject.title}</strong><ArrowUpRight size={34} aria-hidden="true" /></Link>
      </footer>
      <MotionToggle enabled={motionEnabled} onToggle={toggleMotion} />
    </main>
  );
}
