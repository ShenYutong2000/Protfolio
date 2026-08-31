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

const SHOW_LEGACY_FURNITURE = false;
const ROOM_SIZE = 8.2;
const FLOOR_SIZE = ROOM_SIZE + 0.2;
const FLOOR_TOP = -2.08;
const ROOM_CENTER_Z = -0.1;
const WINDOW_WIDTH = 3.7;
const WINDOW_HEIGHT = 3.77;
const WINDOW_CENTER_Y = 3;
const WINDOW_CENTER_Z = -0.1;

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
  const leftWallShape = useMemo(() => {
    const wallBack = ROOM_CENTER_Z - ROOM_SIZE / 2 + 0.18;
    const wallFront = ROOM_CENTER_Z + ROOM_SIZE / 2 - 0.1;
    const wallBottom = FLOOR_TOP;
    const wallTop = FLOOR_TOP + ROOM_SIZE;
    const cornerRadius = 0.22;
    const wall = new THREE.Shape();
    wall.moveTo(wallBack + cornerRadius, wallBottom);
    wall.lineTo(wallFront - cornerRadius, wallBottom);
    wall.quadraticCurveTo(
      wallFront,
      wallBottom,
      wallFront,
      wallBottom + cornerRadius,
    );
    wall.lineTo(wallFront, wallTop - cornerRadius);
    wall.quadraticCurveTo(
      wallFront,
      wallTop,
      wallFront - cornerRadius,
      wallTop,
    );
    wall.lineTo(wallBack + cornerRadius, wallTop);
    wall.quadraticCurveTo(
      wallBack,
      wallTop,
      wallBack,
      wallTop - cornerRadius,
    );
    wall.lineTo(wallBack, wallBottom + cornerRadius);
    wall.quadraticCurveTo(
      wallBack,
      wallBottom,
      wallBack + cornerRadius,
      wallBottom,
    );
    wall.closePath();

    const windowOpening = new THREE.Path();
    const openingBottom = WINDOW_CENTER_Y - WINDOW_HEIGHT / 2;
    const openingTop = WINDOW_CENTER_Y + WINDOW_HEIGHT / 2;
    const openingBack = WINDOW_CENTER_Z - WINDOW_WIDTH / 2;
    const openingFront = WINDOW_CENTER_Z + WINDOW_WIDTH / 2;
    windowOpening.moveTo(openingBack, openingBottom);
    windowOpening.lineTo(openingBack, openingTop);
    windowOpening.lineTo(openingFront, openingTop);
    windowOpening.lineTo(openingFront, openingBottom);
    windowOpening.closePath();
    wall.holes.push(windowOpening);

    return wall;
  }, []);

  return (
    <group>
      <RoundedBox
        args={[FLOOR_SIZE, 0.64, FLOOR_SIZE]}
        position={[0, -2.4, ROOM_CENTER_Z]}
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
        args={[ROOM_SIZE, ROOM_SIZE, 0.5]}
        position={[
          0,
          FLOOR_TOP + ROOM_SIZE / 2,
          ROOM_CENTER_Z - ROOM_SIZE / 2 + 0.25,
        ]}
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
      <mesh
        position={[-ROOM_SIZE / 2 + 0.38, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
      >
        <extrudeGeometry
          args={[
            leftWallShape,
            {
              bevelEnabled: true,
              bevelSegments: 8,
              bevelSize: 0.12,
              bevelThickness: 0.12,
              curveSegments: 8,
              depth: 0.26,
              steps: 1,
            },
          ]}
        />
        <meshStandardMaterial
          color={palette.shell}
          roughness={0.88}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function RetroWallHooks() {
  const mushroomCaps = [
    { x: -0.62, scale: 0.82 },
    { x: 0, scale: 1 },
    { x: 0.62, scale: 0.82 },
  ];

  return (
    <group position={[2.75, 3.85, -3.62]}>
      <RoundedBox
        args={[1.75, 0.18, 0.14]}
        position={[0, 0.01, 0]}
        radius={0.07}
        smoothness={9}
        castShadow
      >
        <meshPhysicalMaterial color="#76a84e" roughness={0.72} />
      </RoundedBox>
      {mushroomCaps.map(({ x, scale }) => (
        <group key={x} position={[x, 0, 0.04]}>
          <RoundedBox
            args={[0.12, 0.3, 0.1]}
            position={[0, -0.04, 0]}
            radius={0.035}
            smoothness={7}
          >
            <meshPhysicalMaterial color="#e7d7ab" roughness={0.72} />
          </RoundedBox>
          <mesh
            position={[0, 0.25, 0.025]}
            scale={[scale, scale * 0.62, 0.38]}
            castShadow
          >
            <sphereGeometry args={[0.32, 18, 12]} />
            <meshPhysicalMaterial
              clearcoat={0.08}
              clearcoatRoughness={0.72}
              color="#df655c"
              roughness={0.67}
            />
          </mesh>
          {[
            [-0.11, 0.27],
            [0.1, 0.28],
            [0, 0.4],
          ].map(([dotX, dotY], index) => (
            <mesh
              key={index}
              position={[dotX * scale, dotY * scale, 0.15]}
            >
              <sphereGeometry args={[0.042 * scale, 10, 8]} />
              <meshPhysicalMaterial color="#f8eddc" roughness={0.72} />
            </mesh>
          ))}
          <mesh
            position={[0, -0.17, 0.11]}
            rotation={[0, 0, Math.PI]}
          >
            <torusGeometry args={[0.09, 0.022, 8, 18, Math.PI]} />
            <meshPhysicalMaterial
              color="#8c7659"
              metalness={0.08}
              roughness={0.6}
            />
          </mesh>
        </group>
      ))}
      <RoundedBox
        args={[0.045, 0.64, 0.045]}
        position={[-0.7, -0.43, 0.17]}
        rotation={[0, 0, -0.28]}
        radius={0.018}
        smoothness={5}
      >
        <meshPhysicalMaterial color="#eab8c9" roughness={0.68} />
      </RoundedBox>
      <RoundedBox
        args={[0.045, 0.64, 0.045]}
        position={[-0.36, -0.43, 0.17]}
        rotation={[0, 0, 0.34]}
        radius={0.018}
        smoothness={5}
      >
        <meshPhysicalMaterial color="#f1c4d3" roughness={0.68} />
      </RoundedBox>
      <mesh position={[-0.52, -0.24, 0.18]}>
        <torusGeometry args={[0.15, 0.027, 9, 22]} />
        <meshPhysicalMaterial
          clearcoat={0.12}
          clearcoatRoughness={0.62}
          color="#e8c4d1"
          roughness={0.58}
        />
      </mesh>
      <RoundedBox
        args={[0.2, 0.24, 0.08]}
        position={[-0.52, -0.43, 0.19]}
        radius={0.035}
        smoothness={7}
      >
        <meshPhysicalMaterial color="#b85f7c" roughness={0.68} />
      </RoundedBox>
      <RoundedBox
        args={[0.35, 0.29, 0.12]}
        position={[-0.52, -0.61, 0.2]}
        radius={0.055}
        smoothness={8}
        castShadow
      >
        <meshPhysicalMaterial
          clearcoat={0.1}
          clearcoatRoughness={0.65}
          color="#c66f8b"
          roughness={0.65}
        />
      </RoundedBox>
      <mesh position={[-0.52, -0.61, 0.268]}>
        <circleGeometry args={[0.085, 18]} />
        <meshPhysicalMaterial color="#e8cf72" roughness={0.66} />
      </mesh>
      <mesh position={[-0.52, -0.61, 0.274]}>
        <circleGeometry args={[0.05, 16]} />
        <meshPhysicalMaterial color="#f4ecd9" roughness={0.72} />
      </mesh>
      <RoundedBox
        args={[0.18, 0.08, 0.08]}
        position={[-0.52, -0.8, 0.2]}
        radius={0.025}
        smoothness={6}
      >
        <meshPhysicalMaterial color="#f2eee4" roughness={0.7} />
      </RoundedBox>
      <group
        position={[-0.52, -1.25, 0.2]}
        rotation={[0, 0, 0.025]}
      >
        <RoundedBox
          args={[0.64, 0.94, 0.12]}
          radius={0.075}
          smoothness={9}
          castShadow
        >
          <meshPhysicalMaterial
            clearcoat={0.12}
            clearcoatRoughness={0.68}
            color="#b85f7c"
            roughness={0.67}
          />
        </RoundedBox>
        <RoundedBox
          args={[0.53, 0.55, 0.025]}
          position={[0, 0.08, 0.073]}
          radius={0.035}
          smoothness={7}
        >
          <meshPhysicalMaterial color="#f7f2e7" roughness={0.8} />
        </RoundedBox>
        <RoundedBox
          args={[0.51, 0.1, 0.026]}
          position={[0, 0.36, 0.075]}
          radius={0.018}
          smoothness={5}
        >
          <meshPhysicalMaterial color="#f2ead7" roughness={0.77} />
        </RoundedBox>
        <RoundedBox
          args={[0.32, 0.31, 0.028]}
          position={[0, 0.08, 0.078]}
          radius={0.025}
          smoothness={6}
        >
          <meshPhysicalMaterial color="#f4ced8" roughness={0.75} />
        </RoundedBox>
        <mesh position={[0, 0.13, 0.098]}>
          <circleGeometry args={[0.1, 18]} />
          <meshPhysicalMaterial color="#f2dfc7" roughness={0.72} />
        </mesh>
        {[-0.04, 0.04].map((x) => (
          <mesh key={x} position={[x, 0.15, 0.104]}>
            <circleGeometry args={[0.012, 10]} />
            <meshPhysicalMaterial color="#4b4e50" roughness={0.72} />
          </mesh>
        ))}
        <RoundedBox
          args={[0.25, 0.09, 0.025]}
          position={[0, -0.07, 0.1]}
          radius={0.035}
          smoothness={6}
        >
          <meshPhysicalMaterial color="#d98fa7" roughness={0.72} />
        </RoundedBox>
        <mesh position={[0.18, -0.32, 0.075]}>
          <circleGeometry args={[0.085, 18]} />
          <meshPhysicalMaterial color="#d5b755" roughness={0.65} />
        </mesh>
        <mesh position={[0.18, -0.32, 0.081]}>
          <circleGeometry args={[0.047, 16]} />
          <meshPhysicalMaterial color="#f2ebd7" roughness={0.7} />
        </mesh>
      </group>
      <group
        position={[0.48, -0.88, 0.19]}
        rotation={[0, 0, -0.035]}
      >
        <RoundedBox
          args={[0.88, 0.58, 0.21]}
          radius={0.1}
          smoothness={10}
          castShadow
        >
          <meshPhysicalMaterial
            clearcoat={0.12}
            clearcoatRoughness={0.63}
            color="#b94f55"
            roughness={0.66}
          />
        </RoundedBox>
        <mesh position={[0, 0.32, 0.02]}>
          <torusGeometry args={[0.22, 0.04, 9, 24, Math.PI]} />
          <meshPhysicalMaterial color="#873b41" roughness={0.62} />
        </mesh>
        <RoundedBox
          args={[0.34, 0.25, 0.026]}
          position={[0, -0.02, 0.12]}
          radius={0.065}
          smoothness={8}
        >
          <meshPhysicalMaterial color="#d38a8a" roughness={0.72} />
        </RoundedBox>
        <mesh position={[0, -0.02, 0.145]}>
          <circleGeometry args={[0.07, 14]} />
          <meshPhysicalMaterial color="#f0c58d" roughness={0.68} />
        </mesh>
        {[-0.34, 0.34].map((x) => (
          <mesh key={x} position={[x, 0.08, 0.12]}>
            <sphereGeometry args={[0.035, 10, 8]} />
            <meshPhysicalMaterial color="#d6a46f" roughness={0.65} />
          </mesh>
        ))}
      </group>
      <RoundedBox
        args={[0.045, 0.55, 0.045]}
        position={[0.58, -0.31, 0.17]}
        rotation={[0, 0, -0.18]}
        radius={0.018}
        smoothness={5}
      >
        <meshPhysicalMaterial color="#8e4448" roughness={0.68} />
      </RoundedBox>
    </group>
  );
}

function RetroDeskLamp() {
  const neckCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.28, 0.18, -0.1),
        new THREE.Vector3(0.36, 0.52, -0.1),
        new THREE.Vector3(0.34, 0.9, -0.09),
        new THREE.Vector3(0.16, 1.18, -0.07),
        new THREE.Vector3(-0.14, 1.34, -0.04),
        new THREE.Vector3(-0.42, 1.3, -0.02),
      ]),
    [],
  );

  return (
    <group position={[1.78, 0.12, -0.67]} rotation={[0, 0.06, 0]}>
      <RoundedBox
        args={[0.78, 0.15, 0.55]}
        position={[0, 0.075, 0]}
        radius={0.075}
        smoothness={10}
        castShadow
      >
        <meshPhysicalMaterial
          clearcoat={0.08}
          clearcoatRoughness={0.74}
          color="#eee2c5"
          roughness={0.7}
        />
      </RoundedBox>
      <RoundedBox
        args={[0.34, 0.025, 0.26]}
        position={[-0.1, 0.162, 0.015]}
        radius={0.035}
        smoothness={7}
      >
        <meshPhysicalMaterial color="#9fcf9f" roughness={0.66} />
      </RoundedBox>
      <mesh position={[-0.1, 0.181, 0.015]}>
        <cylinderGeometry args={[0.055, 0.055, 0.025, 18]} />
        <meshPhysicalMaterial
          color="#f4ecd8"
          roughness={0.62}
        />
      </mesh>
      <mesh castShadow>
        <tubeGeometry args={[neckCurve, 32, 0.052, 10, false]} />
        <meshPhysicalMaterial
          color="#b8b5a7"
          metalness={0.12}
          roughness={0.58}
        />
      </mesh>
      <mesh position={[0.28, 0.24, -0.1]}>
        <torusGeometry args={[0.065, 0.014, 8, 18]} />
        <meshPhysicalMaterial color="#817f75" roughness={0.62} />
      </mesh>
      <group
        position={[-0.54, 1.13, -0.01]}
        rotation={[0, 0, -0.55]}
      >
        <mesh position={[0, 0.245, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.14, 0.16, 18]} />
          <meshPhysicalMaterial color="#557f52" roughness={0.65} />
        </mesh>
        <mesh castShadow>
          <cylinderGeometry args={[0.18, 0.34, 0.44, 24, 1, true]} />
          <meshPhysicalMaterial
            color="#a8c44f"
            opacity={0.82}
            roughness={0.52}
            side={THREE.DoubleSide}
            transparent
          />
        </mesh>
        <mesh position={[0, -0.11, 0]}>
          <sphereGeometry args={[0.115, 16, 12]} />
          <meshPhysicalMaterial
            color="#fff1ac"
            emissive="#f2c86c"
            emissiveIntensity={0.45}
            roughness={0.48}
          />
        </mesh>
        <pointLight
          color="#ffe3a1"
          decay={2}
          distance={2.8}
          intensity={0.42}
          position={[0, -0.24, 0]}
        />
      </group>
    </group>
  );
}

