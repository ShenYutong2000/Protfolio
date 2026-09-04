"use client";

import { useEffect, useId, useRef, type KeyboardEventHandler, type ReactNode } from "react";
import { ArrowLeft, X } from "lucide-react";
import styles from "./ObjectDialog.module.css";

export function ObjectDialog({ title, description, onClose, children, footer, reducedMotion, onKeyDown }: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
  reducedMotion: boolean;
  onKeyDown?: KeyboardEventHandler<HTMLDialogElement>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previousFocus instanceof HTMLElement && previousFocus !== document.body && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      } else {
        document.querySelector<HTMLElement>(".study-canvas")?.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      data-reduced-motion={reducedMotion}
      onKeyDown={onKeyDown}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <header className={styles.header}>
        <div>
          <h2 id={titleId}>{title}</h2>
          <button className={styles.back} type="button" onClick={onClose}><ArrowLeft size={14} aria-hidden="true" /> Back to room</button>
        </div>
        <p className={styles.description} id={descriptionId}>{description}</p>
        <button className={styles.close} type="button" onClick={onClose} aria-label={`Close ${title}`}><X size={21} aria-hidden="true" /></button>
      </header>
      <div className={styles.content}>{children}</div>
      <footer className={styles.footer}>{footer}<span>Esc to return to the study</span></footer>
    </dialog>
  );
}
