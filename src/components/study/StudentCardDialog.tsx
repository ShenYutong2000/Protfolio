"use client";

/* eslint-disable @next/next/no-img-element */

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { ObjectDialog } from "./ObjectDialog";
import styles from "./ObjectDialog.module.css";

type StudentCardDialogProps = {
  onClose: () => void;
  reducedMotion: boolean;
};

export function StudentCardDialog({ onClose, reducedMotion }: StudentCardDialogProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (reducedMotion || event.pointerType === "touch") return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * 2 - 1;
    const y = (event.clientY - rect.top) / rect.height * 2 - 1;
    card.style.setProperty("--card-rotate-x", `${-y * 5}deg`);
    card.style.setProperty("--card-rotate-y", `${x * 7}deg`);
    card.style.setProperty("--card-sheen-x", `${50 + x * 35}%`);
    card.style.setProperty("--card-sheen-y", `${50 + y * 35}%`);
  }

  function resetPointer() {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty("--card-rotate-x", "0deg");
    card.style.setProperty("--card-rotate-y", "0deg");
    card.style.setProperty("--card-sheen-x", "50%");
    card.style.setProperty("--card-sheen-y", "50%");
  }

  return (
    <ObjectDialog
      title="Student ID"
      description="A small piece of the study, kept close at hand."
      onClose={onClose}
      reducedMotion={reducedMotion}
      footer={<span>Student ID · Kathleen Shen</span>}
    >
      <div className={styles.studentCardStage}>
        <div
          ref={cardRef}
          className={styles.studentCardWrap}
          role="img"
          aria-label="Kathleen Shen student identification card"
          onPointerMove={handlePointerMove}
          onPointerLeave={resetPointer}
        >
          <img
            className={styles.studentCardImage}
            src="/assets/student-id-card.jpg"
            alt=""
            aria-hidden="true"
            draggable={false}
          />
        </div>
      </div>
    </ObjectDialog>
  );
}