function RetroDesktopCraftSet() {
  const verticalGridLines = Array.from(
    { length: 9 },
    (_, index) => -0.68 + index * 0.17,
  );
  const horizontalGridLines = Array.from(
    { length: 7 },
    (_, index) => -0.48 + index * 0.16,
  );

  return (
    <group position={[1.02, -0.0175, 0.52]} rotation={[0, -0.04, 0]}>
      <RoundedBox
        args={[1.82, 0.035, 1.35]}
        position={[0, 0.155, 0]}
        radius={0.045}
        smoothness={8}
        castShadow
      >
        <meshPhysicalMaterial color="#477a70" roughness={0.8} />
      </RoundedBox>
      <RoundedBox
        args={[1.56, 0.016, 1.12]}
        position={[-0.01, 0.182, -0.015]}
        radius={0.025}
        smoothness={6}
      >
        <meshPhysicalMaterial color="#f5f0df" roughness={0.88} />
      </RoundedBox>
      {verticalGridLines.map((x) => (
        <mesh key={`craft-grid-x-${x}`} position={[x, 0.194, -0.015]}>
          <boxGeometry args={[0.008, 0.006, 1.06]} />
          <meshPhysicalMaterial color="#9eb8ae" roughness={0.84} />
        </mesh>
      ))}
      {horizontalGridLines.map((z) => (
        <mesh key={`craft-grid-z-${z}`} position={[-0.01, 0.194, z]}>
          <boxGeometry args={[1.5, 0.006, 0.008]} />
          <meshPhysicalMaterial color="#9eb8ae" roughness={0.84} />
        </mesh>
      ))}
      <RoundedBox
        args={[0.1, 0.03, 1.19]}
        position={[-0.82, 0.205, -0.025]}
        radius={0.018}
        smoothness={5}
        castShadow
      >
        <meshPhysicalMaterial color="#dfb454" roughness={0.72} />
      </RoundedBox>
      <RoundedBox
        args={[1.62, 0.03, 0.1]}
        position={[-0.04, 0.205, -0.59]}
        radius={0.018}
        smoothness={5}
        castShadow
      >
        <meshPhysicalMaterial color="#dfb454" roughness={0.72} />
      </RoundedBox>
      <group
        position={[-0.28, 0.265, -0.03]}
        rotation={[0, 0.13, 0]}
      >
        <RoundedBox
          args={[0.54, 0.13, 0.23]}
          radius={0.07}
          smoothness={8}
          castShadow
        >
          <meshPhysicalMaterial color="#c88f51" roughness={0.67} />
        </RoundedBox>
        <RoundedBox
          args={[0.62, 0.045, 0.29]}
          position={[0, 0.085, 0]}
          radius={0.045}
          smoothness={7}
        >
          <meshPhysicalMaterial
            color="#f0c899"
            opacity={0.48}
            roughness={0.4}
            transparent
          />
        </RoundedBox>
        {[-0.16, 0, 0.16].map((x) => (
          <mesh key={x} position={[x, 0.09, 0]}>
            <boxGeometry args={[0.018, 0.012, 0.27]} />
            <meshPhysicalMaterial color="#e5b67f" roughness={0.65} />
          </mesh>
        ))}
      </group>
      <RoundedBox
        args={[0.72, 0.035, 0.045]}
        position={[0.27, 0.23, 0.25]}
        rotation={[0, -0.34, 0]}
        radius={0.016}
        smoothness={5}
        castShadow
      >
        <meshPhysicalMaterial color="#d1ab5c" roughness={0.66} />
      </RoundedBox>
      <mesh
        position={[0.65, 0.245, 0.42]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <torusGeometry args={[0.13, 0.045, 10, 24]} />
        <meshPhysicalMaterial color="#e5c23f" roughness={0.64} />
      </mesh>
      <mesh
        position={[0.65, 0.247, 0.42]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[0.063, 0.016, 8, 20]} />
        <meshPhysicalMaterial color="#78a8ad" roughness={0.67} />
      </mesh>
      <group position={[0.91, 0.235, 0.45]} rotation={[0, 0.24, 0]}>
        <RoundedBox
          args={[0.18, 0.08, 0.13]}
          radius={0.022}
          smoothness={5}
          castShadow
        >
          <meshPhysicalMaterial color="#404b4c" roughness={0.7} />
        </RoundedBox>
        {[-0.055, 0.055].map((x) => (
          <mesh
            key={x}
            position={[x, 0.07, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[0.045, 0.009, 7, 14, Math.PI]} />
            <meshPhysicalMaterial
              color="#b7b5a6"
              metalness={0.18}
              roughness={0.52}
            />
          </mesh>
        ))}
      </group>
      <RoundedBox
        args={[0.35, 0.06, 0.11]}
        position={[0.98, 0.235, 0.12]}
        rotation={[0, 0.28, 0]}
        radius={0.025}
        smoothness={6}
        castShadow
      >
        <meshPhysicalMaterial color="#e6c83f" roughness={0.65} />
      </RoundedBox>
    </group>
  );
}

function RetroTopShelfItems() {
  const leftNotebooks = [
    { x: -2.08, width: 0.11, height: 0.82, color: "#d8d5cd" },
    { x: -1.94, width: 0.12, height: 0.75, color: "#d4aa56" },
    { x: -1.8, width: 0.13, height: 0.79, color: "#aaa9a2" },
  ];
  const rightBooks = [
    { x: 0.55, width: 0.13, height: 0.82, color: "#b66a61" },
    { x: 0.71, width: 0.13, height: 0.86, color: "#b9b5af" },
    { x: 0.87, width: 0.13, height: 0.81, color: "#ddd0a5" },
    { x: 1.03, width: 0.13, height: 0.88, color: "#87909a" },
  ];

  return (
    <group>
      {leftNotebooks.map(({ x, width, height, color }, index) => (
        <group key={x}>
          <RoundedBox
            args={[width, height, 0.34]}
            position={[x, 2.39 + height / 2, -1.49]}
            rotation={[0, 0, index === 0 ? -0.04 : 0.02]}
            radius={0.022}
            smoothness={6}
            castShadow
          >
            <meshPhysicalMaterial color={color} roughness={0.78} />
          </RoundedBox>
          <RoundedBox
            args={[width * 0.55, 0.08, 0.018]}
            position={[x, 2.52 + height / 2, -1.311]}
            radius={0.01}
            smoothness={4}
          >
            <meshPhysicalMaterial color="#f1eadb" roughness={0.72} />
          </RoundedBox>
        </group>
      ))}
      <mesh position={[-1.52, 2.43, -1.52]}>
        <cylinderGeometry args={[0.2, 0.23, 0.08, 18]} />
        <meshPhysicalMaterial color="#3d4546" roughness={0.7} />
      </mesh>
      <mesh position={[-1.52, 2.6, -1.52]}>
        <cylinderGeometry args={[0.035, 0.045, 0.3, 12]} />
        <meshPhysicalMaterial color="#5a5a56" roughness={0.67} />
      </mesh>
      <mesh position={[-1.52, 2.94, -1.52]} castShadow>
        <sphereGeometry args={[0.27, 22, 16]} />
        <meshPhysicalMaterial
          clearcoat={0.09}
          clearcoatRoughness={0.68}
          color="#6bb7cb"
          roughness={0.62}
        />
      </mesh>
      {[
        [-1.63, 3.03, 0.095, 0.07],
        [-1.42, 2.91, 0.09, 0.06],
        [-1.57, 2.83, 0.07, 0.05],
      ].map(([x, y, scaleX, scaleY], index) => (
        <mesh
          key={index}
          position={[x, y, -1.275]}
          scale={[scaleX, scaleY, 1]}
        >
          <sphereGeometry args={[1, 12, 8]} />
          <meshPhysicalMaterial color="#8fc456" roughness={0.72} />
        </mesh>
      ))}
      <RoundedBox
        args={[0.34, 0.48, 0.27]}
        position={[-1.36, 2.63, -1.3]}
        radius={0.04}
        smoothness={7}
        castShadow
      >
        <meshPhysicalMaterial color="#b74340" roughness={0.72} />
      </RoundedBox>
      {[-1.46, -1.38, -1.3].map((x, index) => (
        <mesh
          key={x}
          position={[x, 3.03 + index * 0.035, -1.3]}
          rotation={[0, 0, (index - 1) * 0.08]}
          castShadow
        >
          <cylinderGeometry args={[0.024, 0.024, 0.62, 10]} />
          <meshPhysicalMaterial
            color={["#e4d9c2", "#8ebac1", "#e8a55f"][index]}
            roughness={0.7}
          />
        </mesh>
      ))}
      <RoundedBox
        args={[1.02, 0.52, 0.37]}
        position={[-0.43, 2.66, -1.47]}
        radius={0.045}
        smoothness={7}
        castShadow
      >
        <meshPhysicalMaterial color="#bf413d" roughness={0.71} />
      </RoundedBox>
      {[-0.68, -0.18].map((x, index) => (
        <group key={x}>
          <RoundedBox
            args={[0.43, 0.36, 0.035]}
            position={[x, 2.64, -1.265]}
            radius={0.035}
            smoothness={7}
          >
            <meshPhysicalMaterial color="#f5ede0" roughness={0.76} />
          </RoundedBox>
          <mesh position={[x, 2.64, -1.242]}>
            <circleGeometry args={[0.095, 16]} />
            <meshPhysicalMaterial
              color={index === 0 ? "#e3a089" : "#bdd1c3"}
              roughness={0.72}
            />
          </mesh>
          {[-0.035, 0.035].map((eyeX) => (
            <mesh key={eyeX} position={[x + eyeX, 2.66, -1.235]}>
              <circleGeometry args={[0.012, 10]} />
              <meshPhysicalMaterial color="#514b49" roughness={0.72} />
            </mesh>
          ))}
        </group>
      ))}
      <RoundedBox
        args={[0.74, 0.17, 0.36]}
        position={[-0.48, 3.01, -1.46]}
        rotation={[0, -0.04, 0]}
        radius={0.035}
        smoothness={7}
        castShadow
      >
        <meshPhysicalMaterial color="#4b9a59" roughness={0.73} />
      </RoundedBox>
      <RoundedBox
        args={[0.38, 0.018, 0.2]}
        position={[-0.48, 3.105, -1.46]}
        radius={0.012}
        smoothness={4}
      >
        <meshPhysicalMaterial color="#dce5d3" roughness={0.75} />
      </RoundedBox>
      <mesh position={[0.14, 2.76, -1.46]} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.72, 20]} />
        <meshPhysicalMaterial color="#e6d7a8" roughness={0.72} />
      </mesh>
      <mesh
        position={[0.14, 3.13, -1.46]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[0.14, 0.028, 9, 22]} />
        <meshPhysicalMaterial color="#cb5c52" roughness={0.65} />
      </mesh>
      {[-0.08, 0, 0.08].map((offset, index) => (
        <RoundedBox
          key={offset}
          args={[0.028, 0.5, 0.018]}
          position={[0.14 + offset, 2.76, -1.31]}
          radius={0.009}
          smoothness={4}
        >
          <meshPhysicalMaterial
            color={["#dc9b66", "#89b7b2", "#d8b552"][index]}
            roughness={0.7}
          />
        </RoundedBox>
      ))}
      <RoundedBox
        args={[0.72, 0.88, 0.12]}
        position={[1.72, 2.83, -1.63]}
        radius={0.04}
        smoothness={7}
      >
        <meshPhysicalMaterial color="#9c527e" roughness={0.75} />
      </RoundedBox>
      {rightBooks.map(({ x, width, height, color }) => (
        <group key={x}>
          <RoundedBox
            args={[width, height, 0.34]}
            position={[x, 2.39 + height / 2, -1.48]}
            radius={0.022}
            smoothness={6}
            castShadow
          >
            <meshPhysicalMaterial color={color} roughness={0.76} />
          </RoundedBox>
          <RoundedBox
            args={[width * 0.55, 0.18, 0.018]}
            position={[x, 2.6 + height / 2, -1.301]}
            radius={0.01}
            smoothness={4}
          >
            <meshPhysicalMaterial color="#f7efdf" roughness={0.72} />
          </RoundedBox>
        </group>
      ))}
      {[1.37, 1.67].map((x, index) => (
        <group key={x}>
          <RoundedBox
            args={[0.27, 0.84, 0.36]}
            position={[x, 2.81, -1.47]}
            radius={0.035}
            smoothness={7}
            castShadow
          >
            <meshPhysicalMaterial
              color={index === 0 ? "#a8cd3f" : "#bddc45"}
              roughness={0.7}
            />
          </RoundedBox>
          <RoundedBox
            args={[0.08, 0.28, 0.02]}
            position={[x, 2.86, -1.28]}
            radius={0.018}
            smoothness={5}
          >
            <meshPhysicalMaterial color="#f3eedf" roughness={0.7} />
          </RoundedBox>
        </group>
      ))}
      <group position={[1.88, 2.51, -1.25]} rotation={[0, -0.05, 0]}>
        <RoundedBox
          args={[0.58, 0.2, 0.28]}
          radius={0.055}
          smoothness={8}
          castShadow
        >
          <meshPhysicalMaterial color="#db583e" roughness={0.68} />
        </RoundedBox>
        <mesh position={[-0.12, 0.12, 0.03]}>
          <torusGeometry args={[0.15, 0.045, 10, 22]} />
          <meshPhysicalMaterial color="#efe3bd" roughness={0.64} />
        </mesh>
        <RoundedBox
          args={[0.18, 0.13, 0.22]}
          position={[0.24, 0.1, 0]}
          rotation={[0, 0, -0.28]}
          radius={0.03}
          smoothness={6}
        >
          <meshPhysicalMaterial color="#c64737" roughness={0.7} />
        </RoundedBox>
      </group>
    </group>
  );
}

