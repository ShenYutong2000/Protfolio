"use client";
import { Suspense, useEffect } from "react";
import { addAfterEffect, useThree } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import { StudyAssetBoundary } from "./StudyModel";
import { useStudyLoading, useStudyLoadingSnapshot } from "./StudyLoading";
import { assetRequestUrl, loadingSummary, type AssetEntry, type StudyLoadingStore } from "./studyLoadingState";
import { studyModelLoader } from "./studyLoaders";
export function preloadStudyAssets(store: StudyLoadingStore) {
    Object.values(store.getSnapshot().entries).forEach((entry) => {
        if (entry.status !== "pending")
            return;
        if (entry.kind === "model")
            useGLTF.preload(assetRequestUrl(entry), false, true, studyModelLoader(store).configure);
        else
            useTexture.preload(assetRequestUrl(entry));
    });
}
export function retryStudyAssets(store: StudyLoadingStore) {
    // Release stalled GLB connections before queuing a new attempt. This manager
    // belongs to this study only; other pages' requests are not interrupted.
    studyModelLoader(store).manager.abort();
    Object.values(store.getSnapshot().entries).forEach((entry) => {
        if (entry.status !== "pending" && entry.status !== "error")
            return;
        if (entry.kind === "model")
            useGLTF.clear(assetRequestUrl(entry));
        else
            useTexture.clear(assetRequestUrl(entry));
    });
    store.retry();
    preloadStudyAssets(store);
}
function LoadedTexture({ entry }: {
    entry: AssetEntry;
}) {
    const store = useStudyLoading();
    useTexture(assetRequestUrl(entry));
    useEffect(() => { store.report(entry.src, entry.attempt, "ready"); }, [store, entry.src, entry.attempt]);
    return null;
}
export function StudyTexturePreparation() {
    const store = useStudyLoading();
    const { entries } = useStudyLoadingSnapshot();
    return <>{Object.values(entries).filter((entry) => entry.kind === "texture").map((entry) => (<StudyAssetBoundary key={`${entry.src}:${entry.attempt}`} asset={entry.src} fallback={null} onError={() => store.report(entry.src, entry.attempt, "error")}>
      <Suspense fallback={null}><LoadedTexture entry={entry}/></Suspense>
    </StudyAssetBoundary>))}</>;
}
export function StudyScenePreparation() {
    const store = useStudyLoading();
    const { run, shellReady, ...rest } = useStudyLoadingSnapshot();
    const settled = loadingSummary({ ...rest, run, shellReady }).settled;
    const { gl, scene, camera, invalidate, setEvents } = useThree();
    useEffect(() => { setEvents({ enabled: rest.phase === "ready" }); }, [setEvents, rest.phase]);
    useEffect(() => {
        const lost = () => store.fail("The graphics context was lost. Please reload or explore the pages below.", true);
        gl.domElement.addEventListener("webglcontextlost", lost);
        return () => gl.domElement.removeEventListener("webglcontextlost", lost);
    }, [gl, store]);
    useEffect(() => {
        if (!settled || !shellReady)
            return;
        let cancelled = false;
        let stopAfter: (() => void) | undefined;
        let frame = 0;
        store.advance("preparing", run);
        // Let React commit the rug lift and the overview camera fit before compilation.
        frame = requestAnimationFrame(() => {
            scene.updateMatrixWorld(true);
            gl.compileAsync(scene, camera).then(() => {
                if (cancelled)
                    return;
                store.advance("compiled", run);
                const renderedFrame = gl.info.render.frame;
                stopAfter = addAfterEffect(() => {
                    if (cancelled || gl.info.render.frame <= renderedFrame)
                        return;
                    stopAfter?.();
                    frame = requestAnimationFrame(() => {
                        if (!cancelled) {
                            performance.mark("study:first-ready-frame");
                            store.advance("ready", run);
                        }
                    });
                });
                invalidate();
            }).catch(() => {
                if (!cancelled)
                    store.fail("The room could not be prepared. Please retry or explore the pages below.");
            });
        });
        invalidate();
        return () => { cancelled = true; cancelAnimationFrame(frame); stopAfter?.(); };
    }, [store, settled, shellReady, run, gl, scene, camera, invalidate]);
    return null;
}
