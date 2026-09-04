"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { projects } from "@/data/content";
import { ObjectDialog } from "./ObjectDialog";
import styles from "./ObjectDialog.module.css";

export function ProjectFolders({ onClose, reducedMotion }: { onClose: () => void; reducedMotion: boolean }) {
  return (
    <ObjectDialog title="Projects" description="From a question to something you can use." onClose={onClose} reducedMotion={reducedMotion} footer={<span>Select a folder to explore a project</span>}>
      <div className={styles.folders}>
        {projects.map((project, index) => (
          <article key={project.slug} className={styles.folderEntry} style={{ animationDelay: reducedMotion ? "0ms" : `${index * 110}ms` }}>
            <Link href={`/projects/${project.slug}`} className={styles.folderLink} aria-label={`Open project: ${project.title}`}>
              <span className={styles.folderObject} data-tone={index % 3}>
                <span className={styles.folderBack} aria-hidden="true" />
                <span className={styles.folderPaper} aria-hidden="true"><span>{project.meta}</span><i /><i /><i /></span>
                <span className={styles.folderFace}>
                  <span className={styles.folderIndex}>PROJECT / {project.index}</span>
                  <strong>{project.title}</strong>
                  <span className={styles.folderBottom}>{project.year}<ArrowUpRight size={22} aria-hidden="true" /></span>
                </span>
              </span>
              <span className={styles.folderCaption}><span>{project.summary}</span><span>{project.tags.join(" · ")}</span></span>
            </Link>
          </article>
        ))}
        {projects.length === 0 && <p className={styles.empty}>New project folders will appear here soon.</p>}
      </div>
    </ObjectDialog>
  );
}