function RetroDesk() {
  const legPositions: Point[] = [
    [-2.2, -1.52, -1.35],
    [-2.2, -1.52, 1.35],
    [2.2, -1.52, -1.35],
  ];
  const openDrawers = [
    { y: -0.5, extension: 0.77 },
    { y: -1.35, extension: 0.61 },
    { y: -2.2, extension: 0.71 },
  ];

  return (
    <group position={[-0.965, 0.84, -1.94]}>
      <RoundedBox
        args={[5.25, 0.24, 3.5]}
        radius={0.08}
        smoothness={8}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          clearcoat={0.09}
          clearcoatRoughness={0.78}
          color="#d7a36a"
          roughness={0.72}
          specularIntensity={0.34}
        />
      </RoundedBox>
      <RoundedBox
        args={[5.02, 0.32, 0.14]}
        position={[0, -0.28, 1.645]}
        radius={0.06}
        smoothness={8}
        castShadow
      >
        <meshPhysicalMaterial color="#b97945" roughness={0.76} />
      </RoundedBox>
      <RoundedBox
        args={[0.14, 0.32, 3.14]}
        position={[-2.55, -0.28, 0]}
        radius={0.06}
        smoothness={8}
        castShadow
      >
        <meshPhysicalMaterial color="#b97945" roughness={0.76} />
      </RoundedBox>
      {legPositions.map(([x, y, z]) => (
        <RoundedBox
          key={`${x}-${z}`}
          args={[0.28, 2.8, 0.28]}
          position={[x, y, z]}
          radius={0.1}
          smoothness={8}
          castShadow
        >
          <meshPhysicalMaterial color="#bd824e" roughness={0.76} />
        </RoundedBox>
      ))}
      {[0.91, 2.47].map((x) => (
        <RoundedBox
          key={`drawer-cabinet-side-${x}`}
          args={[0.18, 2.8, 1.16]}
          position={[x, -1.52, 1]}
          radius={0.075}
          smoothness={8}
          castShadow
        >
          <meshPhysicalMaterial color="#ca925a" roughness={0.74} />
        </RoundedBox>
      ))}
      <RoundedBox
        args={[1.72, 2.8, 0.12]}
        position={[1.69, -1.52, 0.48]}
        radius={0.07}
        smoothness={8}
        castShadow
      >
        <meshPhysicalMaterial color="#bd824e" roughness={0.77} />
      </RoundedBox>
      {[-0.2, -2.84].map((y) => (
        <RoundedBox
          key={`drawer-cabinet-cap-${y}`}
          args={[1.72, 0.16, 1.16]}
          position={[1.69, y, 1]}
          radius={0.07}
          smoothness={8}
          castShadow
        >
          <meshPhysicalMaterial color="#ca925a" roughness={0.74} />
        </RoundedBox>
      ))}
      {[-0.92, -1.78].map((y) => (
        <RoundedBox
          key={`drawer-divider-${y}`}
          args={[1.5, 0.1, 0.12]}
          position={[1.69, y, 1.5]}
          radius={0.035}
          smoothness={6}
        >
          <meshPhysicalMaterial color="#b97945" roughness={0.76} />
        </RoundedBox>
      ))}
      {openDrawers.map(({ y, extension }, index) => (
        <group key={y}>
          <RoundedBox
            args={[1.46, 0.1, 1.05]}
            position={[1.69, y - 0.26, 1.07 + extension]}
            radius={0.045}
            smoothness={7}
            castShadow
          >
            <meshPhysicalMaterial color="#c98f59" roughness={0.75} />
          </RoundedBox>
          {[1.01, 2.37].map((x) => (
            <RoundedBox
              key={`drawer-side-${y}-${x}`}
              args={[0.1, 0.38, 1.05]}
              position={[x, y - 0.05, 1.07 + extension]}
              radius={0.04}
              smoothness={7}
              castShadow
            >
              <meshPhysicalMaterial color="#c98f59" roughness={0.75} />
            </RoundedBox>
          ))}
          <RoundedBox
            args={[1.46, 0.38, 0.1]}
            position={[1.69, y - 0.05, 0.59 + extension]}
            radius={0.04}
            smoothness={7}
          >
            <meshPhysicalMaterial color="#b97945" roughness={0.76} />
          </RoundedBox>
          <RoundedBox
            args={[1.5, 0.62, 0.09]}
            position={[1.69, y, 1.615 + extension]}
            radius={0.075}
            smoothness={8}
            castShadow
          >
            <meshPhysicalMaterial color="#dea86d" roughness={0.7} />
          </RoundedBox>
          <RoundedBox
            args={[0.46, 0.055, 0.045]}
            position={[1.69, y + 0.02, 1.68 + extension]}
            radius={0.025}
            smoothness={6}
          >
            <meshPhysicalMaterial
              clearcoat={0.18}
              clearcoatRoughness={0.64}
              color="#8f603d"
              roughness={0.6}
            />
          </RoundedBox>
          {index === 0 && (
            <>
              <RoundedBox
                args={[0.58, 0.1, 0.63]}
                position={[1.38, y - 0.15, 1.04 + extension]}
                rotation={[0, 0.08, 0]}
                radius={0.035}
                smoothness={6}
              >
                <meshPhysicalMaterial color="#4f5551" roughness={0.78} />
              </RoundedBox>
              <RoundedBox
                args={[0.62, 0.08, 0.58]}
                position={[1.93, y - 0.13, 1.16 + extension]}
                rotation={[0, -0.08, 0]}
                radius={0.03}
                smoothness={6}
              >
                <meshPhysicalMaterial color="#7e6652" roughness={0.76} />
              </RoundedBox>
            </>
          )}
          {index === 1 &&
            ["#eee8d8", "#f3ede1", "#e9e4d8", "#f2ecdf", "#ebe6dc"].map(
              (color, markerIndex) => (
                <RoundedBox
                  key={`${color}-${markerIndex}`}
                  args={[0.13, 0.1, 0.7]}
                  position={[
                    1.34 + markerIndex * 0.18,
                    y - 0.15,
                    1.08 + extension,
                  ]}
                  radius={0.025}
                  smoothness={5}
                >
                  <meshPhysicalMaterial color={color} roughness={0.72} />
                </RoundedBox>
              ),
            )}
          {index === 2 && (
            <>
              <RoundedBox
                args={[1.08, 0.12, 0.72]}
                position={[1.65, y - 0.14, 1.05 + extension]}
                rotation={[0, 0.06, 0]}
                radius={0.045}
                smoothness={7}
              >
                <meshPhysicalMaterial color="#596c69" roughness={0.8} />
              </RoundedBox>
              <RoundedBox
                args={[0.34, 0.04, 0.16]}
                position={[1.65, y - 0.06, 0.79 + extension]}
                radius={0.025}
                smoothness={5}
              >
                <meshPhysicalMaterial
                  color="#aaa99f"
                  metalness={0.12}
                  roughness={0.58}
                />
              </RoundedBox>
            </>
          )}
        </group>
      ))}
      <RoundedBox
        args={[4.75, 3.28, 0.12]}
        position={[0, 1.76, -1.685]}
        radius={0.08}
        smoothness={8}
        castShadow
      >
        <meshPhysicalMaterial color="#c88f59" roughness={0.78} />
      </RoundedBox>
      <RoundedBox
        args={[4.6, 0.14, 0.5]}
        position={[0, 2.3, -1.49]}
        radius={0.05}
        smoothness={7}
        castShadow
      >
        <meshPhysicalMaterial color="#d7a36a" roughness={0.72} />
      </RoundedBox>
      <RoundedBox
        args={[0.14, 1.03, 0.5]}
        position={[-1.12, 2.885, -1.49]}
        radius={0.05}
        smoothness={7}
        castShadow
      >
        <meshPhysicalMaterial color="#d7a36a" roughness={0.72} />
      </RoundedBox>
      <RoundedBox
        args={[0.14, 3.28, 0.5]}
        position={[0.35, 1.76, -1.49]}
        radius={0.06}
        smoothness={8}
        castShadow
      >
        <meshPhysicalMaterial color="#d7a36a" roughness={0.72} />
      </RoundedBox>
      {[-2.3, 2.3].map((x) => (
        <RoundedBox
          key={`hutch-side-${x}`}
          args={[0.18, 3.28, 0.5]}
          position={[x, 1.76, -1.49]}
          radius={0.06}
          smoothness={8}
          castShadow
        >
          <meshPhysicalMaterial color="#bd824e" roughness={0.76} />
        </RoundedBox>
      ))}
      <RoundedBox
        args={[1.84, 0.14, 0.5]}
        position={[1.32, 0.95, -1.49]}
        radius={0.05}
        smoothness={7}
        castShadow
      >
        <meshPhysicalMaterial color="#d7a36a" roughness={0.72} />
      </RoundedBox>
      <RoundedBox
        args={[1.68, 0.65, 0.44]}
        position={[1.32, 0.555, -1.46]}
        radius={0.07}
        smoothness={8}
        castShadow
      >
        <meshPhysicalMaterial color="#cf985f" roughness={0.74} />
      </RoundedBox>
      <RoundedBox
        args={[1.53, 0.5, 0.055]}
        position={[1.32, 0.555, -1.21]}
        radius={0.055}
        smoothness={8}
      >
        <meshPhysicalMaterial color="#dfa970" roughness={0.7} />
      </RoundedBox>
      <mesh position={[1.32, 0.555, -1.165]}>
        <sphereGeometry args={[0.075, 16, 12]} />
        <meshPhysicalMaterial color="#9f6941" roughness={0.62} />
      </mesh>
      <RetroTopShelfItems />
      <RetroDesktopCraftSet />
      <RetroDeskLamp />
    </group>
  );
}

