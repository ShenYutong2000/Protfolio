import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionShell } from "@/components/SectionShell";
import { projects } from "@/data/content";

export const metadata = {
  title: "Projects",
};

export default function ProjectsPage() {
  return (
    <SectionShell
      number="02"
      eyebrow="The computer on the desk"
      title="Selected projects."
      introduction="A collection of products and experiments shaped by research, collaboration, and a desire to make complicated things feel clear."
    >
      <div className="project-list">
        {projects.map((project) => (
          <article className="project-card" key={project.index}>
            <div className={`project-visual visual-${project.index}`}>
              <span>{project.index}</span>
            </div>
            <div className="project-info">
              <p className="card-meta">{project.meta}</p>
              <h2>{project.title}</h2>
              <p>{project.summary}</p>
              <ul className="tag-list" aria-label="Technologies">
                {project.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </div>
            <Link
              className="circle-button"
              href={`/projects/${project.slug}`}
              aria-label={`Open ${project.title}`}
            >
              <ArrowUpRight aria-hidden="true" size={20} />
            </Link>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
