"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
  children: ReactNode | ((hovered: boolean) => ReactNode);
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
      {typeof children === "function" ? children(hovered) : children}
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

function useClayTexture() {
  const texture = useMemo(() => {
    const size = 64;
    const data = new Uint8Array(size * size * 4);

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const index = (y * size + x) * 4;
        const random =
          Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233) * 43758.5453;
        const grain = random - Math.floor(random);
        const softWave =
          Math.sin(x * 0.34) * 3.5 + Math.cos(y * 0.27) * 3.5;
        const value = THREE.MathUtils.clamp(
          Math.round(126 + softWave + (grain - 0.5) * 12),
          0,
          255,
        );

        data[index] = value;
        data[index + 1] = value;
        data[index + 2] = value;
        data[index + 3] = 255;
      }
    }

    const map = new THREE.DataTexture(
      data,
      size,
      size,
      THREE.RGBAFormat,
    );
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(5, 5);
    map.minFilter = THREE.LinearFilter;
    map.magFilter = THREE.LinearFilter;
    map.needsUpdate = true;
    return map;
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function SoftClayMaterial({
  color,
  texture,
  roughness = 0.76,
  bumpScale = 0.014,
  clearcoat = 0.08,
  clearcoatRoughness = 0.82,
  specularIntensity = 0.36,
}: {
  color: THREE.ColorRepresentation;
  texture: THREE.Texture;
  roughness?: number;
  bumpScale?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  specularIntensity?: number;
}) {
  return (
    <meshPhysicalMaterial
      bumpMap={texture}
      bumpScale={bumpScale}
      clearcoat={clearcoat}
      clearcoatRoughness={clearcoatRoughness}
      color={color}
      ior={1.42}
      metalness={0}
      roughness={roughness}
      sheen={0.14}
      sheenColor="#fff1ea"
      specularIntensity={specularIntensity}
    />
  );
}

