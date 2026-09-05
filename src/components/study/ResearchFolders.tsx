"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { research } from "@/data/research";
import { ObjectDialog } from "./ObjectDialog";
import styles from "./ObjectDialog.module.css";

const researchFolders = [
  {
    href: `/research/${research[0].slug}`,
    index: "01",
    title: research[0].title,
    year: research[0].year,
    note: research[0].venue,
    summary: research[0].summary,
  },
];

export function ResearchFolders({ onClose, reducedMotion }: { onClose: () => void; reducedMotion: boolean }) {
  return (
    <ObjectDialog
      title="Research"
      description="Questions, methods, and findings from ongoing inquiry."
      onClose={onClose}
      reducedMotion={reducedMotion}
      footer={<span>Select a folder to enter Research</span>}
    >
      <div className={styles.folders}>
        {researchFolders.map((folder, index) => (
          <article
            key={folder.title}
            className={styles.folderEntry}
            style={{ animationDelay: reducedMotion ? "0ms" : `${index * 110}ms` }}
          >
            <Link href={folder.href} className={styles.folderLink} aria-label={`Open research: ${folder.title}`}>
              <span className={styles.folderObject} data-tone={index % 3}>
                <span className={styles.folderBack} aria-hidden="true" />
                <span className={styles.folderPaper} aria-hidden="true">
                  <span>{folder.note}</span><i /><i /><i />
                </span>
                <span className={styles.folderFace}>
                  <span className={styles.folderIndex}>RESEARCH / {folder.index}</span>
                  <strong>{folder.title}</strong>
                  <span className={styles.folderBottom}>
                    {folder.year}<ArrowUpRight size={22} aria-hidden="true" />
                  </span>
                </span>
              </span>
              <span className={styles.folderCaption}>
                <span>{folder.summary}</span>
                <span>{folder.note}</span>
              </span>
            </Link>
          </article>
        ))}
      </div>
    </ObjectDialog>
  );
}