function RetroLaptop() {
  return (
    <group
      position={[-2.08, 0.96, -1.4]}
      rotation={[0, THREE.MathUtils.degToRad(28), 0]}
      scale={1.25}
    >
      <RoundedBox
        args={[1.45, 0.09, 0.95]}
        position={[0, 0.045, 0]}
        radius={0.055}
        smoothness={8}
        castShadow
      >
        <meshPhysicalMaterial
          clearcoat={0.14}
          clearcoatRoughness={0.58}
          color="#dfe4e1"
          metalness={0.04}
          roughness={0.56}
        />
      </RoundedBox>
      <RoundedBox
        args={[1.16, 0.018, 0.48]}
        position={[0, 0.098, -0.04]}
        radius={0.025}
        smoothness={6}
      >
        <meshPhysicalMaterial color="#65777a" roughness={0.7} />
      </RoundedBox>
      {[-0.15, -0.05, 0.05, 0.15].map((z) => (
        <RoundedBox
          key={`keyboard-row-${z}`}
          args={[1.02, 0.012, 0.018]}
          position={[0, 0.111, z - 0.05]}
          radius={0.006}
          smoothness={4}
        >
          <meshStandardMaterial color="#b7c2c0" roughness={0.72} />
        </RoundedBox>
      ))}
      <RoundedBox
        args={[0.42, 0.014, 0.22]}
        position={[0, 0.11, 0.3]}
        radius={0.025}
        smoothness={6}
      >
        <meshStandardMaterial color="#c6cecb" roughness={0.68} />
      </RoundedBox>
      <mesh position={[0, 0.1, -0.43]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.045, 0.045, 1.2, 16]} />
        <meshPhysicalMaterial color="#aeb9b7" roughness={0.58} />
      </mesh>
      <group
        position={[0, 0.09, -0.43]}
        rotation={[-THREE.MathUtils.degToRad(13), 0, 0]}
      >
        <RoundedBox
          args={[1.4, 0.9, 0.065]}
          position={[0, 0.45, 0]}
          radius={0.065}
          smoothness={8}
          castShadow
        >
          <meshPhysicalMaterial
            clearcoat={0.12}
            clearcoatRoughness={0.62}
            color="#d7dedb"
            metalness={0.04}
            roughness={0.54}
          />
        </RoundedBox>
        <RoundedBox
          args={[1.18, 0.67, 0.018]}
          position={[0, 0.48, 0.043]}
          radius={0.035}
          smoothness={7}
        >
          <meshPhysicalMaterial
            clearcoat={0.18}
            clearcoatRoughness={0.46}
            color="#8fc6ce"
            emissive="#83bac3"
            emissiveIntensity={0.12}
            roughness={0.42}
          />
        </RoundedBox>
        <mesh position={[0, 0.84, 0.044]}>
          <sphereGeometry args={[0.022, 12, 10]} />
          <meshStandardMaterial color="#718083" roughness={0.56} />
        </mesh>
      </group>
    </group>
  );
}

