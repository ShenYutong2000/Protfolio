"use client";
import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { createStudyLoadingStore, isCriticalAsset, loadingSummary, type StudyLoadingStore } from "./studyLoadingState";
const LoadingContext = createContext<StudyLoadingStore | null>(null);
export function useStudyLoading() {
    const store = useContext(LoadingContext);
    if (!store)
        throw new Error("Study loading provider is missing");
    return store;
}
export function useStudyLoadingSnapshot() {
    const store = useStudyLoading();
    return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
export function StudyLoadingProvider({ children }: {
    children: ReactNode;
}) {
    const [store] = useState(createStudyLoadingStore);
    return <LoadingContext.Provider value={store}>{children}</LoadingContext.Provider>;
}
export function StudyLoadingScreen({ onRetry }: {
    onRetry: () => void;
}) {
    const store = useStudyLoading();
    const snapshot = useStudyLoadingSnapshot();
    const summary = loadingSummary(snapshot);
    const [slow, setSlow] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const panel = useRef<HTMLDivElement>(null);
    const ready = snapshot.phase === "ready";
    const unavailable = snapshot.phase === "unavailable";
    const fatal = snapshot.phase === "error";
    const visible = !dismissed || !ready;
    useEffect(() => {
        if (ready)
            return;
        const timer = setTimeout(() => setSlow(true), 30000);
        return () => clearTimeout(timer);
    }, [ready, snapshot.run]);
    useEffect(() => {
        if (!ready)
            return;
        const timer = setTimeout(() => setDismissed(true), matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 250);
        return () => clearTimeout(timer);
    }, [ready]);
    useEffect(() => {
        if (!visible)
            return;
        const siblings = [...document.querySelectorAll<HTMLElement>(".site-header, .site-footer")];
        const previous = siblings.map((element) => element.inert);
        siblings.forEach((element) => { element.inert = true; });
        panel.current?.focus({ preventScroll: true });
        return () => siblings.forEach((element, index) => { element.inert = previous[index]; });
    }, [visible]);
    if (!visible)
        return null;
    const optionalPending = slow && Object.values(snapshot.entries).some((e) => !e.required && e.status === "pending") &&
        Object.values(snapshot.entries).every((e) => !e.required || e.status === "ready");
    const message = unavailable ? "Your browser cannot display the 3D study. You can still explore the pages below." :
        fatal ? snapshot.message : summary.errors.length ? "Some items could not be prepared." :
            ready ? "Your study is ready." : snapshot.phase === "compiled" ? "Adding the finishing touches…" :
                snapshot.phase === "preparing" ? "Preparing the room…" : "Bringing everything into place…";
    return (<div className={`study-loading ${ready ? "is-ready" : ""}`} data-phase={snapshot.phase}>
      <div className="study-loading-panel" ref={panel} tabIndex={-1} aria-labelledby="study-loading-title">
        <span className="study-loading-eyebrow">A LITTLE SPACE TO EXPLORE</span>
        <h1 id="study-loading-title">{unavailable ? "Explore my work" : "Preparing your study"}</h1>
        {!unavailable && <>
          <div className="study-loading-progress" role="progressbar" aria-label="Study preparation" aria-valuemin={0} aria-valuemax={100} aria-valuenow={summary.progress}>
            <div style={{ width: `${summary.progress}%` }}/>
          </div>
          <div className="study-loading-numbers"><span>{summary.criticalTotal ? `${summary.criticalReady} of ${summary.criticalTotal} critical items prepared` : "Opening the study…"}</span><strong>{summary.progress}%</strong></div>
        </>}
        <p role="status" aria-live="polite">{message}</p>
        {summary.errors.length > 0 && <ul className="study-loading-errors">{summary.errors.map((entry) => <li key={entry.src}>{entry.label}{isCriticalAsset(entry) ? " — required" : ""}</li>)}</ul>}
        {slow && !ready && !unavailable && <p className="study-loading-slow">This is taking longer than usual. You can keep waiting or retry.</p>}
        {!unavailable && !ready && (slow || fatal || summary.errors.length > 0) && <div className="study-loading-actions">
          <button type="button" onClick={() => { setSlow(false); onRetry(); }}>Retry loading</button>
          {!fatal && (summary.canSkip || optionalPending) && <button type="button" onClick={() => store.skipOptional(slow)}>Continue without these items</button>}
        </div>}
        {(unavailable || fatal) && <>
          {unavailable && <div className="study-loading-actions">
            <button type="button" onClick={onRetry}>Try the 3D study again</button>
          </div>}
          <nav className="study-loading-links" aria-label="Explore without 3D">
            <Link href="/teaching">Teaching</Link><Link href="/?view=research">Research</Link><Link href="/experience">Experience</Link><Link href="/portfolio">Portfolio</Link>
          </nav>
        </>}
      </div>
    </div>);
}
