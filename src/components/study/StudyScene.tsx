"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  AdaptiveDpr,
  Float,
  Html,
  RoundedBox,
} from "@react-three/drei";
import * as THREE from "three";

const palette = {
  shell: "#f5e5e2",
  shellDark: "#82bac3",
  floorPink: "#f2c6d0",
  wall: "#fff7ef",
  cream: "#fff8e9",
  mint: "#badcca",
  blue: "#9bcfd7",
  deepBlue: "#6f9fae",
  yellow: "#f3d78f",
  coral: "#ea9b94",
  lilac: "#d7cae5",
  ink: "#40565a",
};

type Point = [number, number, number];

type InteractiveObjectProps = {
  position: Point;
  label: string;
  section: string;
  href: string;
  onEnter: (position: Point, href: string) => void;
  children: ReactNode;
  rotation?: Point;
  labelPosition?: Point;
};

function InteractiveObject({
  position,
  label,
  section,
  href,
  onEnter,
  children,
  rotation = [0, 0, 0],
  labelPosition = [0, 1, 0],
}: InteractiveObjectProps) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  useFrame((state, delta) => {
    if (!group.current) return;
    const targetScale = hovered ? 1.09 : 1;
    const scale = THREE.MathUtils.damp(
      group.current.scale.x,
      targetScale,
      9,
      delta,
    );
    group.current.scale.setScalar(scale);
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      rotation[1] + (hovered ? 0.08 : 0),
      7,
      delta,
    );
    group.current.position.y =
      position[1] +
      Math.sin(state.clock.elapsedTime * 1.4 + position[0]) * 0.025;
  });

  function stop(event: { stopPropagation: () => void }) {
    event.stopPropagation();
  }

  return (
    <group
      ref={group}
      position={position}
      rotation={rotation}
      onPointerEnter={(event) => {
        stop(event);
        setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onClick={(event) => {
        stop(event);
        onEnter(position, href);
      }}
    >
      {children}
      {hovered && (
        <Html
          center
          position={labelPosition}
          style={{ pointerEvents: "none" }}
        >
          <div className="object-tooltip">
            <span>{section}</span>
            {label} <b>↗</b>
          </div>
        </Html>
      )}
    </group>
  );
}

function CameraRig({
  focus,
  entering,
}: {
  focus: Point | null;
  entering: boolean;
}) {
  useFrame((state, delta) => {
    const pointerX = state.pointer.x * 0.08;
    const pointerY = state.pointer.y * 0.06;
    const overviewTarget = new THREE.Vector3(0, 1.68, -0.1);
    const target = focus ? new THREE.Vector3(...focus) : overviewTarget;
    const cameraOffset = focus ? 8.5 : 11;
    const destination = focus
      ? new THREE.Vector3(
          target.x + cameraOffset,
          target.y + cameraOffset,
          target.z + cameraOffset,
        )
      : new THREE.Vector3(
          target.x + cameraOffset + pointerX,
          target.y + cameraOffset + pointerY,
          target.z + cameraOffset,
        );

    state.camera.position.x = THREE.MathUtils.damp(
      state.camera.position.x,
      destination.x,
      entering ? 4.8 : 2.5,
      delta,
    );
    state.camera.position.y = THREE.MathUtils.damp(
      state.camera.position.y,
      destination.y,
      entering ? 4.8 : 2.5,
      delta,
    );
    state.camera.position.z = THREE.MathUtils.damp(
      state.camera.position.z,
      destination.z,
      entering ? 4.8 : 2.5,
      delta,
    );

    state.camera.lookAt(target);

    if (state.camera instanceof THREE.OrthographicCamera) {
      const fittedZoom = Math.min(
        state.size.width / 18,
        state.size.height / 17,
      );
      state.camera.zoom = THREE.MathUtils.damp(
        state.camera.zoom,
        fittedZoom * (focus ? 1.2 : 1),
        entering ? 4.8 : 3,
        delta,
      );
      state.camera.updateProjectionMatrix();
    }
  });

  return null;
}

function RoomShell() {
  return (
    <group>
      <RoundedBox
        args={[8.2, 0.64, 8.2]}
        position={[0, -2.4, -0.1]}
        radius={0.24}
        smoothness={8}
      >
        <meshStandardMaterial
          color={palette.floorPink}
          metalness={0}
          roughness={0.84}
        />
      </RoundedBox>
      <RoundedBox
        args={[8.2, 8.5, 0.5]}
        position={[0, 1.87, -3.95]}
        radius={0.22}
        smoothness={8}
        receiveShadow
      >
        <meshStandardMaterial
          color={palette.wall}
          metalness={0}
          roughness={0.9}
        />
      </RoundedBox>
      <RoundedBox
        args={[0.5, 8.5, 8.2]}
        position={[-3.85, 1.87, -0.1]}
        radius={0.22}
        smoothness={8}
        receiveShadow
      >
        <meshStandardMaterial
          color={palette.shell}
          metalness={0}
          roughness={0.88}
        />
      </RoundedBox>
    </group>
  );
}

function WindowAndCurtains() {
  return (
    <group position={[2.4, 1.55, -3.72]}>
      <RoundedBox args={[3.15, 2.45, 0.18]} radius={0.16}>
        <meshStandardMaterial color={palette.cream} roughness={0.7} />
      </RoundedBox>
      <mesh position={[0, 0, 0.11]}>
        <planeGeometry args={[2.76, 2.08]} />
        <meshBasicMaterial color="#c9edf0" />
      </mesh>
      <mesh position={[0, 0, 0.14]}>
        <boxGeometry args={[0.1, 2.1, 0.08]} />
        <meshStandardMaterial color={palette.cream} />
      </mesh>
      <mesh position={[0, 0, 0.14]}>
        <boxGeometry args={[2.78, 0.1, 0.08]} />
        <meshStandardMaterial color={palette.cream} />
      </mesh>
      <mesh position={[0, 0.95, 0.28]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.055, 0.055, 3.55, 16]} />
        <meshStandardMaterial color={palette.cream} />
      </mesh>
      <mesh position={[-1.17, 0.05, 0.25]} rotation={[0, 0, -0.07]}>
        <coneGeometry args={[0.72, 2.25, 20]} />
        <meshStandardMaterial color={palette.blue} roughness={0.8} />
      </mesh>
      <mesh position={[1.17, 0.05, 0.25]} rotation={[0, 0, 0.07]}>
        <coneGeometry args={[0.72, 2.25, 20]} />
        <meshStandardMaterial color={palette.blue} roughness={0.8} />
      </mesh>
      <mesh position={[-1.08, -0.2, 0.62]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.07, 12, 24]} />
        <meshStandardMaterial color={palette.coral} />
      </mesh>
      <mesh position={[1.08, -0.2, 0.62]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.07, 12, 24]} />
        <meshStandardMaterial color={palette.coral} />
      </mesh>
    </group>
  );
}

