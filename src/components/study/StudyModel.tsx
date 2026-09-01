"use client";

import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

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
};

type StudyModelProps = {
  config: StudyModelConfig;
  onLoaded?: () => void;
};

type StudyModelBoundaryProps = {
  asset: string;
  fallback: ReactNode;
  children: ReactNode;
};

type StudyModelBoundaryState = {
  hasError: boolean;
};

class StudyModelBoundary extends Component<
  StudyModelBoundaryProps,
  StudyModelBoundaryState
> {
  state: StudyModelBoundaryState = { hasError: false };

  static getDerivedStateFromError(): StudyModelBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[StudyModel] Could not load ${this.props.asset}`, error);
    }
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function LoadedStudyModel({ config, onLoaded }: StudyModelProps) {
  const { scene } = useGLTF(config.src);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    const rotation = config.rotation ?? [0, 0, 0];
    const offset = config.offset ?? [0, 0, 0];
    const anchor = config.anchor ?? "bottom";

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
      if (config.doubleSided) {
        child.material = Array.isArray(child.material)
          ? child.material.map((material) => {
              material.side = THREE.DoubleSide;
              material.needsUpdate = true;
              return material;
            })
          : (() => {
              child.material.side = THREE.DoubleSide;
              child.material.needsUpdate = true;
              return child.material;
            })();
      }
    });

    return clone;
  }, [config, scene]);

  useEffect(() => {
    onLoaded?.();
  }, [onLoaded]);

  return (
    <group position={config.position}>
      <primitive object={model} dispose={null} />
    </group>
  );
}

export function StudyModelSlot({
  config,
  fallback,
  onLoaded,
}: StudyModelProps & { fallback: ReactNode }) {
  if (!config.enabled) return fallback;

  return (
    <StudyModelBoundary
      key={config.src}
      asset={config.src}
      fallback={fallback}
    >
      <Suspense fallback={fallback}>
        <LoadedStudyModel config={config} onLoaded={onLoaded} />
      </Suspense>
    </StudyModelBoundary>
  );
}

export function preloadStudyModel(src: string) {
  useGLTF.preload(src);
}