function RetroChair() {
  const chairScale = 1.35;
  const floorTop = -2.08;
  const floorScaleOffset = floorTop * (1 - chairScale);
  const shortLegPositions: Point[] = [
    [-0.72, -1.34, 0.62],
    [0.72, -1.34, 0.62],
  ];

  return (
    <group
      position={[-1.8, floorScaleOffset, 2.05]}
      rotation={[0, Math.PI - THREE.MathUtils.degToRad(20), 0]}
      scale={chairScale}
    >
      <RoundedBox
        args={[1.75, 0.22, 1.45]}
        position={[0, -0.49, 0]}
        radius={0.13}
        smoothness={8}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          clearcoat={0.08}
          clearcoatRoughness={0.78}
          color="#d9a467"
          roughness={0.72}
        />
      </RoundedBox>
      {[-0.72, 0.72].map((x) => (
        <RoundedBox
          key={`chair-back-leg-${x}`}
          args={[0.19, 3.55, 0.19]}
          position={[x, -0.305, -0.62]}
          radius={0.075}
          smoothness={8}
          castShadow
        >
          <meshPhysicalMaterial color="#b97a45" roughness={0.76} />
        </RoundedBox>
      ))}
      {shortLegPositions.map(([x, y, z]) => (
        <RoundedBox
          key={`chair-front-leg-${x}`}
          args={[0.19, 1.48, 0.19]}
          position={[x, y, z]}
          radius={0.075}
          smoothness={8}
          castShadow
        >
          <meshPhysicalMaterial color="#b97a45" roughness={0.76} />
        </RoundedBox>
      ))}
      <RoundedBox
        args={[1.65, 1.25, 0.19]}
        position={[0, 0.75, -0.62]}
        radius={0.16}
        smoothness={10}
        castShadow
      >
        <meshPhysicalMaterial
          clearcoat={0.07}
          clearcoatRoughness={0.8}
          color="#cf9458"
          roughness={0.74}
        />
      </RoundedBox>
      {[-0.72, 0.72].map((x) => (
        <RoundedBox
          key={`chair-side-rail-${x}`}
          args={[0.16, 0.16, 1.24]}
          position={[x, -1.55, 0]}
          radius={0.06}
          smoothness={7}
          castShadow
        >
          <meshPhysicalMaterial color="#b97a45" roughness={0.77} />
        </RoundedBox>
      ))}
      <RoundedBox
        args={[1.58, 0.16, 0.16]}
        position={[0, -1.55, 0.62]}
        radius={0.06}
        smoothness={7}
        castShadow
      >
        <meshPhysicalMaterial color="#b97a45" roughness={0.77} />
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
        <RetroDesk />
        <RetroWallHooks />
        <RetroLaptop />
        <RetroChair />
        {SHOW_LEGACY_FURNITURE && (
          <>
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
          </>
        )}
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