function Desk() {
  return (
    <group position={[2.2, -0.85, -1.85]}>
      <RoundedBox
        args={[4.15, 0.34, 1.55]}
        position={[0, 1.08, 0]}
        radius={0.14}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={palette.mint} roughness={0.72} />
      </RoundedBox>
      <RoundedBox
        args={[1.35, 2.25, 1.42]}
        position={[1.28, 0, 0]}
        radius={0.12}
        castShadow
      >
        <meshStandardMaterial color={palette.blue} roughness={0.76} />
      </RoundedBox>
      {[-0.55, 0, 0.55].map((y) => (
        <group key={y} position={[1.29, y, 0.73]}>
          <RoundedBox args={[1.08, 0.38, 0.09]} radius={0.07}>
            <meshStandardMaterial color="#a5dce0" roughness={0.74} />
          </RoundedBox>
          <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.075, 0.022, 8, 16]} />
            <meshStandardMaterial color={palette.deepBlue} />
          </mesh>
        </group>
      ))}
      {[-1.65, -0.8].map((x) => (
        <RoundedBox
          key={x}
          args={[0.28, 2.18, 1.25]}
          position={[x, -0.02, 0]}
          radius={0.1}
          castShadow
        >
          <meshStandardMaterial color={palette.mint} roughness={0.76} />
        </RoundedBox>
      ))}
    </group>
  );
}

function ChairAndTable() {
  return (
    <group>
      <group position={[-2.65, -1.1, 1.15]} rotation={[0, 0.22, 0]}>
        <RoundedBox
          args={[1.65, 1.5, 0.38]}
          position={[0, 0.95, 0.24]}
          radius={0.28}
          castShadow
        >
          <meshStandardMaterial color={palette.blue} roughness={0.84} />
        </RoundedBox>
        <RoundedBox
          args={[1.62, 0.33, 1.45]}
          position={[0, 0.15, 0]}
          radius={0.17}
          castShadow
        >
          <meshStandardMaterial color={palette.cream} roughness={0.8} />
        </RoundedBox>
        {[-0.58, 0.58].flatMap((x) =>
          [-0.46, 0.46].map((z) => (
            <mesh key={`${x}-${z}`} position={[x, -0.78, z]}>
              <cylinderGeometry args={[0.08, 0.11, 1.55, 12]} />
              <meshStandardMaterial color={palette.shellDark} />
            </mesh>
          )),
        )}
      </group>
      <group position={[-0.6, -1.15, 1.6]}>
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.45, 1.52, 0.28, 40]} />
          <meshStandardMaterial color={palette.cream} roughness={0.76} />
        </mesh>
        <mesh position={[0, -0.8, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.38, 1.85, 24]} />
          <meshStandardMaterial color={palette.mint} />
        </mesh>
        <mesh position={[0, -1.74, 0]} castShadow>
          <cylinderGeometry args={[0.85, 0.95, 0.18, 32]} />
          <meshStandardMaterial color={palette.mint} />
        </mesh>
      </group>
    </group>
  );
}

