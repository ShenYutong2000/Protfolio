"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  createDemoObjectModel,
  type ObjectModelFactory,
} from "@/components/image3d/createDemoObjectModel";

function GeneratedObject({ factory }: { factory: ObjectModelFactory }) {
  const group = useRef<THREE.Group>(null);
  const model = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const parent = group.current;
    const instance = factory({ seed: 7 });
    model.current = instance;
    parent?.add(instance);
    return () => {
      parent?.remove(instance);
      instance.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((item) => item.dispose());
        } else {
          child.material.dispose();
        }
      });
      model.current = null;
    };
  }, [factory]);

  useFrame(({ clock }) => {
    const instance = model.current;
    if (!instance) return;
    instance.rotation.y = clock.elapsedTime * 0.24;
    const shutter = instance.getObjectByName("shutter");
    if (shutter) shutter.rotation.y = Math.sin(clock.elapsedTime * 1.7) * 0.2;
  });

  return <group ref={group} />;
}

function ReferencePreview({ source }: { source: string | null }) {
  return (
    <div className="image3d-reference">
      {source ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={source} alt="Selected reconstruction reference" />
      ) : (
        <div className="image3d-reference-placeholder">
          <span>REFERENCE</span>
          <strong>Drop one clear object image here</strong>
          <small>The current preview uses the camera factory as a contract test.</small>
        </div>
      )}
    </div>
  );
}

export function ImageTo3DLab() {
  const [reference, setReference] = useState<string | null>(null);
  const [fileName, setFileName] = useState("No image selected");

  useEffect(() => {
    return () => {
      if (reference) URL.revokeObjectURL(reference);
    };
  }, [reference]);

  function handleReferenceChange(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    setReference(URL.createObjectURL(file));
  }

  return (
    <main className="image3d-page">
      <div className="section-topline">
        <Link className="back-link" href="/">
          ← Return to the study
        </Link>
        <span>Lab / image-to-3d</span>
      </div>

      <section className="image3d-hero">
        <div>
          <p className="eyebrow">Procedural reconstruction lab</p>
          <h1>From a reference image to a living object.</h1>
          <p>
            This page is the runtime side of the img2threejs workflow: a generated
            TypeScript factory becomes an explodable, clickable Three.js object.
          </p>
        </div>
        <div className="image3d-status-card">
          <span>CONTRACT STATUS</span>
          <strong>Viewer connected</strong>
          <p>THREE.Group · named pivots · sockets · colliders</p>
        </div>
      </section>

      <section className="image3d-workbench" aria-label="Image to 3D workbench">
        <div className="image3d-input-column">
          <ReferencePreview source={reference} />
          <label className="image3d-upload">
            <span>Choose reference image</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => handleReferenceChange(event.target.files?.[0])}
            />
          </label>
          <p className="image3d-file-name">{fileName}</p>
          <p className="image3d-note">
            The browser preview does not run model generation. Use the commands below
            to produce a factory, then replace the demo factory in this page.
          </p>
        </div>

        <div className="image3d-viewer">
          <Canvas
            shadows
            camera={{ position: [3.4, 2.5, 4.1], fov: 36 }}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          >
            <color attach="background" args={["#d9f1ed"]} />
            <ambientLight intensity={1.4} />
            <directionalLight
              castShadow
              color="#fff4e4"
              intensity={3.1}
              position={[-3, 5, 4]}
              shadow-mapSize={[1024, 1024]}
            />
            <pointLight color="#f3bfd2" intensity={20} distance={8} position={[3, 2, 2]} />
            <GeneratedObject factory={createDemoObjectModel} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.72, 0]} receiveShadow>
              <circleGeometry args={[2.7, 48]} />
              <meshStandardMaterial color="#f2c6d0" roughness={0.9} />
            </mesh>
            <OrbitControls enablePan={false} minDistance={2.8} maxDistance={6.5} />
          </Canvas>
          <span className="image3d-viewer-label">DEMO FACTORY · ORBIT TO INSPECT</span>
        </div>
      </section>

      <section className="image3d-pipeline">
        <div>
          <p className="eyebrow">Local pipeline</p>
          <h2>The generated asset stays readable and versionable.</h2>
        </div>
        <ol>
          <li><span>01</span><strong>Intake</strong><p>Probe the image and assess suitability, object class, complexity, and detail inventory.</p></li>
          <li><span>02</span><strong>Spec</strong><p>Author and strictly validate an ObjectSculptSpec before any code is generated.</p></li>
          <li><span>03</span><strong>Build</strong><p>Generate one locked pass at a time: blockout → structure → form → material → interaction.</p></li>
          <li><span>04</span><strong>Review</strong><p>Render, compare side by side, run deterministic gates, then accept or refine the pass.</p></li>
        </ol>
      </section>
    </main>
  );
}
