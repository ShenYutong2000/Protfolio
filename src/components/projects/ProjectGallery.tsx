"use client";

import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Project } from "@/data/content";

const themes = ["violet", "green", "coral"] as const;

function ScrollRibbons() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const colors = ["#6f54b5", "#ef7655", "#75ad7b", "#ebc960", "#7ac8c1"];
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let lastScroll = window.scrollY;
    let velocity = 0;
    let targetVelocity = 0;
    let scrollProgress = 0;
    let frame = 0;

    const resize = () => {
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const onScroll = () => {
      const nextScroll = window.scrollY;
      targetVelocity = reduceMotion.matches
        ? 0
        : Math.max(-58, Math.min(58, nextScroll - lastScroll));
      lastScroll = nextScroll;
      const available = Math.max(1, document.documentElement.scrollHeight - height);
      scrollProgress = nextScroll / available;
    };

    const drawRibbon = (
      index: number,
      color: string,
      speed: number,
      thickness: number,
    ) => {
      const direction = index % 2 === 0 ? 1 : -1;
      const phase = scrollProgress * Math.PI * (2.1 + index * 0.18);
      const pulse = Math.sin(phase + index * 1.35);
      const lift = velocity * speed * direction;
      const lane = (index + 0.55) / colors.length;
      const startY = height * lane + pulse * height * 0.09 + lift * 1.9;
      const endY = height * (1 - lane) - pulse * height * 0.08 - lift * 1.45;
      const spread = Math.max(90, width * 0.14);

      context.beginPath();
      context.moveTo(-spread, startY);
      context.bezierCurveTo(
        width * 0.19,
        startY - height * (0.28 + index * 0.018) - lift,
        width * 0.72,
        endY + height * (0.25 - index * 0.02) + lift * 0.7,
        width + spread,
        endY,
      );
      context.strokeStyle = color;
      context.globalAlpha = 0.14 + Math.min(0.19, Math.abs(velocity) * 0.006);
      context.lineWidth = thickness + Math.min(22, Math.abs(velocity) * 0.35);
      context.lineCap = "round";
      context.stroke();

      context.globalAlpha = 0.22;
      context.lineWidth = 1.2;
      context.strokeStyle = "rgba(35, 27, 48, 0.38)";
      context.stroke();
    };

    const render = () => {
      velocity += (targetVelocity - velocity) * 0.12;
      targetVelocity *= 0.9;
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "multiply";

      colors.forEach((color, index) => {
        drawRibbon(index, color, 0.75 + index * 0.14, 22 + index * 5);
      });

      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";
      frame = window.requestAnimationFrame(render);
    };

    resize();
    onScroll();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    reduceMotion.addEventListener("change", onScroll);
    frame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      reduceMotion.removeEventListener("change", onScroll);
    };
  }, []);

  return <canvas className="project-ribbon-canvas" ref={canvasRef} aria-hidden="true" />;
}

function ProjectPreview({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="project-art project-art-research" aria-hidden="true">
        <div className="project-browser-bar"><i /><i /><i /></div>
        <div className="project-research-query">How do ideas connect?</div>
        <div className="project-research-map">
          <span /><span /><span /><span /><span />
          <svg viewBox="0 0 500 210" preserveAspectRatio="none">
            <path d="M42 126 C128 30 166 190 246 88 S382 42 460 136" />
            <path d="M80 42 C164 110 205 52 300 154 S405 152 454 64" />
          </svg>
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="project-art project-art-atlas" aria-hidden="true">
        <div className="project-atlas-copy"><small>NEIGHBORHOOD VIEW</small><strong>72</strong><span>community indicators</span></div>
        <div className="project-atlas-chart"><i /><i /><i /><i /><i /><i /></div>
        <div className="project-atlas-orbit"><span /><span /><span /></div>
      </div>
    );
  }

  return (
    <div className="project-art project-art-archive" aria-hidden="true">
      <div className="project-archive-word">MAKE<br />PLAY<br />KEEP</div>
      <div className="project-archive-disc disc-one" />
      <div className="project-archive-disc disc-two" />
      <div className="project-archive-tile tile-one" />
      <div className="project-archive-tile tile-two" />
    </div>
  );
}

export function ProjectGallery({ projects }: { projects: Project[] }) {
  return (
    <main className="projects-showcase">
      <ScrollRibbons />

      <section className="projects-hero">
        <div className="projects-hero-topline">
          <Link href="/">← Back to the study</Link>
          <span>Selected work · 2025—2026</span>
        </div>

        <div className="projects-hero-copy">
          <p className="projects-kicker">Product · Data · Creative technology</p>
          <h1>Ideas shaped<br />into <em>useful things.</em></h1>
          <p className="projects-deck">
            Three projects about making research easier to navigate, information
            clearer to understand, and digital experiences more human to use.
          </p>
        </div>

        <a className="projects-scroll-cue" href="#project-01">
          <span>Scroll to explore</span>
          <ArrowDown size={17} aria-hidden="true" />
        </a>
      </section>

      <section className="projects-gallery" aria-label="Selected projects">
        {projects.map((project, index) => (
          <article
            className={`project-story project-story-${themes[index % themes.length]}`}
            id={`project-${project.index}`}
            key={project.slug}
          >
            <Link className="project-story-link" href={`/projects/${project.slug}`}>
              <div className="project-story-visual">
                <ProjectPreview index={index} />
                <div className="project-story-stamp">
                  <span>{project.index}</span>
                  <small>{project.year}</small>
                </div>
              </div>

              <div className="project-story-copy">
                <div className="project-story-meta">
                  <span>{project.meta}</span>
                  <span>{project.duration}</span>
                </div>
                <h2>{project.title}</h2>
                <p>{project.summary}</p>
                <div className="project-story-foot">
                  <ul aria-label="Technologies">
                    {project.tags.map((tag) => <li key={tag}>{tag}</li>)}
                  </ul>
                  <span className="project-open-label">
                    View case study <ArrowUpRight size={19} aria-hidden="true" />
                  </span>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </section>

      <section className="projects-endnote">
        <p>More experiments are always in motion.</p>
        <Link href="/portfolio">Explore the wider portfolio <ArrowUpRight size={18} aria-hidden="true" /></Link>
      </section>
    </main>
  );
}