function Decor() {
  return (
    <group>
      <Float speed={1.1} rotationIntensity={0.05} floatIntensity={0.08}>
        <group position={[3.75, 1.08, -2.32]}>
          <mesh position={[0, 0.46, 0]}>
            <cylinderGeometry args={[0.11, 0.25, 0.92, 20]} />
            <meshStandardMaterial color="#d2a45e" metalness={0.25} />
          </mesh>
          <mesh position={[0, 0.95, 0]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.58, 0.62, 24]} />
            <meshStandardMaterial color={palette.cream} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.03, 0]}>
            <cylinderGeometry args={[0.42, 0.5, 0.12, 24]} />
            <meshStandardMaterial color="#d2a45e" metalness={0.25} />
          </mesh>
        </group>
      </Float>

      <group position={[-3.72, -0.95, -2.35]}>
        <mesh position={[0, 0.95, 0]}>
          <sphereGeometry args={[0.55, 24, 18]} />
          <meshStandardMaterial color={palette.mint} />
        </mesh>
        <mesh position={[0, 0.48, 0]}>
          <cylinderGeometry args={[0.44, 0.58, 0.74, 24]} />
          <meshStandardMaterial color={palette.mint} />
        </mesh>
      </group>

      <group position={[-0.9, 0.22, -2.95]}>
        <mesh>
          <cylinderGeometry args={[0.72, 0.72, 0.14, 32]} />
          <meshStandardMaterial color={palette.blue} />
        </mesh>
        <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.62, 0.06, 12, 32]} />
          <meshStandardMaterial color={palette.cream} />
        </mesh>
        {[0, 1, 2, 3, 4].map((index) => (
          <RoundedBox
            key={index}
            args={[0.12, 1.02, 0.08]}
            position={[0, 0, 0.2]}
            rotation={[0, 0, (index * Math.PI) / 2.5]}
            radius={0.04}
          >
            <meshStandardMaterial color={palette.deepBlue} />
          </RoundedBox>
        ))}
        <mesh position={[0, 0, 0.28]}>
          <sphereGeometry args={[0.15, 18, 14]} />
          <meshStandardMaterial color={palette.yellow} />
        </mesh>
      </group>

      <group position={[4.1, -1.35, 1.1]}>
        <RoundedBox args={[0.78, 1.9, 0.72]} radius={0.34}>
          <meshStandardMaterial color={palette.cream} />
        </RoundedBox>
        <mesh position={[0, 0.15, 0.38]}>
          <sphereGeometry args={[0.28, 20, 16]} />
          <meshStandardMaterial
            color="#77d9df"
            emissive="#54ccd6"
            emissiveIntensity={0.35}
          />
        </mesh>
        <mesh position={[0, -0.72, 0]}>
          <cylinderGeometry args={[0.34, 0.42, 0.28, 24]} />
          <meshStandardMaterial color={palette.blue} />
        </mesh>
      </group>

      {[
        [-4.1, 2.6, -3.63],
        [-3.4, 1.55, -3.63],
        [4.15, 2.8, -3.63],
      ].map((position, index) => (
        <mesh key={index} position={position as Point}>
          <octahedronGeometry args={[0.17, 0]} />
          <meshStandardMaterial
            color={index === 1 ? palette.yellow : palette.blue}
          />
        </mesh>
      ))}
    </group>
  );
}

type ObjectSetProps = {
  onEnter: (position: Point, href: string) => void;
};