function RoomShell() {
  const clayTexture = useClayTexture();

  return (
    <group>
      <RoundedBox
        args={[8.35, 0.7, 8.35]}
        position={[0, -2.36, -0.1]}
        radius={0.26}
        smoothness={10}
        receiveShadow
      >
        <SoftClayMaterial
          color="#efbdc7"
          texture={clayTexture}
          roughness={0.68}
          bumpScale={0.012}
          clearcoat={0.16}
          clearcoatRoughness={0.7}
          specularIntensity={0.44}
        />
      </RoundedBox>
      <RoundedBox
        args={[8.2, 8.5, 0.5]}
        position={[0, 1.87, -3.95]}
        radius={0.26}
        smoothness={10}
        receiveShadow
      >
        <SoftClayMaterial
          color={palette.wall}
          texture={clayTexture}
          roughness={0.82}
          bumpScale={0.018}
        />
      </RoundedBox>
      <RoundedBox
        args={[0.5, 8.5, 8.2]}
        position={[-3.85, 1.87, -0.1]}
        radius={0.26}
        smoothness={10}
        receiveShadow
      >
        <SoftClayMaterial
          color={palette.shell}
          texture={clayTexture}
          roughness={0.8}
          bumpScale={0.018}
        />
      </RoundedBox>
      <RoundedBox
        args={[8.35, 0.38, 0.42]}
        position={[0, 5.96, -3.62]}
        radius={0.17}
        smoothness={10}
        castShadow
      >
        <SoftClayMaterial
          color="#eea0b3"
          texture={clayTexture}
          roughness={0.64}
          bumpScale={0.012}
          clearcoat={0.18}
          clearcoatRoughness={0.66}
          specularIntensity={0.46}
        />
      </RoundedBox>
      <RoundedBox
        args={[0.42, 0.38, 8.28]}
        position={[-3.61, 5.96, -0.1]}
        radius={0.17}
        smoothness={10}
        castShadow
      >
        <SoftClayMaterial
          color="#eea0b3"
          texture={clayTexture}
          roughness={0.64}
          bumpScale={0.012}
          clearcoat={0.18}
          clearcoatRoughness={0.66}
          specularIntensity={0.46}
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
      {[-0.55, 0].map((y) => (
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

function AnimatedFileFolder({ pulled }: { pulled: boolean }) {
  const folder = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!folder.current) return;
    folder.current.position.y = THREE.MathUtils.damp(
      folder.current.position.y,
      pulled ? 0.7 : 0.43,
      8,
      delta,
    );
    folder.current.position.z = THREE.MathUtils.damp(
      folder.current.position.z,
      pulled ? 0.82 : 0.55,
      8,
      delta,
    );
    folder.current.rotation.x = THREE.MathUtils.damp(
      folder.current.rotation.x,
      pulled ? -0.07 : -0.18,
      8,
      delta,
    );
  });

  return (
    <group
      ref={folder}
      position={[0, 0.43, 0.55]}
      rotation={[-0.18, 0, -0.035]}
    >
      <RoundedBox args={[0.84, 0.64, 0.07]} radius={0.055} castShadow>
        <meshStandardMaterial color={palette.yellow} roughness={0.82} />
      </RoundedBox>
      <RoundedBox
        args={[0.34, 0.14, 0.075]}
        position={[-0.2, 0.36, 0]}
        radius={0.04}
      >
        <meshStandardMaterial color={palette.yellow} roughness={0.82} />
      </RoundedBox>
      <RoundedBox
        args={[0.72, 0.48, 0.035]}
        position={[0, 0.06, 0.055]}
        radius={0.035}
      >
        <meshStandardMaterial color={palette.cream} roughness={0.9} />
      </RoundedBox>
      <RoundedBox
        args={[0.84, 0.48, 0.065]}
        position={[0, -0.09, 0.1]}
        radius={0.05}
      >
        <meshStandardMaterial color="#e6bb66" roughness={0.82} />
      </RoundedBox>
      <RoundedBox
        args={[0.48, 0.18, 0.025]}
        position={[0.04, -0.08, 0.145]}
        radius={0.025}
      >
        <meshStandardMaterial color={palette.cream} roughness={0.88} />
      </RoundedBox>
      {[-0.04, 0.04].map((y, index) => (
        <RoundedBox
          key={y}
          args={[index === 0 ? 0.3 : 0.22, 0.018, 0.012]}
          position={[-0.01, y - 0.08, 0.164]}
          radius={0.008}
        >
          <meshStandardMaterial color={palette.deepBlue} roughness={0.72} />
        </RoundedBox>
      ))}
    </group>
  );
}

function ExperienceFileDrawer({ onEnter }: ObjectSetProps) {
  return (
    <InteractiveObject
      position={[3.49, -0.3, -1.11]}
      label="View experience"
      section="05 · Experience"
      href="/experience"
      onEnter={onEnter}
      labelPosition={[0, 1.4, 0.74]}
    >
      {(hovered) => (
        <>
          <RoundedBox
            args={[1.08, 0.1, 1.02]}
            position={[0, -0.13, 0.48]}
            radius={0.045}
            castShadow
          >
            <meshStandardMaterial color="#8fc7cf" roughness={0.8} />
          </RoundedBox>
          {[-0.49, 0.49].map((x) => (
            <RoundedBox
              key={x}
              args={[0.09, 0.34, 1.02]}
              position={[x, 0, 0.48]}
              radius={0.035}
              castShadow
            >
              <meshStandardMaterial color={palette.blue} roughness={0.78} />
            </RoundedBox>
          ))}
          <RoundedBox
            args={[1.09, 0.38, 0.11]}
            position={[0, 0, 0.98]}
            radius={0.07}
            castShadow
          >
            <meshStandardMaterial color="#a5dce0" roughness={0.74} />
          </RoundedBox>
          <mesh position={[0, 0, 1.055]}>
            <torusGeometry args={[0.075, 0.022, 8, 16]} />
            <meshStandardMaterial color={palette.deepBlue} />
          </mesh>
          <AnimatedFileFolder pulled={hovered} />
        </>
      )}
    </InteractiveObject>
  );
}

function PortfolioSketchbook({ onEnter }: ObjectSetProps) {
  return (
    <InteractiveObject
      position={[-0.65, -0.68, 1.6]}
      label="Browse portfolio"
      section="06 · Portfolio"
      href="/portfolio"
      onEnter={onEnter}
      rotation={[0, -0.15, -0.035]}
      labelPosition={[0, 0.68, 0]}
    >
      <RoundedBox args={[1.34, 0.1, 0.94]} radius={0.08} castShadow>
        <meshStandardMaterial color={palette.deepBlue} roughness={0.76} />
      </RoundedBox>
      <RoundedBox
        args={[1.22, 0.07, 0.84]}
        position={[0.015, 0.09, 0]}
        radius={0.055}
      >
        <meshStandardMaterial color={palette.cream} roughness={0.92} />
      </RoundedBox>
      {[-0.3, -0.15, 0, 0.15, 0.3].map((z) => (
        <mesh key={z} position={[-0.58, 0.15, z]}>
          <torusGeometry args={[0.054, 0.015, 8, 16]} />
          <meshStandardMaterial color={palette.coral} metalness={0.12} />
        </mesh>
      ))}
      <mesh
        position={[-0.05, 0.142, -0.08]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[0.15, 0.018, 8, 24]} />
        <meshStandardMaterial color={palette.deepBlue} roughness={0.7} />
      </mesh>
      {[
        [0.18, 0.22, 0.36],
        [0.07, -0.29, -0.28],
        [0.05, -0.25, 0.25],
      ].map(([width, x, z], index) => (
        <RoundedBox
          key={`${x}-${z}`}
          args={[width, 0.018, 0.018]}
          position={[x, 0.143, z]}
          rotation={[0, index === 0 ? -0.25 : 0.12, 0]}
          radius={0.008}
        >
          <meshStandardMaterial
            color={index === 0 ? palette.coral : palette.deepBlue}
          />
        </RoundedBox>
      ))}
      <group position={[0.18, 0.2, 0.34]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.026, 0.026, 0.72, 12]} />
          <meshStandardMaterial color={palette.yellow} roughness={0.72} />
        </mesh>
        <mesh position={[0, -0.4, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.027, 0.08, 12]} />
          <meshStandardMaterial color="#d2a45e" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.39, 0]}>
          <cylinderGeometry args={[0.029, 0.029, 0.06, 12]} />
          <meshStandardMaterial color={palette.coral} />
        </mesh>
      </group>
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
      <ambientLight intensity={0.56} />
      <hemisphereLight args={["#fff8ee", "#dcaeb4", 0.52]} />
      <directionalLight
        color="#fff0d9"
        intensity={2.15}
        position={[-8, 12, 7]}
      />
      <pointLight
        color="#ffd8bd"
        decay={2}
        distance={18}
        intensity={0.82}
        position={[-4.5, 6.5, 5]}
      />
      <pointLight
        color="#f5c5d2"
        decay={2}
        distance={15}
        intensity={0.42}
        position={[5, 3.5, 4]}
      />
      <spotLight
        angle={0.78}
        color="#fffaf2"
        decay={1.8}
        distance={24}
        intensity={0.72}
        penumbra={1}
        position={[4.5, 8.5, 6]}
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
        <ExperienceFileDrawer onEnter={onEnter} />
        <PortfolioSketchbook onEnter={onEnter} />
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
