"use client";

import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useStudyLoading } from "./StudyLoading";
import { assetRequestUrl, isCriticalAsset } from "./studyLoadingState";
import { studyModelLoader } from "./studyLoaders";

export type StudyPoint = [number, number, number];

export type StudyModelConfig = {
  src: string;
  enabled: boolean;
  targetHeight: number;
  anchor?: "bottom" | "center" | "top";
  position?: StudyPoint;
  rotation?: StudyPoint;
  scale?: number | StudyPoint;
  offset?: StudyPoint;
  castShadow?: boolean;
  receiveShadow?: boolean;
  doubleSided?: boolean;
  materialBrightness?: number;
};

type StudyModelProps = {
  config: StudyModelConfig;
  onLoaded?: () => void;
};

type StudyModelBoundaryProps = {
  asset: string;
  fallback: ReactNode;
  children: ReactNode;
  onError?: () => void;
};

type StudyModelBoundaryState = {
  hasError: boolean;
};

export class StudyAssetBoundary extends Component<
  StudyModelBoundaryProps,
  StudyModelBoundaryState
> {
  state: StudyModelBoundaryState = { hasError: false };

  static getDerivedStateFromError(): StudyModelBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError?.();
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[StudyModel] Could not load ${this.props.asset}`, error);
    }
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function LoadedStudyModel({ config, onLoaded, attempt }: StudyModelProps & { attempt: number }) {
  const store = useStudyLoading();
  const { scene } = useGLTF(assetRequestUrl({ src: config.src, attempt }), false, true, studyModelLoader(store).configure);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    const rotation = config.rotation ?? [0, 0, 0];
    const offset = config.offset ?? [0, 0, 0];
    const anchor = config.anchor ?? "bottom";
    const brightness = config.materialBrightness ?? 1;
    const ownedMaterials = new Map<THREE.Material, THREE.Material>();

    clone.rotation.set(...rotation);
    clone.updateMatrixWorld(true);

    const initialBounds = new THREE.Box3().setFromObject(clone);
    const initialSize = initialBounds.getSize(new THREE.Vector3());
    const height = Math.max(initialSize.y, 0.0001);
    const fitScale = config.targetHeight / height;
    const scale =
      typeof config.scale === "number"
        ? [config.scale, config.scale, config.scale]
        : (config.scale ?? [1, 1, 1]);

    clone.scale.set(
      fitScale * scale[0],
      fitScale * scale[1],
      fitScale * scale[2],
    );
    clone.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(clone);
    const center = bounds.getCenter(new THREE.Vector3());
    const anchorY =
      anchor === "top"
        ? bounds.max.y
        : anchor === "center"
          ? center.y
          : bounds.min.y;

    clone.position.set(
      -center.x + offset[0],
      -anchorY + offset[1],
      -center.z + offset[2],
    );

    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = config.castShadow ?? true;
      child.receiveShadow = config.receiveShadow ?? true;
      child.frustumCulled = true;
      if (config.doubleSided || brightness !== 1) {
        const adjustMaterial = (source: THREE.Material) => {
          const existing = ownedMaterials.get(source);
          if (existing) return existing;
          // GLTF scene clones share materials: keep overrides local to this model.
          const material = source.clone();
          if (config.doubleSided) material.side = THREE.DoubleSide;
          if ("color" in material && material.color instanceof THREE.Color) {
            material.color.multiplyScalar(brightness);
          }
          ownedMaterials.set(source, material);
          return material;
        };
        child.material = Array.isArray(child.material)
          ? child.material.map(adjustMaterial)
          : adjustMaterial(child.material);
      }
    });

    return { scene: clone, materials: [...ownedMaterials.values()] };
  }, [config, scene]);

  useEffect(() => {
    return () => model.materials.forEach((material) => material.dispose());
  }, [model]);

  useEffect(() => {
    onLoaded?.();
  }, [onLoaded]);

  useEffect(() => {
    store.report(config.src, attempt, "ready");
  }, [store, config.src, attempt]);

  return (
    <group name={config.src} position={config.position}>
      <primitive object={model.scene} dispose={null} />
    </group>
  );
}

export function StudyModelSlot({
  config,
  fallback,
  onLoaded,
}: StudyModelProps & { fallback: ReactNode }) {
  const store = useStudyLoading();
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const entry = snapshot.entries[config.src];
  if (!config.enabled || !entry || entry.status === "skipped" || (!isCriticalAsset(entry) && (!snapshot.backgroundReady || snapshot.phase !== "ready"))) return null;

  return (
    <StudyAssetBoundary
      key={`${config.src}:${entry.attempt}`}
      asset={config.src}
      fallback={fallback}
      onError={() => store.report(config.src, entry.attempt, "error")}
    >
      <Suspense fallback={fallback}>
        <LoadedStudyModel config={config} onLoaded={onLoaded} attempt={entry.attempt} />
      </Suspense>
    </StudyAssetBoundary>
  );
}