function AboutPortrait({ onEnter }: ObjectSetProps) {
  return (
    <InteractiveObject
      position={[-2.35, 2.35, -3.55]}
      label="Meet me"
      section="01 · About"
      href="/about"
      onEnter={onEnter}
      labelPosition={[0, 0.9, 0]}
    >
      <RoundedBox args={[1.05, 1.28, 0.18]} radius={0.12} castShadow>
        <meshStandardMaterial color={palette.mint} roughness={0.7} />
      </RoundedBox>
      <mesh position={[0, 0.08, 0.14]}>
        <planeGeometry args={[0.76, 0.96]} />
        <meshStandardMaterial color={palette.cream} />
      </mesh>
      <mesh position={[0, 0.2, 0.23]}>
        <sphereGeometry args={[0.22, 20, 16]} />
        <meshStandardMaterial color={palette.coral} />
      </mesh>
      <mesh position={[0, -0.22, 0.22]}>
        <capsuleGeometry args={[0.25, 0.2, 6, 12]} />
        <meshStandardMaterial color={palette.deepBlue} />
      </mesh>
    </InteractiveObject>
  );
}

function ProjectComputer({ onEnter }: ObjectSetProps) {
  return (
    <InteractiveObject
      position={[1.65, 0.68, -1.72]}
      label="View projects"
      section="02 · Projects"
      href="/projects"
      onEnter={onEnter}
      labelPosition={[0, 1.02, 0]}
    >
      <RoundedBox args={[1.65, 1.03, 0.18]} radius={0.12} castShadow>
        <meshStandardMaterial color={palette.deepBlue} roughness={0.58} />
      </RoundedBox>
      <mesh position={[0, 0, 0.105]}>
        <planeGeometry args={[1.38, 0.76]} />
        <meshStandardMaterial
          color="#d6f5f0"
          emissive="#bcefe8"
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh position={[0, -0.78, 0]}>
        <cylinderGeometry args={[0.08, 0.16, 0.58, 16]} />
        <meshStandardMaterial color={palette.deepBlue} />
      </mesh>
      <RoundedBox
        args={[0.75, 0.1, 0.46]}
        position={[0, -1.06, 0.05]}
        radius={0.05}
      >
        <meshStandardMaterial color={palette.deepBlue} />
      </RoundedBox>
    </InteractiveObject>
  );
}

function EducationBooks({ onEnter }: ObjectSetProps) {
  const colors = [
    palette.coral,
    palette.yellow,
    palette.deepBlue,
    palette.lilac,
  ];
  return (
    <InteractiveObject
      position={[-3.55, 0.8, -3.28]}
      label="Open education"
      section="03 · Education"
      href="/education"
      onEnter={onEnter}
      rotation={[0, 0.08, 0]}
      labelPosition={[0, 1.05, 0]}
    >
      {colors.map((color, index) => (
        <RoundedBox
          key={color}
          args={[0.3, 1.25 - index * 0.08, 0.72]}
          position={[-0.52 + index * 0.35, 0, 0]}
          rotation={[0, 0, index === 3 ? -0.12 : 0]}
          radius={0.05}
          castShadow
        >
          <meshStandardMaterial color={color} roughness={0.78} />
        </RoundedBox>
      ))}
    </InteractiveObject>
  );
}

function ResearchNotebook({ onEnter }: ObjectSetProps) {
  return (
    <InteractiveObject
      position={[2.55, 0.47, -0.45]}
      label="Read research"
      section="04 · Research"
      href="/research"
      onEnter={onEnter}
      rotation={[-0.08, 0.13, -0.04]}
      labelPosition={[0, 0.62, 0]}
    >
      <RoundedBox args={[1.18, 0.12, 0.84]} radius={0.08} castShadow>
        <meshStandardMaterial color={palette.coral} roughness={0.76} />
      </RoundedBox>
      <RoundedBox
        args={[1.05, 0.06, 0.72]}
        position={[0, 0.09, 0]}
        radius={0.05}
      >
        <meshStandardMaterial color={palette.cream} />
      </RoundedBox>
      <mesh position={[-0.42, 0.17, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.055, 0.018, 8, 14]} />
        <meshStandardMaterial color={palette.deepBlue} />
      </mesh>
    </InteractiveObject>
  );
}

function ExperienceCalendar({ onEnter }: ObjectSetProps) {
  return (
    <InteractiveObject
      position={[-0.45, 2.08, -3.55]}
      label="View experience"
      section="05 · Experience"
      href="/experience"
      onEnter={onEnter}
      labelPosition={[0, 0.92, 0]}
    >
      <RoundedBox args={[1, 1.2, 0.17]} radius={0.1} castShadow>
        <meshStandardMaterial color={palette.cream} roughness={0.75} />
      </RoundedBox>
      <RoundedBox
        args={[1.01, 0.3, 0.19]}
        position={[0, 0.45, 0.01]}
        radius={0.08}
      >
        <meshStandardMaterial color={palette.coral} />
      </RoundedBox>
      <mesh position={[0, -0.1, 0.13]}>
        <circleGeometry args={[0.24, 24]} />
        <meshStandardMaterial color={palette.yellow} />
      </mesh>
      {[0.06, 0.24].map((x) => (
        <mesh key={x} position={[x - 0.15, 0.69, 0.02]}>
          <torusGeometry args={[0.055, 0.019, 8, 14]} />
          <meshStandardMaterial color={palette.deepBlue} />
        </mesh>
      ))}
    </InteractiveObject>
  );
}

