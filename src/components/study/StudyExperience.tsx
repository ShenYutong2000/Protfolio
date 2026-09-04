"use client";
import dynamic from "next/dynamic";
import { Component, useState, type ReactNode } from "react";
import { StudyLoadingProvider, StudyLoadingScreen, useStudyLoading, useStudyLoadingSnapshot } from "./StudyLoading";
const Scene = dynamic(() => import("./StudyScene").then((module) => module.StudyScene), { ssr: false });
const WEBGL_RENDERER_REVISION = "edge-modern-renderer-v5";
class SceneBoundary extends Component<{
    children: ReactNode;
    onError: (error: Error) => void;
}, {
    failed: boolean;
}> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch(error: Error) { this.props.onError(error); }
    render() { return this.state.failed ? null : this.props.children; }
}
function Experience() {
    const store = useStudyLoading();
    const snapshot = useStudyLoadingSnapshot();
    const [crashed, setCrashed] = useState(false);
    async function retry() {
        // A failed JS chunk or lost WebGL context needs a fresh renderer, not an asset retry.
        if (crashed || snapshot.phase === "module" || snapshot.phase === "unavailable") {
            window.location.reload();
            return;
        }
        const { retryStudyAssets } = await import("./StudyPreparation");
        retryStudyAssets(store);
    }
    return <>
    <StudyLoadingScreen onRetry={() => { void retry().catch(() => store.fail("Unable to retry. Please reload this page.")); }}/>
    <div className="study-experience" inert={snapshot.phase !== "ready"} aria-hidden={snapshot.phase !== "ready"}>
      <SceneBoundary onError={(error) => { setCrashed(true); store.fail("The study could not open. Please retry or explore the pages below.", /webgl|context/i.test(error.message)); }}>
        <Scene />
      </SceneBoundary>
    </div>
  </>;
}
export function StudyExperience() {
    // Changing renderer compatibility rules must also reset an unavailable
    // loading store during Fast Refresh in local preview.
    return <StudyLoadingProvider key={WEBGL_RENDERER_REVISION}><Experience /></StudyLoadingProvider>;
}
