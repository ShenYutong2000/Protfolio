"use client";

import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUpRight } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import type { Project } from "@/data/content";

type Panel = {
  key: "overview" | "challenge" | "approach" | "outcome";
  eyebrow: string;
  heading: string;
  body: string;
  buttonLabel: string;
  buttonHref: string;
  buttonTone: string;
  backgroundPosition: string;
};

const panelBackgrounds = ["#f9ffe7", "#edf9ff", "#ffecf2", "#ffe8db"];
const panelTones = ["#d5ff37", "#7dd6ff", "#ffa0b0", "#ffa17b"];
const panelPositions = ["0% 0%", "100% 0%", "0% 100%", "100% 100%"];

function ProjectBoard({ project, panels }: { project: Project; panels: Panel[] }) {
  const rootRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposeAnimation: (() => void) | undefined;
    const context = gsap.context(() => {
      const leftItems = gsap.utils.toArray<HTMLElement>(".project-template-left .project-template-panel");
      const rightItems = gsap.utils.toArray<HTMLElement>(".project-template-right .project-template-image");
      let resizeTimeout: number | undefined;

      const handleMobileLayout = () => {
        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        if (isMobile) {
          leftItems.forEach((item, index) => { item.style.order = String(index * 2); });
          rightItems.forEach((item, index) => { item.style.order = String(index * 2 + 1); });
        } else {
          leftItems.forEach((item) => { item.style.order = ""; });
          rightItems.forEach((item) => { item.style.order = ""; });
        }
      };

      handleMobileLayout();
      const onResize = () => {
        window.clearTimeout(resizeTimeout);
        resizeTimeout = window.setTimeout(handleMobileLayout, 120);
      };
      window.addEventListener("resize", onResize);

      if (reducedMotion) {
        disposeAnimation = () => {
          window.removeEventListener("resize", onResize);
          window.clearTimeout(resizeTimeout);
        };
        return;
      }

      gsap.registerPlugin(ScrollTrigger);
      const images = gsap.utils.toArray<HTMLElement>(".project-template-image");
      const lenis = new Lenis({
        duration: 1.2,
        easing: (value: number) => Math.min(1, 1.001 - Math.pow(2, -10 * value)),
        smoothWheel: true,
      });

      let frameId = 0;
      const animationFrame = (time: number) => {
        lenis.raf(time);
        ScrollTrigger.update();
        frameId = requestAnimationFrame(animationFrame);
      };
      frameId = requestAnimationFrame(animationFrame);

      images.forEach((image, index) => {
        image.style.zIndex = String(images.length - index);
      });

      gsap.set(images, { clipPath: "inset(0)" });
      if (window.matchMedia("(max-width: 768px)").matches) {
        images.forEach((image, index) => {
          gsap.timeline({
            scrollTrigger: {
              trigger: image,
              start: "top-=70% top+=50%",
              end: "bottom+=200% bottom",
              scrub: true,
            },
          })
            .to(image, { backgroundPosition: "50% 30%", duration: 5, ease: "none" })
            .to(root, { backgroundColor: panelBackgrounds[index], duration: 1.5, ease: "power2.inOut" });
        });
      } else {
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: ".project-template-arch",
            start: "top top",
            end: "bottom bottom",
            pin: ".project-template-right",
            scrub: true,
            invalidateOnRefresh: true,
          },
        });

        images.forEach((image, index) => {
          const nextImage = images[index + 1];
          if (!nextImage) return;
          const sectionTimeline = gsap.timeline();
          sectionTimeline
            .to(root, { backgroundColor: panelBackgrounds[index + 1], duration: 1.5, ease: "power2.inOut" }, 0)
            .to(image, { clipPath: "inset(0 0 100% 0)", backgroundPosition: "50% 60%", duration: 1.5, ease: "none" }, 0)
            .to(nextImage, { backgroundPosition: "50% 40%", duration: 1.5, ease: "none" }, 0);
          timeline.add(sectionTimeline);
        });
      }

      disposeAnimation = () => {
        cancelAnimationFrame(frameId);
        lenis.destroy();
        window.removeEventListener("resize", onResize);
        window.clearTimeout(resizeTimeout);
      };
    }, root);

    return () => {
      disposeAnimation?.();
      context.revert();
    };
  }, [panels]);

  return (
    <main ref={rootRef} className="project-template-page" style={{ backgroundColor: panelBackgrounds[0] }}>
      <div className="project-template-container">
        <div className="project-template-spacer" aria-hidden="true" />

        <section className="project-template-arch" aria-label={`${project.title} case study`}>
          <div className="project-template-left">
            {panels.map((panel, index) => (
              <article className="project-template-panel" id={panel.key} key={panel.key}>
                <div className="project-template-content">
                  <p className="project-template-index">{project.index} / {panel.eyebrow}</p>
                  <h1>{index === 0 ? project.title : panel.heading}</h1>
                  <p className="project-template-description">{panel.body}</p>
                  <Link
                    className="project-template-link"
                    href={panel.buttonHref}
                    style={{ backgroundColor: panel.buttonTone }}
                  >
                    {panel.key === "overview" ? <ArrowLeft size={16} aria-hidden="true" /> : panel.key === "outcome" ? <ArrowUpRight size={16} aria-hidden="true" /> : <ArrowDown size={16} aria-hidden="true" />}
                    <span>{panel.buttonLabel}</span>
                  </Link>
                  {panel.key === "outcome" && (
                    <div className="project-template-meta">
                      <span>{project.role}</span>
                      <span>{project.tags.join(" · ")}</span>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="project-template-right" aria-hidden="true">
            {panels.map((panel) => (
              <div
                className="project-template-image"
                data-panel={panel.key}
                key={panel.key}
                style={{
                  backgroundImage: `url(/assets/projects/${project.slug}-board.png)`,
                  backgroundPosition: panel.backgroundPosition,
                }}
              />
            ))}
          </div>
        </section>

        <div className="project-template-spacer" aria-hidden="true" />
      </div>
    </main>
  );
}

export function KindProjectPage({ project, nextProject }: { project: Project; nextProject: Project }) {
  const panels: Panel[] = [
    {
      key: "overview",
      eyebrow: "Overview",
      heading: project.title,
      body: project.summary,
      buttonLabel: "Back to Projects",
      buttonHref: "/projects",
      buttonTone: panelTones[0],
      backgroundPosition: panelPositions[0],
    },
    {
      key: "challenge",
      eyebrow: "Challenge",
      heading: "Start with the question",
      body: project.challenge,
      buttonLabel: "See the approach",
      buttonHref: "#approach",
      buttonTone: panelTones[1],
      backgroundPosition: panelPositions[1],
    },
    {
      key: "approach",
      eyebrow: "Approach",
      heading: "Make the path easier to follow",
      body: project.approach,
      buttonLabel: "See the outcome",
      buttonHref: "#outcome",
      buttonTone: panelTones[2],
      backgroundPosition: panelPositions[2],
    },
    {
      key: "outcome",
      eyebrow: "Outcome",
      heading: "Leave more room to think",
      body: project.outcome,
      buttonLabel: `Next: ${nextProject.title}`,
      buttonHref: `/projects/${nextProject.slug}`,
      buttonTone: panelTones[3],
      backgroundPosition: panelPositions[3],
    },
  ];

  return <ProjectBoard project={project} panels={panels} />;
}