function PortfolioCamera({ onEnter }: ObjectSetProps) {
  return (
    <InteractiveObject
      position={[-0.65, -0.72, 1.6]}
      label="Browse portfolio"
      section="06 · Portfolio"
      href="/portfolio"
      onEnter={onEnter}
      rotation={[0, -0.15, 0]}
      labelPosition={[0, 0.72, 0]}
    >
      <RoundedBox args={[1.15, 0.74, 0.5]} radius={0.15} castShadow>
        <meshStandardMaterial color={palette.coral} roughness={0.68} />
      </RoundedBox>
      <RoundedBox
        args={[0.45, 0.18, 0.32]}
        position={[-0.25, 0.43, 0]}
        radius={0.06}
      >
        <meshStandardMaterial color={palette.coral} />
      </RoundedBox>
      <mesh position={[0.15, 0, 0.33]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.27, 0.34, 0.18, 24]} />
        <meshStandardMaterial color={palette.deepBlue} metalness={0.1} />
      </mesh>
      <mesh position={[0.15, 0, 0.44]}>
        <circleGeometry args={[0.15, 24]} />
        <meshStandardMaterial
          color="#b9eff0"
          metalness={0.2}
          roughness={0.25}
        />
      </mesh>
      <mesh position={[0.43, 0.25, 0.28]}>
        <sphereGeometry args={[0.07, 12, 10]} />
        <meshStandardMaterial color={palette.yellow} />
      </mesh>
    </InteractiveObject>
  );
}

function StudyWorld({
  focus,
  entering,
  onEnter,
}: {
  focus: Point | null;
  entering: boolean;
  onEnter: (position: Point, href: string) => void;
}) {
  return (
    <>
      <color attach="background" args={["#ffffff"]} />
      <fog attach="fog" args={["#fffaf7", 27, 48]} />
      <ambientLight intensity={0.82} />
      <hemisphereLight args={["#fff9f2", "#e8c9cd", 0.72]} />
      <directionalLight
        castShadow
        color="#fff4e4"
        intensity={1.85}
        position={[-8, 12, 7]}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-bottom={-7}
        shadow-camera-far={35}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-bias={-0.00015}
        shadow-normalBias={0.035}
        shadow-radius={4}
      />
      <pointLight
        color="#ffe4d1"
        decay={2}
        distance={18}
        intensity={1.2}
        position={[-4.5, 6.5, 5]}
      />

      <group position={[0, 0, 0]}>
        <RoomShell />
        <WindowAndCurtains />
        <Desk />
        <ChairAndTable />
        <Decor />
        <AboutPortrait onEnter={onEnter} />
        <ProjectComputer onEnter={onEnter} />
        <EducationBooks onEnter={onEnter} />
        <ResearchNotebook onEnter={onEnter} />
        <ExperienceCalendar onEnter={onEnter} />
        <PortfolioCamera onEnter={onEnter} />
      </group>

      <CameraRig focus={focus} entering={entering} />
      <AdaptiveDpr pixelated />
    </>
  );
}

export function StudyScene() {
  const router = useRouter();
  const [focus, setFocus] = useState<Point | null>(null);
  const [entering, setEntering] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  function enterSection(position: Point, href: string) {
    if (entering) return;
    if (reducedMotion) {
      router.push(href);
      return;
    }
    setFocus(position);
    setEntering(true);
    window.setTimeout(() => router.push(href), 720);
  }

  return (
    <div className={`study-canvas ${entering ? "is-entering" : ""}`}>
      <Canvas
        orthographic
        shadows
        dpr={[1, 1.6]}
        frameloop={reducedMotion ? "demand" : "always"}
        camera={{
          position: [11, 12.68, 10.9],
          zoom: 30,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        fallback={
          <div className="webgl-fallback">
            The interactive room is unavailable. Use the navigation links below.
          </div>
        }
      >
        <StudyWorld focus={focus} entering={entering} onEnter={enterSection} />
      </Canvas>
    </div>
  );
}
