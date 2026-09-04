"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, BriefcaseBusiness } from "lucide-react";
import { experience } from "@/data/content";
import { ObjectDialog } from "./ObjectDialog";
import styles from "./ObjectDialog.module.css";

type CardState = { index: number; previous: number | null; direction: number; turn: number };

function CardContent({ index }: { index: number }) {
  const entry = experience[index];
  return <>
    <div className={styles.cardTop}><span>EXPERIENCE / {String(index + 1).padStart(2, "0")}</span><BriefcaseBusiness size={22} aria-hidden="true" /></div>
    <p className={styles.period}>{entry.period}</p>
    <h3>{entry.role}</h3>
    <p className={styles.company}>{entry.company}</p>
    <div className={styles.cardRule} />
    <div className={styles.cardScroll} data-card-scroll tabIndex={0} aria-label="Experience summary">
      <p className={styles.summary}>{entry.achievements[0]}</p>
      <ul>{entry.achievements.slice(1).map((achievement) => <li key={achievement}>{achievement}</li>)}</ul>
    </div>
    <ul className={styles.skills} aria-label="Skills">{entry.tools.map((tool) => <li key={tool}>{tool}</li>)}</ul>
  </>;
}

export function ExperienceCards({ onClose, reducedMotion }: { onClose: () => void; reducedMotion: boolean }) {
  const [card, setCard] = useState<CardState>({ index: 0, previous: null, direction: 1, turn: 0 });
  const busy = useRef(false);
  const deckRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const wheelGesture = useRef({ total: 0, lastWheel: 0, consumed: false });

  const goTo = useCallback((index: number) => {
    if (busy.current || index === card.index || index < 0 || index >= experience.length) return;
    busy.current = !reducedMotion;
    setCard({ index, previous: reducedMotion ? null : card.index, direction: index > card.index ? 1 : -1, turn: card.turn + 1 });
  }, [card.index, card.turn, reducedMotion]);

  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const scroller = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-card-scroll]") : null;
      if (scroller && scroller.scrollHeight > scroller.clientHeight + 1) {
        const canScroll = event.deltaY > 0 ? scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 1 : scroller.scrollTop > 0;
        if (canScroll) return;
      }
      event.preventDefault();
      const now = performance.now();
      const gesture = wheelGesture.current;
      if (now - gesture.lastWheel > 220) { gesture.total = 0; gesture.consumed = false; }
      gesture.lastWheel = now;
      if (gesture.consumed || busy.current) return;
      gesture.total += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? deck.clientHeight : 1);
      if (Math.abs(gesture.total) < 55) return;
      gesture.consumed = true;
      goTo(card.index + Math.sign(gesture.total));
    };
    deck.addEventListener("wheel", onWheel, { passive: false });
    return () => deck.removeEventListener("wheel", onWheel);
  }, [card.index, goTo]);

  function finishTurn() {
    busy.current = false;
    setCard((current) => ({ ...current, previous: null }));
  }

  function endSwipe(event: PointerEvent<HTMLDivElement>) {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy)) goTo(card.index + (dx < 0 ? 1 : -1));
  }

  return (
    <ObjectDialog title="Experience" description="A few chapters from my working life." onClose={onClose} reducedMotion={reducedMotion} onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        goTo(card.index + (event.key === "ArrowRight" ? 1 : -1));
      }} footer={<><span>Scroll or swipe to turn a card · ← →</span><Link href="/experience">Full timeline <ArrowUpRight size={13} aria-hidden="true" /></Link></>}>
      <div className={styles.experience}>
        {experience.length > 0 ? <>
          <div ref={deckRef} className={styles.deck} data-direction={card.direction}>
            <div className={styles.cardStack} aria-hidden="true"><span>CHAPTERS FROM THE BRIEFCASE</span></div>
            <article key={`current-${card.turn}`} className={`${styles.experienceCard} ${card.previous !== null ? styles.cardIncoming : styles.cardSettled}`} aria-label={`Experience ${card.index + 1} of ${experience.length}`} onPointerDown={(event) => {
              if (event.pointerType !== "mouse") { swipe.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }
            }} onPointerUp={endSwipe} onPointerCancel={() => { swipe.current = null; }}>
              <CardContent index={card.index} />
            </article>
            {card.previous !== null && <article key={`outgoing-${card.turn}`} className={`${styles.experienceCard} ${styles.cardOutgoing}`} aria-hidden="true" inert onAnimationEnd={(event) => { if (event.target === event.currentTarget) finishTurn(); }}><CardContent index={card.previous} /></article>}
          </div>
          <nav className={styles.cardControls} aria-label="Experience cards">
            <button type="button" aria-label="Previous experience" disabled={card.index === 0 || card.previous !== null} onClick={() => goTo(card.index - 1)}><ArrowLeft size={19} aria-hidden="true" /></button>
            <div className={styles.cardPages}>{experience.map((entry, index) => <button type="button" key={`${entry.period}-${entry.role}`} aria-label={`Go to experience ${index + 1}`} aria-current={index === card.index ? "step" : undefined} disabled={card.previous !== null} onClick={() => goTo(index)}><span /></button>)}</div>
            <span className={styles.counter} role="status" aria-live="polite">{String(card.index + 1).padStart(2, "0")} / {String(experience.length).padStart(2, "0")}</span>
            <button type="button" aria-label="Next experience" disabled={card.index === experience.length - 1 || card.previous !== null} onClick={() => goTo(card.index + 1)}><ArrowRight size={19} aria-hidden="true" /></button>
          </nav>
        </> : <p className={styles.empty}>New experience cards will appear here soon.</p>}
      </div>
    </ObjectDialog>
  );
}
