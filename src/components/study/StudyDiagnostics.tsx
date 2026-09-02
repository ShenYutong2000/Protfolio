"use client";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { studyModelConfigs } from "./studyModels";
// Opt-in local measurements, never a dependency of the loading screen.
export function StudyDiagnostics() {
    const state = useRef({ enabled: false, done: false, frames: 0, longTasks: 0 });
    useEffect(() => {
        state.current.enabled = new URLSearchParams(location.search).has("study-diagnostics");
        if (!state.current.enabled)
            return;
        const current = state.current;
        const observer = new PerformanceObserver((list) => {
            current.longTasks += list.getEntries().reduce((sum, entry) => sum + entry.duration, 0);
        });
        observer.observe({ type: "longtask", buffered: true });
        return () => {
            observer.disconnect();
            document.getElementById("study-diagnostics")?.remove();
        };
    }, []);
    useFrame(({ scene, gl }) => {
        const current = state.current;
        if (!current.enabled || current.done)
            return;
        const expected = Object.values(studyModelConfigs).filter((config) => config.enabled);
        if (!expected.every((config) => scene.getObjectByName(config.src)))
            return;
        if (++current.frames < 3)
            return;
        current.done = true;
        let meshes = 0;
        let hiddenMeshes = 0;
        const geometries = new Set<THREE.BufferGeometry>();
        const materials = new Set<THREE.Material>();
        scene.traverse((node) => {
            if (!(node instanceof THREE.Mesh))
                return;
            meshes++;
            geometries.add(node.geometry);
            (Array.isArray(node.material) ? node.material : [node.material]).forEach((m) => materials.add(m));
            let parent: THREE.Object3D | null = node;
            while (parent) {
                if (!parent.visible) {
                    hiddenMeshes++;
                    break;
                }
                parent = parent.parent;
            }
        });
        const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
        const assets = resources.filter((r) => r.name.includes("/models/study/") || r.name.includes("/assets/study-"));
        const output = document.createElement("output");
        output.id = "study-diagnostics";
        output.hidden = true;
        output.textContent = JSON.stringify({
            preparedMs: Math.round(performance.now()), meshes, hiddenMeshes,
            geometries: geometries.size, materials: materials.size,
            gpuGeometries: gl.info.memory.geometries, gpuTextures: gl.info.memory.textures,
            longTaskMs: Math.round(current.longTasks), assetRequests: assets.length,
            assetBytes: assets.reduce((sum, a) => sum + a.transferSize, 0),
            lastAssetMs: Math.round(Math.max(0, ...assets.map((a) => a.responseEnd))),
        });
        document.body.append(output);
    });
    return null;
}
