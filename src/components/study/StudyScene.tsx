"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  AdaptiveDpr,
  Float,
  Html,
  RoundedBox,
  useTexture,
} from "@react-three/drei";
import * as THREE from "three";
import { siteProfile } from "@/data/content";
import { PhoneGuestbook } from "@/components/study/PhoneGuestbook";
import { StudyModelSlot, preloadStudyModel } from "@/components/study/StudyModel";
import { studyModelConfigs } from "@/components/study/studyModels";

const palette = {
  shell: "#c9a3b0",
  shellDark: "#82bac3",
  floorPink: "#f2c6d0",
  wall: "#c9a3b0",
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

const LAPTOP_POSITION: Point = [-2.08, 1.36, -1.4];
const LAPTOP_SCALE = 1.25;
const LAPTOP_YAW = THREE.MathUtils.degToRad(28);
const LAPTOP_LID_TILT = THREE.MathUtils.degToRad(13);
const LAPTOP_LID_POSITION = new THREE.Vector3(0, 0.09, -0.43);
const LAPTOP_SCREEN_LOCAL = new THREE.Vector3(0, 0.48, 0.059);
const LAPTOP_SCREEN_CENTER = new THREE.Vector3();
const laptopScreenRef: { current: THREE.Mesh | null } = { current: null };

function getLaptopScreenAlignment() {
  const orientation = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(-LAPTOP_LID_TILT, LAPTOP_YAW, 0, "XYZ"),
  );
  const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(orientation);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(orientation);
  const mesh = laptopScreenRef.current;
  if (mesh) {
    mesh.updateWorldMatrix(true, false);
    mesh.getWorldPosition(LAPTOP_SCREEN_CENTER);
    mesh.getWorldDirection(normal);
    up.set(0, 1, 0).transformDirection(mesh.matrixWorld).normalize();
    return { center: LAPTOP_SCREEN_CENTER, normal, up };
  }

  LAPTOP_SCREEN_CENTER.copy(LAPTOP_SCREEN_LOCAL)
    .applyEuler(new THREE.Euler(-LAPTOP_LID_TILT, 0, 0))
    .add(LAPTOP_LID_POSITION)
    .multiplyScalar(LAPTOP_SCALE)
    .applyEuler(new THREE.Euler(0, LAPTOP_YAW, 0))
    .add(new THREE.Vector3(...LAPTOP_POSITION));
  return { center: LAPTOP_SCREEN_CENTER, normal, up };
}

getLaptopScreenAlignment();
const LAPTOP_FOCUS_POINT: Point = [
  LAPTOP_SCREEN_CENTER.x,
  LAPTOP_SCREEN_CENTER.y,
  LAPTOP_SCREEN_CENTER.z,
];
const PORTFOLIO_FOCUS_POINT: Point = [0.055, 1.01, -1.42];
const TEACHING_FOCUS_POINT: Point = [-1.05, 3.58, -3.38];
const EXPERIENCE_FOCUS_POINT: Point = [1.72, -0.42, -1.94];
const RESEARCH_FOCUS_POINT: Point = [0.76, -0.48, 0.06];
const PHONE_POSITION: Point = [3.08, FLOOR_TOP, -0.18];
const PHONE_YAW = THREE.MathUtils.degToRad(-45);
const RESUME_HREF = siteProfile.resumeHref;
const ID_CARD_HOOKS_POSITION: Point = [2.75, 3.85, -3.62];
const ID_CARD_LOCAL_POSITION = new THREE.Vector3(-0.45, -0.18, 0.3);
const ID_CARD_ROLL = 0.025;
const ID_CARD_CENTER = new THREE.Vector3();
const idCardFaceRef: { current: THREE.Mesh | null } = { current: null };

function getIdCardAlignment() {
  const normal = new THREE.Vector3(0, 0, 1);
  const up = new THREE.Vector3(
    -Math.sin(ID_CARD_ROLL),
    Math.cos(ID_CARD_ROLL),
    0,
  );
  const mesh = idCardFaceRef.current;
  if (mesh) {
    mesh.updateWorldMatrix(true, false);
    mesh.getWorldPosition(ID_CARD_CENTER);
    mesh.getWorldDirection(normal);
    up.set(0, 1, 0).transformDirection(mesh.matrixWorld).normalize();
    return { center: ID_CARD_CENTER, normal, up };
  }

  ID_CARD_CENTER.copy(new THREE.Vector3(0, 0, 0.042))
    .applyEuler(new THREE.Euler(0, 0, ID_CARD_ROLL))
    .add(ID_CARD_LOCAL_POSITION)
    .add(new THREE.Vector3(...ID_CARD_HOOKS_POSITION));
  return { center: ID_CARD_CENTER, normal, up };
}

getIdCardAlignment();
const ID_CARD_FOCUS_POINT: Point = [
  ID_CARD_CENTER.x,
  ID_CARD_CENTER.y,
  ID_CARD_CENTER.z,
];

type DetailView =
  | "computer"
  | "portfolio"
  | "idcard"
  | "teaching"
  | "experience"
  | "research"
  | null;
const LAPTOP_SCREEN = { width: 768, height: 480 };
const LAPTOP_POPUP = {
  x: 91.5,
  y: 88.5,
  width: 585,
  height: 303,
};
const LAPTOP_PROJECT_BUTTONS = {
  x: 160,
  y: 258,
  width: 496,
  height: 86,
};

function isLaptopProjectButtonHit(uv: THREE.Vector2 | undefined) {
  if (!uv) return false;
  const x = uv.x * LAPTOP_SCREEN.width;
  const y = (1 - uv.y) * LAPTOP_SCREEN.height;
  return (
    x >= LAPTOP_PROJECT_BUTTONS.x &&
    x <= LAPTOP_PROJECT_BUTTONS.x + LAPTOP_PROJECT_BUTTONS.width &&
    y >= LAPTOP_PROJECT_BUTTONS.y &&
    y <= LAPTOP_PROJECT_BUTTONS.y + LAPTOP_PROJECT_BUTTONS.height
  );
}

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
  detailView,
  reducedMotion,
  floorLift,
}: {
  focus: Point | null;
  entering: boolean;
  detailView: DetailView;
  reducedMotion: boolean;
  floorLift: number;
}) {
  useFrame((state, delta) => {
    const pointerX = state.pointer.x * 0.08;
    const pointerY = state.pointer.y * 0.06;
    const overviewTarget = new THREE.Vector3(0, 1.68, -0.1);
    const cameraOffset = focus ? 8.5 : 11;
    const face =
      detailView === "computer"
        ? getLaptopScreenAlignment()
        : detailView === "idcard"
          ? getIdCardAlignment()
          : null;
    const target = face
      ? face.center
      : focus
        ? new THREE.Vector3(focus[0], focus[1] + floorLift, focus[2])
        : overviewTarget;
    const faceDistance = detailView === "idcard" ? 4.8 : 5.2;
    const destination =
      face
        ? new THREE.Vector3(
            target.x + face.normal.x * faceDistance,
            target.y + face.normal.y * faceDistance,
            target.z + face.normal.z * faceDistance,
          )
        : detailView === "portfolio"
          ? new THREE.Vector3(
              target.x + 1.05,
              target.y + 4.85,
              target.z + 2.35,
            )
          : detailView === "teaching"
            ? new THREE.Vector3(
                target.x + 0.08,
                target.y + 0.48,
                target.z + 3.55,
              )
            : detailView === "experience"
              ? new THREE.Vector3(
                  target.x + 3.85,
                  target.y + 0.22,
                  target.z + 1.08,
                )
              : detailView === "research"
                ? new THREE.Vector3(
                    target.x + 2.28,
                    target.y + 3.68,
                    target.z + 1.92,
                  )
          : focus
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

    if (reducedMotion) {
      state.camera.position.copy(destination);
    } else {
      const cameraSpeed = detailView ? 4.6 : entering ? 4.8 : 2.5;
      state.camera.position.x = THREE.MathUtils.damp(
        state.camera.position.x,
        destination.x,
        cameraSpeed,
        delta,
      );
      state.camera.position.y = THREE.MathUtils.damp(
        state.camera.position.y,
        destination.y,
        cameraSpeed,
        delta,
      );
      state.camera.position.z = THREE.MathUtils.damp(
        state.camera.position.z,
        destination.z,
        cameraSpeed,
        delta,
      );
    }

    const lockViewUp = detailView === "computer" || detailView === "idcard";
    const desiredUp =
      lockViewUp && face ? face.up : new THREE.Vector3(0, 1, 0);
    if (reducedMotion || lockViewUp) {
      state.camera.up.copy(desiredUp);
    } else {
      state.camera.up.x = THREE.MathUtils.damp(
        state.camera.up.x,
        desiredUp.x,
        4.6,
        delta,
      );
      state.camera.up.y = THREE.MathUtils.damp(
        state.camera.up.y,
        desiredUp.y,
        4.6,
        delta,
      );
      state.camera.up.z = THREE.MathUtils.damp(
        state.camera.up.z,
        desiredUp.z,
        4.6,
        delta,
      );
    }
    state.camera.lookAt(target);

    if (state.camera instanceof THREE.OrthographicCamera) {
      const fittedZoom = Math.min(
        state.size.width / 18,
        state.size.height / 17,
      );
      const focusZoom =
        detailView === "computer"
          ? 12.8
          : detailView === "idcard"
            ? 18
            : detailView === "teaching"
              ? 7.4
              : detailView === "experience"
                ? 10.8
                : detailView === "research"
                  ? 8.9
                  : detailView === "portfolio"
              ? 8.6
              : focus
                ? 1.2
                : 1;
      state.camera.zoom = reducedMotion
        ? fittedZoom * focusZoom
        : THREE.MathUtils.damp(
            state.camera.zoom,
            fittedZoom * focusZoom,
            detailView ? 4.6 : entering ? 4.8 : 3,
            delta,
          );
      state.camera.updateProjectionMatrix();
    }
  });

  return null;
}

function RoomShell() {
  const wallpaper = useTexture("/assets/study-wallpaper.jpg");
  const floor = useTexture("/assets/study-floor.png");
  const wallpaperTexture = useMemo(() => {
    const texture = wallpaper.clone();
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1.78 / 4.5, 1 / 4.5);
    texture.needsUpdate = true;
    return texture;
  }, [wallpaper]);
  const floorTexture = useMemo(() => {
    const texture = floor.clone();
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1.83, 1);
    texture.needsUpdate = true;
    return texture;
  }, [floor]);

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
          map={floorTexture}
          color="#e8d2bb"
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
          map={wallpaperTexture}
          color="#ffffff"
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
          map={wallpaperTexture}
          color="#ffffff"
          roughness={0.88}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function RetroFloorPhone({
  focused,
  onInspect,
}: {
  focused: boolean;
  onInspect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const numberKeys = [
    [-0.09, 0.16],
    [0, 0.16],
    [0.09, 0.16],
    [-0.09, 0.25],
    [0, 0.25],
    [0.09, 0.25],
    [-0.09, 0.34],
    [0, 0.34],
    [0.09, 0.34],
    [-0.09, 0.43],
    [0, 0.43],
    [0.09, 0.43],
  ];

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [focused, hovered]);

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    if (!focused) onInspect();
  }

  return (
    <group
      position={PHONE_POSITION}
      rotation={[0, PHONE_YAW, 0]}
      onClick={handleClick}
      onPointerEnter={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
    >
      <StudyModelSlot
        config={studyModelConfigs.phone}
        fallback={null}
      />
      <mesh position={[0, 0.22, 0]} rotation={[-0.85, 0, 0]}>
        <planeGeometry args={[0.95, 1.15]} />
        <meshBasicMaterial
          depthWrite={false}
          opacity={0}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>
      <group visible={false}>
      <RoundedBox
        args={[0.34, 0.1, 0.72]}
        position={[0, 0.05, 0]}
        radius={0.075}
        smoothness={10}
        castShadow
      >
        <meshPhysicalMaterial
          clearcoat={0.1}
          clearcoatRoughness={0.64}
          color="#b8bdba"
          metalness={0.04}
          roughness={0.62}
        />
      </RoundedBox>
      <RoundedBox
        args={[0.29, 0.035, 0.27]}
        position={[0, 0.112, -0.17]}
        radius={0.035}
        smoothness={7}
      >
        <meshPhysicalMaterial color="#596261" roughness={0.66} />
      </RoundedBox>
      <RoundedBox
        args={[0.24, 0.018, 0.21]}
        position={[0, 0.139, -0.17]}
        radius={0.025}
        smoothness={6}
      >
        <meshPhysicalMaterial
          clearcoat={0.12}
          clearcoatRoughness={0.52}
          color="#2d2044"
          roughness={0.46}
        />
      </RoundedBox>
      <mesh
        position={[0, 0.152, -0.17]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.22, 0.188]} />
        <meshBasicMaterial color={focused ? "#cbb6e6" : "#b9d4c4"} />
      </mesh>
      <RoundedBox
        args={[0.11, 0.012, 0.045]}
        position={[0, 0.139, -0.31]}
        radius={0.012}
        smoothness={4}
      >
        <meshPhysicalMaterial color="#747d7b" roughness={0.62} />
      </RoundedBox>
      <mesh
        position={[0, 0.135, 0.025]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[0.075, 0.021, 9, 22]} />
        <meshPhysicalMaterial color="#e8e4cf" roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.138, 0.025]}>
        <cylinderGeometry args={[0.032, 0.032, 0.02, 14]} />
        <meshPhysicalMaterial color="#8fad46" roughness={0.62} />
      </mesh>
      {numberKeys.map(([x, z], index) => (
        <RoundedBox
          key={`${x}-${z}`}
          args={[0.07, 0.018, 0.055]}
          position={[x, 0.112, z]}
          radius={0.018}
          smoothness={5}
        >
          <meshPhysicalMaterial
            color={
              index % 4 === 0
                ? "#dce7d2"
                : index % 5 === 0
                  ? "#ead7dc"
                  : "#e7e5d8"
            }
            roughness={0.7}
          />
        </RoundedBox>
      ))}
      <mesh
        position={[-0.12, 0.065, -0.43]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.035, 0.043, 0.25, 12]} />
        <meshPhysicalMaterial color="#8f9491" roughness={0.58} />
      </mesh>
      <mesh
        position={[0.2, 0.025, -0.31]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[0.07, 0.017, 8, 18]} />
        <meshPhysicalMaterial
          color="#aaa798"
          metalness={0.12}
          roughness={0.55}
        />
      </mesh>
      <RoundedBox
        args={[0.075, 0.036, 0.68]}
        position={[0.34, 0.018, 0.03]}
        rotation={[0, 0.08, 0]}
        radius={0.03}
        smoothness={7}
      >
        <meshPhysicalMaterial color="#d795ba" roughness={0.68} />
      </RoundedBox>
      {[-0.15, 0, 0.15].map((z) => (
        <mesh
          key={z}
          position={[0.34, 0.039, z]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[0.025, 0.009, 7, 12]} />
          <meshPhysicalMaterial color="#b54d86" roughness={0.64} />
        </mesh>
      ))}
      <RoundedBox
        args={[0.18, 0.04, 0.16]}
        position={[0.34, 0.02, 0.42]}
        rotation={[0, -0.12, 0]}
        radius={0.045}
        smoothness={7}
      >
        <meshPhysicalMaterial color="#c6699d" roughness={0.66} />
      </RoundedBox>
      </group>
      {hovered && !focused && (
        <Html
          center
          position={[0, 0.42, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="computer-hover-prompt">
            <span>GUESTBOOK · PHONE</span>
            Click to leave a message
          </div>
        </Html>
      )}
    </group>
  );
}

function downloadResume() {
  const link = document.createElement("a");
  link.href = RESUME_HREF;
  link.download = siteProfile.resumeDownloadName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function useResumePaperTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const width = 512;
    const height = 680;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return null;

    context.fillStyle = "#f7f4ea";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "#e47c68";
    context.fillRect(0, 0, 18, height);
    context.fillStyle = "#21383b";
    context.font = "700 36px 'Courier New', monospace";
    context.fillText("RESUME", 46, 64);
    context.fillStyle = "#4f91a0";
    context.fillRect(46, 78, 128, 5);
    context.fillStyle = "#21383b";
    context.font = "700 28px 'Courier New', monospace";
    context.fillText(siteProfile.name, 46, 128);
    context.fillStyle = "#667c7d";
    context.font = "600 16px 'Courier New', monospace";
    context.fillText(siteProfile.role, 46, 158);
    context.fillText(`${siteProfile.location}  ·  ${siteProfile.email}`, 46, 184);

    const lines = [
      siteProfile.introduction,
      ...siteProfile.biography,
      `Interests: ${siteProfile.interests.join(" · ")}`,
    ];
    context.fillStyle = "#40565a";
    context.font = "500 15px 'Courier New', monospace";
    let y = 230;
    for (const line of lines) {
      const words = line.split(" ");
      let row = "";
      for (const word of words) {
        const next = row ? `${row} ${word}` : word;
        if (context.measureText(next).width > 400) {
          context.fillText(row, 46, y);
          y += 22;
          row = word;
        } else {
          row = next;
        }
      }
      if (row) {
        context.fillText(row, 46, y);
        y += 28;
      }
    }

    context.fillStyle = "#d7d2c4";
    for (let i = 0; i < 7; i += 1) {
      context.fillRect(46, y + i * 22, 380 - (i % 3) * 48, 4);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  }, []);
}

function RetroPrinter() {
  const [hovered, setHovered] = useState(false);
  const [printing, setPrinting] = useState(false);
  const resumeTexture = useResumePaperTexture();

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    if (printing) return;
    setPrinting(true);
    downloadResume();
    window.setTimeout(() => setPrinting(false), 1200);
  }

  return (
    <group
      position={[2.55, FLOOR_TOP, -2.35]}
      rotation={[0, THREE.MathUtils.degToRad(-10), 0]}
      scale={1.2}
      onClick={handleClick}
      onPointerEnter={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
    >
      <StudyModelSlot
        config={studyModelConfigs.printer}
        fallback={null}
      />
      <mesh position={[0, 0.72, 0.28]} rotation={[-0.28, 0, 0]}>
        <planeGeometry args={[1.55, 1.85]} />
        <meshBasicMaterial
          depthWrite={false}
          opacity={0}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>
      <group visible={false}>
      {[
        [-0.53, -0.28],
        [-0.53, 0.28],
        [0.53, -0.28],
        [0.53, 0.28],
      ].map(([x, z]) => (
        <RoundedBox
          key={`${x}-${z}`}
          args={[0.18, 0.08, 0.18]}
          position={[x, 0.04, z]}
          radius={0.03}
          smoothness={6}
        >
          <meshPhysicalMaterial color="#343839" roughness={0.72} />
        </RoundedBox>
      ))}
      <RoundedBox
        args={[1.08, 0.56, 0.82]}
        position={[0, 0.38, 0]}
        radius={0.14}
        smoothness={10}
        castShadow
      >
        <meshPhysicalMaterial
          clearcoat={0.08}
          clearcoatRoughness={0.72}
          color="#414445"
          roughness={0.7}
        />
      </RoundedBox>
      {[-0.62, 0.62].map((x) => (
        <RoundedBox
          key={x}
          args={[0.28, 0.48, 0.74]}
          position={[x, 0.34, 0.02]}
          radius={0.13}
          smoothness={10}
          castShadow
        >
          <meshPhysicalMaterial
            clearcoat={0.06}
            clearcoatRoughness={0.76}
            color="#9ba3a4"
            roughness={0.68}
          />
        </RoundedBox>
      ))}
      <RoundedBox
        args={[0.92, 0.2, 0.56]}
        position={[0, 0.66, -0.07]}
        radius={0.08}
        smoothness={8}
        castShadow
      >
        <meshPhysicalMaterial color="#2f3233" roughness={0.68} />
      </RoundedBox>
      <RoundedBox
        args={[0.72, 0.16, 0.055]}
        position={[0, 0.29, 0.43]}
        radius={0.035}
        smoothness={6}
      >
        <meshPhysicalMaterial color="#202324" roughness={0.74} />
      </RoundedBox>
      <RoundedBox
        args={[0.98, 0.06, 0.72]}
        position={[0, 0.11, 0.64]}
        radius={0.045}
        smoothness={7}
        castShadow
      >
        <meshPhysicalMaterial color="#657073" roughness={0.72} />
      </RoundedBox>
      <RoundedBox
        args={[0.98, 0.1, 0.08]}
        position={[0, 0.16, 0.98]}
        radius={0.025}
        smoothness={6}
      >
        <meshPhysicalMaterial color="#4d5658" roughness={0.7} />
      </RoundedBox>
      <RoundedBox
        args={[0.82, 0.04, 0.58]}
        position={[0, 0.155, 0.63]}
        radius={0.025}
        smoothness={6}
      >
        <meshPhysicalMaterial color="#dfe4df" roughness={0.84} />
      </RoundedBox>
      <mesh
        position={[0, 0.178, printing ? 0.96 : 0.74]}
        rotation={[-Math.PI / 2, 0, 0.04]}
      >
        <planeGeometry args={[0.7, 0.62]} />
        <meshPhysicalMaterial
          color="#ffffff"
          map={resumeTexture ?? undefined}
          roughness={0.86}
        />
      </mesh>
      <mesh
        position={[0, 0.72, -0.19]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.045, 0.045, 0.84, 12]} />
        <meshPhysicalMaterial color="#1f2223" roughness={0.7} />
      </mesh>
      <RoundedBox
        args={[0.84, 0.12, 0.44]}
        position={[0, 0.73, -0.29]}
        rotation={[-0.08, 0, 0]}
        radius={0.045}
        smoothness={7}
      >
        <meshPhysicalMaterial color="#596164" roughness={0.72} />
      </RoundedBox>
      <mesh
        position={[0, 1.05, -0.43]}
        rotation={[-0.08, 0, 0]}
        castShadow
      >
        <planeGeometry args={[0.74, 0.68]} />
        <meshPhysicalMaterial
          color="#ffffff"
          map={resumeTexture ?? undefined}
          roughness={0.86}
          side={THREE.DoubleSide}
        />
      </mesh>
      <RoundedBox
        args={[0.28, 0.055, 0.025]}
        position={[0, 0.47, 0.47]}
        radius={0.02}
        smoothness={5}
      >
        <meshPhysicalMaterial color="#a5adae" roughness={0.62} />
      </RoundedBox>
      <mesh position={[0.47, 0.58, 0.4]}>
        <cylinderGeometry args={[0.035, 0.035, 0.022, 12]} />
        <meshPhysicalMaterial
          color={printing || hovered ? "#b6e08a" : "#8fbe75"}
          emissive={printing || hovered ? "#8fbe75" : "#6b9e5c"}
          emissiveIntensity={printing || hovered ? 0.42 : 0.18}
          roughness={0.58}
        />
      </mesh>
      </group>
      {hovered && (
        <Html
          center
          position={[0, 1.42, 0.18]}
          style={{ pointerEvents: "none" }}
        >
          <div className="computer-hover-prompt">
            <span>RESUME · PRINTER</span>
            {printing ? "Printing resume..." : "Click to download Resume"}
          </div>
        </Html>
      )}
    </group>
  );
}

function roundRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function drawIdCardQr(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  const cells = 21;
  const cell = size / cells;
  const finder = [
    [0, 0],
    [cells - 7, 0],
    [0, cells - 7],
  ];
  context.fillStyle = "#111";
  context.fillRect(x, y, size, size);
  context.fillStyle = "#fff";
  context.fillRect(x + 2, y + 2, size - 4, size - 4);
  const filled = (col: number, row: number) => {
    const finderOrigin = finder.find(
      ([fx, fy]) => col >= fx && col < fx + 7 && row >= fy && row < fy + 7,
    );
    if (finderOrigin) {
      const lx = col - finderOrigin[0];
      const ly = row - finderOrigin[1];
      return (
        lx === 0 ||
        ly === 0 ||
        lx === 6 ||
        ly === 6 ||
        (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4)
      );
    }
    return (col * 7 + row * 13) % 5 > 1;
  };
  context.fillStyle = "#111";
  for (let row = 0; row < cells; row += 1) {
    for (let col = 0; col < cells; col += 1) {
      if (filled(col, row)) {
        context.fillRect(x + col * cell, y + row * cell, cell, cell);
      }
    }
  }
}

function useStudentIdTexture() {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const width = 1280;
    const height = 808;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return null;

    context.fillStyle = "#fffdfb";
    roundRectPath(context, 0, 0, width, height, 36);
    context.fill();
    context.save();
    roundRectPath(context, 0, 0, width, height, 36);
    context.clip();

    context.fillStyle = "#f4a7b8";
    context.fillRect(0, 0, width, 196);
    context.fillStyle = "rgba(255, 255, 255, 0.18)";
    context.beginPath();
    context.arc(1180, 40, 120, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#171717";
    context.font = "700 54px 'Times New Roman', serif";
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    context.fillText("Fotogram", 48, 92);
    context.font = "700 22px 'Times New Roman', serif";
    context.fillText("®", 286, 62);

    context.beginPath();
    context.arc(348, 78, 28, 0, Math.PI * 2);
    context.lineWidth = 3;
    context.strokeStyle = "#171717";
    context.stroke();
    context.font = "700 18px 'Times New Roman', serif";
    context.textAlign = "center";
    context.fillText("FG", 348, 84);

    context.textAlign = "left";
    context.lineJoin = "round";
    context.lineWidth = 5;
    context.strokeStyle = "#171717";
    context.fillStyle = "#fff7f4";
    context.font = "italic 700 58px 'Times New Roman', serif";
    context.strokeText("Student ID Card", 430, 96);
    context.fillText("Student ID Card", 430, 96);

    context.fillStyle = "#c45a63";
    context.font = "italic 700 22px 'Times New Roman', serif";
    context.fillText("“The Best Moment of the day”", 430, 148);

    roundRectPath(context, 1048, 118, 176, 36, 18);
    context.fillStyle = "#171717";
    context.fill();
    context.fillStyle = "#fff";
    context.font = "700 16px 'Segoe UI', sans-serif";
    context.textAlign = "center";
    context.fillText("FTGRM-2024", 1136, 142);

    context.fillStyle = "#fffdfb";
    context.fillRect(0, 196, width, 612);

    context.fillStyle = "rgba(244, 167, 184, 0.16)";
    context.beginPath();
    context.arc(820, 430, 210, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(23, 23, 23, 0.18)";
    context.lineWidth = 8;
    context.beginPath();
    context.arc(820, 430, 118, 0, Math.PI * 2);
    context.stroke();
    context.font = "700 36px 'Times New Roman', serif";
    context.fillStyle = "rgba(23, 23, 23, 0.12)";
    context.textAlign = "center";
    context.fillText("FG", 820, 442);

    roundRectPath(context, 48, 232, 268, 338, 10);
    context.fillStyle = "#1c2430";
    context.fill();
    roundRectPath(context, 58, 242, 248, 318, 6);
    context.fillStyle = "#f3d7c4";
    context.fill();

    context.fillStyle = "#7e5a48";
    context.beginPath();
    context.ellipse(132, 318, 42, 48, -0.12, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.ellipse(214, 312, 46, 52, 0.1, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#f0c3ab";
    context.beginPath();
    context.ellipse(134, 338, 34, 38, 0, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.ellipse(216, 334, 36, 40, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#5c3f34";
    context.beginPath();
    context.arc(122, 336, 4, 0, Math.PI * 2);
    context.arc(146, 336, 4, 0, Math.PI * 2);
    context.arc(204, 332, 4, 0, Math.PI * 2);
    context.arc(228, 332, 4, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#e28aa6";
    context.beginPath();
    context.moveTo(58, 560);
    context.lineTo(58, 430);
    context.quadraticCurveTo(134, 390, 176, 430);
    context.lineTo(176, 560);
    context.fill();
    context.fillStyle = "#88b8c8";
    context.beginPath();
    context.moveTo(176, 560);
    context.lineTo(176, 424);
    context.quadraticCurveTo(230, 382, 306, 428);
    context.lineTo(306, 560);
    context.fill();

    const fields = [
      ["Name", siteProfile.name],
      ["Role", siteProfile.role],
      ["Based in", siteProfile.location],
      ["Email", siteProfile.email],
    ] as const;
    fields.forEach(([label, value], index) => {
      const y = 268 + index * 78;
      context.fillStyle = "#171717";
      context.textAlign = "left";
      context.font = "700 20px 'Segoe UI', sans-serif";
      context.fillText(label, 360, y);
      context.font = "600 30px 'Segoe Script', 'Brush Script MT', cursive";
      let display = value;
      while (context.measureText(display).width > 620 && display.length > 4) {
        display = `${display.slice(0, -2)}…`;
      }
      context.fillText(display, 360, y + 42);
      context.strokeStyle = "#d7d0c8";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(360, y + 52);
      context.lineTo(index > 1 ? 820 : 980, y + 52);
      context.stroke();
    });

    drawIdCardQr(context, 1068, 430, 148);
    context.fillStyle = "#171717";
    context.font = "600 16px 'Segoe UI', sans-serif";
    context.textAlign = "center";
    context.fillText("No. FTGRM2024", 1142, 604);

    context.strokeStyle = "#ece4dc";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(36, 668);
    context.lineTo(1244, 668);
    context.stroke();
    context.fillStyle = "#171717";
    context.font = "600 16px 'Segoe UI', sans-serif";
    context.textAlign = "left";
    context.fillText("FTGRM Student", 48, 748);
    context.textAlign = "center";
    context.font = "700 22px 'Times New Roman', serif";
    context.fillText("★  Fotogram Student's Pass  ★", 640, 750);

    context.restore();
    context.strokeStyle = "#e7b4c2";
    context.lineWidth = 10;
    roundRectPath(context, 5, 5, width - 10, height - 10, 32);
    context.stroke();

    const nextTexture = new THREE.CanvasTexture(canvas);
    nextTexture.colorSpace = THREE.SRGBColorSpace;
    nextTexture.minFilter = THREE.LinearFilter;
    nextTexture.magFilter = THREE.LinearFilter;
    nextTexture.anisotropy = 8;
    return nextTexture;
  }, []);

  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

function RetroStudentId({
  focused,
  onInspect,
}: {
  focused: boolean;
  onInspect: () => void;
}) {
  const faceTexture = useStudentIdTexture();
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered && !focused ? "zoom-in" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [focused, hovered]);

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    if (!focused) onInspect();
  }

  return (
    <group
      onClick={handleClick}
      onPointerEnter={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
    >
      <StudyModelSlot
        config={studyModelConfigs.idBag}
        fallback={null}
      />
      <mesh
        position={[
          ID_CARD_LOCAL_POSITION.x,
          ID_CARD_LOCAL_POSITION.y,
          ID_CARD_LOCAL_POSITION.z,
        ]}
        rotation={[0, 0, ID_CARD_ROLL]}
      >
        <planeGeometry args={[1.35, 1.05]} />
        <meshBasicMaterial
          depthWrite={false}
          opacity={0}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>
      <group visible={false}>
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
        position={[
          ID_CARD_LOCAL_POSITION.x,
          ID_CARD_LOCAL_POSITION.y,
          ID_CARD_LOCAL_POSITION.z,
        ]}
        rotation={[0, 0, ID_CARD_ROLL]}
      >
        <mesh position={[0, 0.12, 0.02]}>
          <planeGeometry args={[1.35, 1.05]} />
          <meshBasicMaterial
            depthWrite={false}
            opacity={0}
            side={THREE.DoubleSide}
            transparent
          />
        </mesh>
        <RoundedBox
          args={[1.02, 0.68, 0.08]}
          radius={0.055}
          smoothness={9}
          castShadow
        >
          <meshPhysicalMaterial
            clearcoat={0.28}
            clearcoatRoughness={0.38}
            color="#f3d5de"
            roughness={0.42}
            transparent
            opacity={0.92}
          />
        </RoundedBox>
        <RoundedBox
          args={[0.96, 0.62, 0.036]}
          position={[0, 0, 0.018]}
          radius={0.04}
          smoothness={8}
        >
          <meshPhysicalMaterial color="#fff8f4" roughness={0.78} />
        </RoundedBox>
        <mesh
          ref={(mesh) => {
            idCardFaceRef.current = mesh;
          }}
          position={[0, 0, 0.042]}
        >
          <planeGeometry args={[0.92, 0.58]} />
          <meshBasicMaterial
            color={faceTexture ? "#ffffff" : "#f4a7b8"}
            map={faceTexture ?? undefined}
            toneMapped={false}
          />
        </mesh>
      </group>
      {hovered && !focused && (
        <Html
          center
          position={[-0.52, -0.58, 0.42]}
          style={{ pointerEvents: "none" }}
        >
          <div className="computer-hover-prompt">
            <span>ABOUT · STUDENT ID</span>
            Click to inspect
          </div>
        </Html>
      )}
      </group>
    </group>
  );
}

function RetroWallHooks({
  focused,
  onInspect,
}: {
  focused: boolean;
  onInspect: () => void;
}) {
  const mushroomCaps = [
    { x: -0.62, scale: 0.82 },
    { x: 0, scale: 1 },
    { x: 0.62, scale: 0.82 },
  ];
  const SHOW_LEGACY_WALL_HANGER = false;

  return (
    <group position={ID_CARD_HOOKS_POSITION}>
      <StudyModelSlot
        config={studyModelConfigs.clothHandler}
        fallback={null}
      />
      <StudyModelSlot
        config={studyModelConfigs.umbrella}
        fallback={null}
      />
      {SHOW_LEGACY_WALL_HANGER && (
        <>
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
        </>
      )}
      <RetroStudentId focused={focused} onInspect={onInspect} />
      {SHOW_LEGACY_WALL_HANGER && (
        <>
      <group
        position={[0.48, -1.27, 0.19]}
        rotation={[0, 0, -0.035]}
        scale={1.5}
      >
        <mesh position={[0, 0.68, 0]}>
          <torusGeometry args={[0.13, 0.027, 9, 22, Math.PI]} />
          <meshPhysicalMaterial
            clearcoat={0.08}
            clearcoatRoughness={0.7}
            color="#f2eadc"
            roughness={0.62}
          />
        </mesh>
        <mesh position={[0.13, 0.55, 0]}>
          <cylinderGeometry args={[0.027, 0.027, 0.26, 10]} />
          <meshPhysicalMaterial color="#f2eadc" roughness={0.62} />
        </mesh>
        <mesh position={[0, -0.08, 0]} castShadow>
          <cylinderGeometry args={[0.022, 0.022, 1.32, 10]} />
          <meshPhysicalMaterial
            color="#aaa89e"
            metalness={0.08}
            roughness={0.56}
          />
        </mesh>
        <mesh position={[0, -0.06, 0.015]} castShadow>
          <cylinderGeometry args={[0.13, 0.035, 1, 12]} />
          <meshPhysicalMaterial
            clearcoat={0.05}
            clearcoatRoughness={0.82}
            color="#f4efe5"
            roughness={0.83}
          />
        </mesh>
        {[-0.065, 0, 0.065].map((x, index) => (
          <RoundedBox
            key={x}
            args={[0.018, 0.82, 0.018]}
            position={[x, -0.05, 0.145]}
            rotation={[0, 0, (index - 1) * -0.045]}
            radius={0.006}
            smoothness={4}
          >
            <meshPhysicalMaterial color="#d8d2c6" roughness={0.8} />
          </RoundedBox>
        ))}
        <RoundedBox
          args={[0.25, 0.09, 0.16]}
          position={[0, -0.21, 0.02]}
          radius={0.035}
          smoothness={7}
          castShadow
        >
          <meshPhysicalMaterial color="#d89091" roughness={0.7} />
        </RoundedBox>
        <mesh position={[0, 0.46, 0.015]}>
          <cylinderGeometry args={[0.055, 0.07, 0.11, 12]} />
          <meshPhysicalMaterial color="#ddd6c8" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.7, 0]}>
          <coneGeometry args={[0.045, 0.22, 10]} />
          <meshPhysicalMaterial color="#a9a79e" roughness={0.58} />
        </mesh>
        <RoundedBox
          args={[0.035, 0.28, 0.035]}
          position={[0.17, 0.5, 0.02]}
          rotation={[0, 0, -0.28]}
          radius={0.012}
          smoothness={5}
        >
          <meshPhysicalMaterial color="#e2b3bc" roughness={0.68} />
        </RoundedBox>
      </group>
        </>
      )}
    </group>
  );
}

function RetroDeskLamp() {
  return (
    <StudyModelSlot
      config={studyModelConfigs.lamp}
      fallback={null}
    />
  );
}

function RetroDesktopCraftSet({
  focused,
  onInspect,
  onOpenPortfolio,
}: {
  focused: boolean;
  onInspect: () => void;
  onOpenPortfolio: () => void;
}) {
  const verticalGridLines = Array.from(
    { length: 9 },
    (_, index) => -0.68 + index * 0.17,
  );
  const horizontalGridLines = Array.from(
    { length: 7 },
    (_, index) => -0.48 + index * 0.16,
  );
  const [hovered, setHovered] = useState(false);
  const [bookModelLoaded, setBookModelLoaded] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered
      ? focused
        ? "pointer"
        : "zoom-in"
      : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [focused, hovered]);

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    if (focused) {
      onOpenPortfolio();
      return;
    }
    onInspect();
  }

  return (
    <group
      position={[1.02, -0.0175, 0.52]}
      rotation={[0, -0.04, 0]}
      onClick={handleClick}
      onPointerEnter={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
    >
      <mesh position={[0, 0.28, 0.08]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.35, 1.85]} />
        <meshBasicMaterial
          depthWrite={false}
          opacity={0}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>
      <StudyModelSlot
        config={studyModelConfigs.book}
        fallback={null}
        onLoaded={() => setBookModelLoaded(true)}
      />
      <group visible={!bookModelLoaded}>
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
      {hovered && (
        <Html
          center
          position={[0, 0.92, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="computer-hover-prompt">
            <span>PORTFOLIO · BOOK</span>
            {focused ? "Click to browse" : "Click to inspect"}
          </div>
        </Html>
      )}
    </group>
  );
}

function createSpineTexture(
  width: number,
  height: number,
  paint: (context: CanvasRenderingContext2D, w: number, h: number) => void,
) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;
  paint(context, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function createFileBinderTexture(
  color: string,
  labelStyle: "blank" | "typed",
  number: string,
) {
  return createSpineTexture(128, 512, (context, w, h) => {
    context.fillStyle = color;
    context.fillRect(0, 0, w, h);
    context.fillStyle = "rgba(255,255,255,0.12)";
    context.fillRect(8, 0, 5, h);
    context.fillStyle = "rgba(35,35,35,0.16)";
    context.fillRect(w - 12, 0, 5, h);

    if (labelStyle === "blank") {
      context.fillStyle = "#232527";
      roundRectPath(context, 25, 280, 78, 126, 12);
      context.fill();
      context.fillStyle = "#f6f5ef";
      roundRectPath(context, 34, 289, 60, 108, 8);
      context.fill();
      context.fillStyle = "#d9dde0";
      context.fillRect(44, 320, 40, 5);
      context.fillRect(44, 337, 32, 5);
    } else {
      context.fillStyle = "rgba(255,248,230,0.88)";
      context.fillRect(18, 62, w - 36, 365);
      context.strokeStyle = "#2f3030";
      context.lineWidth = 4;
      context.strokeRect(20, 64, w - 40, 361);
      context.fillStyle = "#252526";
      context.textAlign = "center";
      context.font = "700 42px 'Times New Roman', serif";
      context.fillText("R", w / 2, 112);
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(34, 136);
      context.lineTo(94, 136);
      context.moveTo(34, 151);
      context.lineTo(94, 151);
      context.stroke();
      context.font = "700 22px 'Times New Roman', serif";
      context.fillText(number, w / 2, 385);
      context.beginPath();
      context.moveTo(34, 402);
      context.lineTo(94, 402);
      context.stroke();
    }
  });
}

function ShelfFileRack({
  color,
  position,
  width,
}: {
  color: string;
  position: Point;
  width: number;
}) {
  return (
    <group position={position}>
      <RoundedBox
        args={[width, 0.055, 0.38]}
        position={[0, 0.03, 0]}
        radius={0.018}
        smoothness={5}
        castShadow
      >
        <meshPhysicalMaterial color={color} roughness={0.68} />
      </RoundedBox>
      <RoundedBox
        args={[width, 0.84, 0.045]}
        position={[0, 0.42, -0.17]}
        radius={0.022}
        smoothness={5}
        castShadow
      >
        <meshPhysicalMaterial color={color} roughness={0.68} />
      </RoundedBox>
      {[-1, 1].map((side) => (
        <RoundedBox
          key={side}
          args={[0.055, 0.84, 0.38]}
          position={[side * (width / 2 - 0.0275), 0.42, 0]}
          radius={0.022}
          smoothness={5}
          castShadow
        >
          <meshPhysicalMaterial color={color} roughness={0.68} />
        </RoundedBox>
      ))}
      <RoundedBox
        args={[width - 0.08, 0.1, 0.045]}
        position={[0, 0.12, 0.17]}
        radius={0.018}
        smoothness={5}
      >
        <meshPhysicalMaterial color={color} roughness={0.68} />
      </RoundedBox>
    </group>
  );
}

function ShelfBinder({
  color,
  position,
  texture,
  width,
}: {
  color: string;
  position: Point;
  texture: THREE.CanvasTexture | null;
  width: number;
}) {
  return (
    <group position={position}>
      <RoundedBox
        args={[width, 0.82, 0.3]}
        radius={0.025}
        smoothness={6}
        castShadow
      >
        <meshPhysicalMaterial color={color} roughness={0.7} />
      </RoundedBox>
      <mesh position={[0, 0, 0.157]}>
        <planeGeometry args={[width - 0.018, 0.78]} />
        <meshBasicMaterial
          color={texture ? "#ffffff" : color}
          map={texture ?? undefined}
          toneMapped={false}
        />
      </mesh>
      <RoundedBox
        args={[width * 0.28, 0.055, 0.035]}
        position={[0, 0.43, 0]}
        radius={0.014}
        smoothness={4}
        castShadow
      >
        <meshPhysicalMaterial color={color} roughness={0.7} />
      </RoundedBox>
    </group>
  );
}

function RetroTopShelfItems({
  focused,
  onInspect,
  onOpenTeaching,
}: {
  focused: boolean;
  onInspect: () => void;
  onOpenTeaching: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [book2ModelLoaded, setBook2ModelLoaded] = useState(false);
  const [notebooksModelLoaded, setNotebooksModelLoaded] = useState(false);
  const spines = useMemo(() => {
    const manga = [1, 2, 3].map((volume) =>
      createSpineTexture(96, 512, (context, w, h) => {
        context.fillStyle = "#f4f1ea";
        context.fillRect(0, 0, w, h);
        context.fillStyle = "#e38aa0";
        context.fillRect(0, 0, w, h * 0.2);
        context.fillStyle = "#d46b86";
        context.fillRect(0, 0, w, 10);
        context.fillStyle = "#3f3f3c";
        context.font = "700 22px 'Yu Gothic', 'Microsoft YaHei', sans-serif";
        context.textAlign = "center";
        context.save();
        context.translate(w / 2, h * 0.58);
        context.rotate(-Math.PI / 2);
        context.fillText("レモネードガール", 0, 8);
        context.restore();
        context.font = "700 28px 'Times New Roman', serif";
        context.fillText(String(volume), w / 2, h - 28);
      }),
    );
    const mercury = createSpineTexture(72, 500, (context, w, h) => {
      context.fillStyle = "#9ec9e6";
      context.fillRect(0, 0, w, h);
      context.fillStyle = "#2f4d63";
      context.font = "700 20px 'Yu Gothic', 'Microsoft YaHei', sans-serif";
      context.textAlign = "center";
      context.save();
      context.translate(w / 2, h * 0.55);
      context.rotate(-Math.PI / 2);
      context.fillText("水星の子", 0, 7);
      context.restore();
    });
    const dictionary = createSpineTexture(128, 520, (context, w, h) => {
      context.fillStyle = "#2f5f78";
      context.fillRect(0, 0, w, h);
      context.fillStyle = "rgba(255,255,255,0.08)";
      for (let index = 0; index < 18; index += 1) {
        context.fillRect(8, 24 + index * 26, w - 16, 8);
      }
      context.fillStyle = "#e8d39a";
      context.font = "700 26px 'Times New Roman', serif";
      context.textAlign = "center";
      context.save();
      context.translate(w / 2, h * 0.55);
      context.rotate(-Math.PI / 2);
      context.fillText("DICTIONARY", 0, 9);
      context.restore();
    });
    const relativity = createSpineTexture(148, 560, (context, w, h) => {
      context.fillStyle = "#1d355e";
      context.fillRect(0, 0, w, h);
      context.fillStyle = "#f0d24a";
      context.beginPath();
      context.arc(w / 2, 48, 18, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#fff8e8";
      context.font = "700 34px 'Yu Gothic', 'Microsoft YaHei', sans-serif";
      context.textAlign = "center";
      context.save();
      context.translate(w / 2 - 10, h * 0.52);
      context.rotate(-Math.PI / 2);
      context.fillText("相對論", 0, 0);
      context.restore();
      context.fillStyle = "#f0d24a";
      context.font = "700 16px 'Times New Roman', serif";
      context.save();
      context.translate(w / 2 + 18, h * 0.58);
      context.rotate(-Math.PI / 2);
      context.fillText("The Theory of Relativity", 0, 0);
      context.restore();
    });
    const pastels = ["#d9b8e4", "#f0d36a", "#f3b7c8", "#9ec8e3"].map((color) =>
      createSpineTexture(70, 480, (context, w, h) => {
        context.fillStyle = color;
        context.fillRect(0, 0, w, h);
        context.fillStyle = "rgba(40,40,40,0.55)";
        context.font = "700 16px 'Yu Gothic', 'Microsoft YaHei', sans-serif";
        context.textAlign = "center";
        context.save();
        context.translate(w / 2, 70);
        context.rotate(-Math.PI / 2);
        context.fillText("文庫", 0, 5);
        context.restore();
      }),
    );
    const greenBinders = ["1", "2", "3"].map((number) =>
      createFileBinderTexture("#b6d63a", "blank", number),
    );
    const coloredBinders = [
      ["#efb2c2", "77"],
      ["#f0d98b", "79"],
      ["#a9bfd3", "77"],
    ].map(([color, number]) =>
      createFileBinderTexture(color, "typed", number),
    );
    return {
      manga,
      mercury,
      dictionary,
      relativity,
      pastels,
      greenBinders,
      coloredBinders,
    };
  }, []);

  useEffect(() => {
    document.body.style.cursor = hovered
      ? focused
        ? "pointer"
        : "zoom-in"
      : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [focused, hovered]);

  useEffect(
    () => () => {
      [
        ...spines.manga,
        spines.mercury,
        spines.dictionary,
        spines.relativity,
        ...spines.pastels,
        ...spines.greenBinders,
        ...spines.coloredBinders,
      ].forEach((texture) => texture?.dispose());
    },
    [spines],
  );

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    if (focused) {
      onOpenTeaching();
      return;
    }
    onInspect();
  }

  const shelfY = 2.37;

  return (
    <group
      onClick={handleClick}
      onPointerEnter={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
    >
      <mesh position={[0, 2.86, -1.22]}>
        <planeGeometry args={[4.45, 1.12]} />
        <meshBasicMaterial
          depthWrite={false}
          opacity={0}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>
      <StudyModelSlot
        config={studyModelConfigs.book2}
        fallback={null}
        onLoaded={() => setBook2ModelLoaded(true)}
      />
      <StudyModelSlot
        config={studyModelConfigs.teddybear}
        fallback={null}
      />
      <StudyModelSlot
        config={studyModelConfigs.notebooks}
        fallback={null}
        onLoaded={() => setNotebooksModelLoaded(true)}
      />
      <group visible={!book2ModelLoaded}>
      <RoundedBox
        args={[0.5, 0.52, 0.36]}
        position={[-1.9, shelfY + 0.26, -1.48]}
        radius={0.04}
        smoothness={7}
        castShadow
      >
        <meshPhysicalMaterial color="#f3f0e8" roughness={0.78} />
      </RoundedBox>
      {[0.14, -0.12].map((y, index) => (
        <group key={y}>
          <RoundedBox
            args={[0.44, 0.2, 0.02]}
            position={[-1.9, shelfY + 0.26 + y, -1.292]}
            radius={0.02}
            smoothness={5}
          >
            <meshPhysicalMaterial
              color="#d7e3ea"
              roughness={0.42}
              transparent
              opacity={0.55}
            />
          </RoundedBox>
          <RoundedBox
            args={[0.32, 0.08, 0.12]}
            position={[-1.9, shelfY + 0.24 + y, -1.36]}
            radius={0.02}
            smoothness={4}
          >
            <meshPhysicalMaterial
              color={index === 0 ? "#f0d24a" : "#e38aa0"}
              roughness={0.7}
            />
          </RoundedBox>
        </group>
      ))}
      <group position={[-1.42, shelfY + 0.24, -1.4]}>
        <RoundedBox
          args={[0.2, 0.46, 0.14]}
          radius={0.045}
          smoothness={7}
          castShadow
        >
          <meshPhysicalMaterial color="#24262a" roughness={0.7} />
        </RoundedBox>
        <mesh position={[0, 0.26, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.055, 0.016, 8, 16, Math.PI]} />
          <meshPhysicalMaterial color="#1a1c1f" roughness={0.62} />
        </mesh>
      </group>
      {[-0.96, -0.86, -0.76].map((x, index) => (
        <group key={x} position={[x, shelfY + 0.39, -1.48]}>
          <RoundedBox
            args={[0.09, 0.78, 0.3]}
            radius={0.018}
            smoothness={5}
            castShadow
          >
            <meshPhysicalMaterial color="#efeae0" roughness={0.74} />
          </RoundedBox>
          <mesh position={[0, 0, 0.158]}>
            <planeGeometry args={[0.078, 0.74]} />
            <meshBasicMaterial
              color={spines.manga[index] ? "#ffffff" : "#efeae0"}
              map={spines.manga[index] ?? undefined}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
      <group position={[-0.62, shelfY + 0.38, -1.48]}>
        <RoundedBox
          args={[0.075, 0.76, 0.28]}
          radius={0.016}
          smoothness={5}
          castShadow
        >
          <meshPhysicalMaterial color="#9ec9e6" roughness={0.74} />
        </RoundedBox>
        <mesh position={[0, 0, 0.148]}>
          <planeGeometry args={[0.062, 0.72]} />
          <meshBasicMaterial
            color={spines.mercury ? "#ffffff" : "#9ec9e6"}
            map={spines.mercury ?? undefined}
            toneMapped={false}
          />
        </mesh>
      </group>
      <group position={[-0.4, shelfY + 0.4, -1.48]}>
        <RoundedBox
          args={[0.145, 0.8, 0.32]}
          radius={0.02}
          smoothness={6}
          castShadow
        >
          <meshPhysicalMaterial color="#2f5f78" roughness={0.68} />
        </RoundedBox>
        <mesh position={[0, 0, 0.168]}>
          <planeGeometry args={[0.125, 0.76]} />
          <meshBasicMaterial
            color={spines.dictionary ? "#ffffff" : "#2f5f78"}
            map={spines.dictionary ?? undefined}
            toneMapped={false}
          />
        </mesh>
      </group>
      <group position={[-0.08, shelfY + 0.43, -1.47]}>
        <RoundedBox
          args={[0.165, 0.86, 0.34]}
          radius={0.022}
          smoothness={6}
          castShadow
        >
          <meshPhysicalMaterial color="#1d355e" roughness={0.66} />
        </RoundedBox>
        <mesh position={[0, 0, 0.178]}>
          <planeGeometry args={[0.145, 0.82]} />
          <meshBasicMaterial
            color={spines.relativity ? "#ffffff" : "#1d355e"}
            map={spines.relativity ?? undefined}
            toneMapped={false}
          />
        </mesh>
      </group>
      </group>
      <group visible={!notebooksModelLoaded}>
        <ShelfFileRack
          color="#b3327e"
          position={[1.18, shelfY + 0.5, -1.5]}
          width={0.5}
        />
        {[-0.1, 0, 0.1].map((x, index) => (
          <ShelfBinder
            key={`green-binder-${x}`}
            color="#b6d63a"
            position={[1.18 + x, shelfY + 0.92, -1.46]}
            texture={spines.greenBinders[index]}
            width={0.12}
          />
        ))}
        <ShelfFileRack
          color="#3f78bd"
          position={[1.78, shelfY + 0.5, -1.5]}
          width={0.62}
        />
        {[-0.17, 0, 0.17].map((x, index) => (
          <ShelfBinder
            key={`colored-binder-${x}`}
            color={["#efb2c2", "#f0d98b", "#a9bfd3"][index]}
            position={[1.78 + x, shelfY + 0.92, -1.46]}
            texture={spines.coloredBinders[index]}
            width={0.105}
          />
        ))}
      </group>
      {hovered && (
        <Html
          center
          position={[0, 3.48, -1.1]}
          style={{ pointerEvents: "none" }}
        >
          <div className="computer-hover-prompt">
            <span>TEACHING · SHELF</span>
            {focused ? "Click to open Teaching" : "Click to inspect"}
          </div>
        </Html>
      )}
    </group>
  );
}

function LegacyBriefcaseVisual() {
  return (
    <group position={[2.68, -0.5, 0]} scale={1.2}>
      <RoundedBox
        args={[0.18, 0.68, 1.05]}
        position={[0, -0.75, 0]}
        radius={0.095}
        smoothness={8}
        castShadow
      >
        <meshPhysicalMaterial color="#27292a" roughness={0.73} />
      </RoundedBox>
      <RoundedBox
        args={[0.05, 0.42, 0.08]}
        position={[0, -0.23, 0]}
        radius={0.025}
        smoothness={6}
        castShadow
      >
        <meshPhysicalMaterial color="#252728" roughness={0.68} />
      </RoundedBox>
      <mesh position={[0.15, -0.68, 0]} scale={[0.035, 0.07, 0.07]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshPhysicalMaterial color="#bd527c" roughness={0.63} />
      </mesh>
    </group>
  );
}

function RetroSideBriefcase({
  focused,
  onInspect,
  onOpenExperience,
}: {
  focused: boolean;
  onInspect: () => void;
  onOpenExperience: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered
      ? focused
        ? "pointer"
        : "zoom-in"
      : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [focused, hovered]);

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    if (focused) {
      onOpenExperience();
      return;
    }
    onInspect();
  }

  return (
    <group
      onClick={handleClick}
      onPointerEnter={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
    >
      <mesh
        position={[2.82, -1.05, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[1.55, 1.7]} />
        <meshBasicMaterial
          depthWrite={false}
          opacity={0}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>
      <StudyModelSlot
        config={studyModelConfigs.briefcase}
        fallback={<LegacyBriefcaseVisual />}
      />
      {hovered && (
        <Html
          center
          position={[2.95, -0.15, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="computer-hover-prompt">
            <span>EXPERIENCE · BRIEFCASE</span>
            {focused ? "Click to open Experience" : "Click to inspect"}
          </div>
        </Html>
      )}
    </group>
  );
}

function RetroResearchDrawers({
  focused,
  onInspect,
  onOpenResearch,
}: {
  focused: boolean;
  onInspect: () => void;
  onOpenResearch: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const openDrawers = [
    { y: -0.5, extension: 0.38 },
    { y: -1.35, extension: 0.68 },
    { y: -2.2, extension: 0.88 },
  ];
  const researchFiles = [
    { color: "#8fb8d2", label: "#f4efe4" },
    { color: "#e8c37a", label: "#fff8ee" },
  ];

  useEffect(() => {
    document.body.style.cursor = hovered
      ? focused
        ? "pointer"
        : "zoom-in"
      : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [focused, hovered]);

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    if (focused) {
      onOpenResearch();
      return;
    }
    onInspect();
  }

  return (
    <group
      onClick={handleClick}
      onPointerEnter={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
    >
      <mesh position={[1.69, -1.12, 1.88]} rotation={[-0.58, 0.22, 0]}>
        <planeGeometry args={[2.05, 2.55]} />
        <meshBasicMaterial
          depthWrite={false}
          opacity={0}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>
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
                args={[0.52, 0.08, 0.58]}
                position={[1.32, y - 0.16, 1.08 + extension]}
                rotation={[0, 0.1, 0]}
                radius={0.03}
                smoothness={6}
              >
                <meshPhysicalMaterial color="#3d4246" roughness={0.78} />
              </RoundedBox>
              <RoundedBox
                args={[0.58, 0.07, 0.52]}
                position={[1.96, y - 0.15, 1.18 + extension]}
                rotation={[0, -0.12, 0]}
                radius={0.028}
                smoothness={6}
              >
                <meshPhysicalMaterial color="#8a6a45" roughness={0.74} />
              </RoundedBox>
              <RoundedBox
                args={[0.18, 0.012, 0.14]}
                position={[1.88, y - 0.108, 1.08 + extension]}
                radius={0.008}
                smoothness={4}
              >
                <meshPhysicalMaterial color="#f3ead8" roughness={0.72} />
              </RoundedBox>
            </>
          )}
          {index === 1 && (
            <>
              <RoundedBox
                args={[0.72, 0.1, 0.46]}
                position={[1.52, y - 0.16, 0.98 + extension]}
                rotation={[0, 0.04, 0]}
                radius={0.03}
                smoothness={6}
              >
                <meshPhysicalMaterial color="#6ea4c8" roughness={0.68} />
              </RoundedBox>
              <RoundedBox
                args={[0.68, 0.012, 0.08]}
                position={[1.52, y - 0.104, 0.98 + extension]}
                radius={0.006}
                smoothness={4}
              >
                <meshPhysicalMaterial color="#efd36a" roughness={0.64} />
              </RoundedBox>
              {researchFiles.map((file, fileIndex) => (
                <group
                  key={file.color}
                  position={[
                    1.38 + fileIndex * 0.42,
                    y - 0.17,
                    1.28 + extension,
                  ]}
                  rotation={[0, fileIndex === 0 ? 0.08 : -0.06, 0]}
                >
                  <RoundedBox
                    args={[0.38, 0.05, 0.54]}
                    radius={0.025}
                    smoothness={6}
                    castShadow
                  >
                    <meshPhysicalMaterial color={file.color} roughness={0.72} />
                  </RoundedBox>
                  <RoundedBox
                    args={[0.16, 0.012, 0.12]}
                    position={[0.06, 0.03, -0.12]}
                    radius={0.008}
                    smoothness={4}
                  >
                    <meshPhysicalMaterial color={file.label} roughness={0.7} />
                  </RoundedBox>
                </group>
              ))}
            </>
          )}
          {index === 2 && (
            <>
              <RoundedBox
                args={[0.62, 0.1, 0.7]}
                position={[1.42, y - 0.15, 1.08 + extension]}
                rotation={[0, 0.08, 0]}
                radius={0.04}
                smoothness={7}
              >
                <meshPhysicalMaterial color="#7fbf6a" roughness={0.76} />
              </RoundedBox>
              <RoundedBox
                args={[0.58, 0.012, 0.18]}
                position={[1.42, y - 0.092, 1.08 + extension]}
                radius={0.008}
                smoothness={4}
              >
                <meshPhysicalMaterial color="#f0d24a" roughness={0.68} />
              </RoundedBox>
              <RoundedBox
                args={[0.46, 0.045, 0.58]}
                position={[1.98, y - 0.17, 1.16 + extension]}
                rotation={[0, -0.1, 0]}
                radius={0.022}
                smoothness={6}
              >
                <meshPhysicalMaterial color="#efe3c8" roughness={0.74} />
              </RoundedBox>
              <RoundedBox
                args={[0.2, 0.02, 0.2]}
                position={[2.12, y - 0.14, 1.02 + extension]}
                rotation={[0, 0.35, 0]}
                radius={0.01}
                smoothness={4}
              >
                <meshPhysicalMaterial color="#f7f4ee" roughness={0.7} />
              </RoundedBox>
            </>
          )}
        </group>
      ))}
      {hovered && (
        <Html
          center
          position={[1.69, -0.05, 2.15]}
          style={{ pointerEvents: "none" }}
        >
          <div className="computer-hover-prompt">
            <span>RESEARCH · FILES</span>
            {focused ? "Click to open Research" : "Click to inspect"}
          </div>
        </Html>
      )}
    </group>
  );
}

function RetroDesk({
  portfolioFocused,
  teachingFocused,
  experienceFocused,
  researchFocused,
  onInspectPortfolio,
  onOpenPortfolio,
  onInspectTeaching,
  onOpenTeaching,
  onInspectExperience,
  onOpenExperience,
  onInspectResearch,
  onOpenResearch,
}: {
  portfolioFocused: boolean;
  teachingFocused: boolean;
  experienceFocused: boolean;
  researchFocused: boolean;
  onInspectPortfolio: () => void;
  onOpenPortfolio: () => void;
  onInspectTeaching: () => void;
  onOpenTeaching: () => void;
  onInspectExperience: () => void;
  onOpenExperience: () => void;
  onInspectResearch: () => void;
  onOpenResearch: () => void;
}) {
  const [deskModelLoaded, setDeskModelLoaded] = useState(false);

  return (
    <group position={[-0.965, 0.84, -1.94]}>
      <StudyModelSlot
        config={studyModelConfigs.desk}
        fallback={null}
        onLoaded={() => setDeskModelLoaded(true)}
      />
      <group visible={!deskModelLoaded}>
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
      {[-2.43, 2.43].map((x) => (
        <RoundedBox
          key={`desk-side-panel-${x}`}
          args={[0.24, 2.8, 3.14]}
          position={[x, -1.52, 0]}
          radius={0.09}
          smoothness={9}
          castShadow
          receiveShadow
        >
          <meshPhysicalMaterial
            clearcoat={0.06}
            clearcoatRoughness={0.78}
            color="#bd824e"
            roughness={0.76}
          />
        </RoundedBox>
      ))}
      {[0.91].map((x) => (
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
      <RetroResearchDrawers
        focused={researchFocused}
        onInspect={onInspectResearch}
        onOpenResearch={onOpenResearch}
      />
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
      </group>
      <StudyModelSlot
        config={studyModelConfigs.pencilCase}
        fallback={null}
      />
      <StudyModelSlot
        config={studyModelConfigs.oldBook}
        fallback={null}
      />
      <StudyModelSlot
        config={studyModelConfigs.dessert}
        fallback={null}
      />
      <StudyModelSlot
        config={studyModelConfigs.pen}
        fallback={null}
      />
      <StudyModelSlot
        config={studyModelConfigs.pencilBox}
        fallback={null}
      />
      <RetroTopShelfItems
        focused={teachingFocused}
        onInspect={onInspectTeaching}
        onOpenTeaching={onOpenTeaching}
      />
      <RetroDesktopCraftSet
        focused={portfolioFocused}
        onInspect={onInspectPortfolio}
        onOpenPortfolio={onOpenPortfolio}
      />
      <RetroDeskLamp />
      <RetroSideBriefcase
        focused={experienceFocused}
        onInspect={onInspectExperience}
        onOpenExperience={onOpenExperience}
      />
    </group>
  );
}

function useLaptopScreenTexture() {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 768;
    canvas.height = 480;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#fffafd";
    context.fillRect(0, 0, 768, 480);

    context.save();
    context.translate(390, 270);
    context.rotate(-0.2);
    context.globalAlpha = 0.32;
    context.fillStyle = "#e9a7c1";
    context.beginPath();
    context.moveTo(0, 112);
    context.bezierCurveTo(-230, -20, -120, -180, 0, -72);
    context.bezierCurveTo(120, -180, 230, -20, 0, 112);
    context.fill();
    context.restore();

    context.strokeStyle = "#ef91bd";
    context.lineWidth = 3;
    context.strokeRect(1.5, 1.5, 765, 477);

    [
      [52, 48, "♥", "LIKE"],
      [132, 48, "★", "STAR"],
      [52, 122, "▰", "FOLDER"],
      [132, 122, "▣", "FILE"],
      [52, 196, "▤", "DISK"],
      [132, 196, "▣", "CAMERA"],
      [52, 270, "♡", "BROKEN"],
      [132, 270, "♢", "RECYCLE"],
      [52, 344, "▧", "ART"],
      [132, 344, "●", "GAME"],
    ].forEach(([x, y, symbol, label], index) => {
      context.fillStyle = index % 3 === 0 ? "#e76aa3" : "#c883bc";
      context.font = "700 38px 'Courier New'";
      context.textAlign = "center";
      context.fillText(String(symbol), Number(x), Number(y));
      context.fillStyle = "#cf6a9b";
      context.font = "700 13px 'Courier New'";
      context.fillText(String(label), Number(x), Number(y) + 22);
    });

    context.strokeStyle = "#e980b2";
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(694, 28);
    context.lineTo(740, 28);
    context.lineTo(728, 42);
    context.lineTo(728, 60);
    context.lineTo(740, 74);
    context.lineTo(694, 74);
    context.lineTo(706, 60);
    context.lineTo(706, 42);
    context.closePath();
    context.stroke();

    const popup = LAPTOP_POPUP;
    context.fillStyle = "rgba(83, 48, 111, 0.24)";
    context.fillRect(popup.x + 27, popup.y + 24, popup.width, popup.height);
    context.fillStyle = "#fff0fa";
    context.fillRect(popup.x, popup.y, popup.width, popup.height);
    context.strokeStyle = "#815487";
    context.lineWidth = 9;
    context.strokeRect(popup.x, popup.y, popup.width, popup.height);
    context.fillStyle = "#b678b3";
    context.fillRect(popup.x + 4.5, popup.y + 4.5, popup.width - 9, 51);
    context.fillStyle = "#f8d6ec";
    context.font = "700 24px 'Courier New'";
    context.textAlign = "left";
    context.fillText("PROJECTS.EXE", popup.x + 27, popup.y + 39);
    context.fillStyle = "#f4badb";
    context.fillRect(popup.x + popup.width - 52.5, popup.y + 12, 37.5, 34.5);
    context.fillStyle = "#84517f";
    context.font = "700 27px 'Courier New'";
    context.textAlign = "center";
    context.fillText("×", popup.x + popup.width - 33.75, popup.y + 39);

    context.fillStyle = "#c76f9f";
    context.font = "700 42px 'Courier New'";
    context.fillText(
      "OPEN PROJECTS?",
      popup.x + popup.width / 2,
      popup.y + 138,
    );
    context.fillStyle = "#fff9fd";
    const buttonLabels = ["YES", "OK", "ALWAYS"];
    buttonLabels.forEach((label, index) => {
      const x = popup.x + 81 + index * 168;
      const y = popup.y + 186;
      context.fillRect(x, y, 132, 54);
      context.strokeStyle = "#7f4f86";
      context.lineWidth = 7;
      context.strokeRect(x, y, 132, 54);
      context.fillStyle = "#bf6796";
      context.font = "700 23px 'Courier New'";
      context.fillText(label, x + 66, y + 35);
      context.fillStyle = "#fff9fd";
    });

    context.fillStyle = "#6f477a";
    context.beginPath();
    context.moveTo(406.5, 313.5);
    context.lineTo(406.5, 379.5);
    context.lineTo(426, 363);
    context.lineTo(442.5, 393);
    context.lineTo(457.5, 384);
    context.lineTo(441, 354);
    context.lineTo(468, 349.5);
    context.closePath();
    context.fill();
    context.strokeStyle = "#fff";
    context.lineWidth = 4;
    context.stroke();

    context.fillStyle = "#f7e1ef";
    context.fillRect(0, 431, 768, 49);
    context.strokeStyle = "#e67fac";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(0, 431);
    context.lineTo(768, 431);
    context.stroke();
    context.fillStyle = "#ce709e";
    context.font = "700 20px 'Courier New'";
    context.textAlign = "left";
    context.fillText("12:00 AM", 16, 462);

    for (let index = 0; index < 15; index += 1) {
      const x = 150 + index * 34;
      context.fillStyle =
        index === 13 ? "#73d7a4" : index % 3 === 0 ? "#9eddf1" : "#d4a2dd";
      context.fillRect(x, 444, 24, 23);
      context.strokeStyle = "#df6fa5";
      context.lineWidth = 2;
      context.strokeRect(x, 444, 24, 23);
    }

    context.fillStyle = "#fbe8f4";
    context.fillRect(704, 160, 62, 255);
    context.strokeStyle = "#e785b2";
    context.lineWidth = 3;
    context.strokeRect(704, 160, 62, 255);
    for (let row = 0; row < 6; row += 1) {
      context.strokeRect(713, 171 + row * 39, 18, 18);
      context.strokeRect(739, 171 + row * 39, 18, 18);
    }

    const nextTexture = new THREE.CanvasTexture(canvas);
    nextTexture.colorSpace = THREE.SRGBColorSpace;
    nextTexture.minFilter = THREE.LinearFilter;
    nextTexture.magFilter = THREE.LinearFilter;
    nextTexture.anisotropy = 4;
    return nextTexture;
  }, []);

  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

function RetroLaptop({
  focused,
  onInspect,
  onOpenProjects,
}: {
  focused: boolean;
  onInspect: () => void;
  onOpenProjects: () => void;
}) {
  const screenTexture = useLaptopScreenTexture();
  const [hovered, setHovered] = useState(false);
  const [projectButtonHovered, setProjectButtonHovered] = useState(false);
  const [laptopModelLoaded, setLaptopModelLoaded] = useState(false);
  const keyboardRows = [
    { count: 13, z: -0.17, offset: 0 },
    { count: 12, z: -0.07, offset: 0.035 },
    { count: 12, z: 0.03, offset: 0.01 },
    { count: 11, z: 0.13, offset: -0.015 },
  ];

  useEffect(() => {
    document.body.style.cursor =
      focused && projectButtonHovered
        ? "pointer"
        : hovered && !focused
          ? "zoom-in"
          : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [focused, hovered, projectButtonHovered]);

  function handleLaptopClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    if (!focused) {
      onInspect();
    }
  }

  function handleScreenPointer(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    setProjectButtonHovered(focused && isLaptopProjectButtonHit(event.uv));
  }

  function handleScreenClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    if (!focused) {
      onInspect();
      return;
    }
    if (isLaptopProjectButtonHit(event.uv)) {
      onOpenProjects();
    }
  }

  return (
    <group
      position={LAPTOP_POSITION}
      rotation={[0, LAPTOP_YAW, 0]}
      scale={LAPTOP_SCALE}
      onClick={handleLaptopClick}
      onPointerEnter={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerLeave={() => {
        setHovered(false);
        setProjectButtonHovered(false);
      }}
    >
      <StudyModelSlot
        config={studyModelConfigs.laptop}
        fallback={null}
        onLoaded={() => setLaptopModelLoaded(true)}
      />
      <mesh position={[0, 0.18, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.35, 1.85]} />
        <meshBasicMaterial
          depthWrite={false}
          opacity={0}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>
      <group visible={!laptopModelLoaded}>
        <RoundedBox
          args={[1.45, 0.09, 0.95]}
          position={[0, 0.045, 0]}
          radius={0.055}
          smoothness={8}
          castShadow
        >
          <meshPhysicalMaterial
            clearcoat={0.2}
            clearcoatRoughness={0.5}
            color={focused ? "#ddd9df" : "#cfd1d2"}
            metalness={0.08}
            roughness={0.48}
          />
        </RoundedBox>
        {keyboardRows.map(({ count, z, offset }, rowIndex) =>
          Array.from({ length: count }, (_, keyIndex) => {
            const x = (keyIndex - (count - 1) / 2) * 0.092 + offset;
            const accent =
              (rowIndex === 1 && keyIndex === 1) ||
              (rowIndex === 2 && keyIndex === count - 2);
            return (
              <RoundedBox
                key={`laptop-key-${rowIndex}-${keyIndex}`}
                args={[0.078, 0.018, 0.067]}
                position={[x, 0.107, z]}
                radius={0.009}
                smoothness={4}
              >
                <meshPhysicalMaterial
                  color={accent ? "#e9a8bd" : "#f3f0e9"}
                  roughness={0.66}
                />
              </RoundedBox>
            );
          }),
        )}
        <RoundedBox
          args={[0.5, 0.018, 0.065]}
          position={[0, 0.107, 0.225]}
          radius={0.012}
          smoothness={5}
        >
          <meshPhysicalMaterial color="#f3f0e9" roughness={0.66} />
        </RoundedBox>
        <RoundedBox
          args={[0.46, 0.012, 0.2]}
          position={[0, 0.108, 0.355]}
          radius={0.025}
          smoothness={6}
        >
          <meshPhysicalMaterial color="#b8bbbc" roughness={0.62} />
        </RoundedBox>
        <RoundedBox
          args={[0.19, 0.012, 0.1]}
          position={[-0.5, 0.108, 0.335]}
          rotation={[0, 0.08, 0]}
          radius={0.025}
          smoothness={6}
        >
          <meshPhysicalMaterial color="#e4a6bd" roughness={0.64} />
        </RoundedBox>
        <mesh
          position={[0.49, 0.111, 0.34]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[0.085, 18]} />
          <meshPhysicalMaterial color="#a9ca69" roughness={0.64} />
        </mesh>
        <mesh
          position={[-0.52, 0.112, 0.22]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[0.045, 16]} />
          <meshPhysicalMaterial color="#e7c34f" roughness={0.64} />
        </mesh>
        <mesh position={[0, 0.1, -0.43]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.045, 1.2, 16]} />
          <meshPhysicalMaterial color="#9da0a1" roughness={0.54} />
        </mesh>
      </group>
      <group
        position={[0, 0.09, -0.43]}
        rotation={[-LAPTOP_LID_TILT, 0, 0]}
      >
        <group visible={!laptopModelLoaded}>
          <RoundedBox
            args={[1.4, 0.9, 0.065]}
            position={[0, 0.45, 0]}
            radius={0.065}
            smoothness={8}
            castShadow
          >
            <meshPhysicalMaterial
              clearcoat={0.2}
              clearcoatRoughness={0.5}
              color="#cfd1d2"
              metalness={0.08}
              roughness={0.48}
            />
          </RoundedBox>
          <RoundedBox
            args={[1.25, 0.74, 0.024]}
            position={[0, 0.48, 0.043]}
            radius={0.045}
            smoothness={7}
          >
            <meshPhysicalMaterial color="#17191f" roughness={0.5} />
          </RoundedBox>
        </group>
        <mesh position={[0, 0.5, 0.02]} onClick={handleLaptopClick}>
          <planeGeometry args={[2.7, 1.95]} />
          <meshBasicMaterial
            depthWrite={false}
            opacity={0}
            side={THREE.DoubleSide}
            transparent
          />
        </mesh>
        <mesh
          ref={(mesh) => {
            laptopScreenRef.current = mesh;
          }}
          position={[0, 0.48, 0.059]}
          onClick={handleScreenClick}
          onPointerMove={handleScreenPointer}
          onPointerOver={handleScreenPointer}
        >
          <planeGeometry args={[1.17, 0.66]} />
          <meshBasicMaterial
            color={screenTexture ? "#ffffff" : "#171c28"}
            map={screenTexture ?? undefined}
            toneMapped={false}
          />
        </mesh>
        <mesh visible={!laptopModelLoaded} position={[0, 0.835, 0.058]}>
          <sphereGeometry args={[0.022, 12, 10]} />
          <meshStandardMaterial color="#62686b" roughness={0.56} />
        </mesh>
      </group>
      {hovered && !focused && (
        <Html
          center
          position={[0, 1.18, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="computer-hover-prompt">
            <span>COMPUTER · DETAIL</span>
            Click to inspect
          </div>
        </Html>
      )}
    </group>
  );
}

function LegacyChairVisual() {
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

function RetroChair() {
  return (
    <StudyModelSlot
      config={studyModelConfigs.chair}
      fallback={<LegacyChairVisual />}
    />
  );
}

function WindowAndCurtains() {
  return (
    <group position={[-3.45, 3, -0.1]} rotation={[0, Math.PI / 2, 0]}>
      <StudyModelSlot
        config={studyModelConfigs.curtain}
        fallback={null}
      />
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
      href="/"
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
      label="Open teaching"
      section="03 · Teaching"
      href="/teaching"
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
  computerFocused,
  portfolioFocused,
  idCardFocused,
  teachingFocused,
  experienceFocused,
  researchFocused,
  phoneFocused,
  reducedMotion,
  onEnter,
  onInspectComputer,
  onOpenProjects,
  onInspectPortfolio,
  onOpenPortfolio,
  onInspectIdCard,
  onInspectTeaching,
  onOpenTeaching,
  onInspectExperience,
  onOpenExperience,
  onInspectResearch,
  onOpenResearch,
  onInspectPhone,
}: {
  focus: Point | null;
  entering: boolean;
  computerFocused: boolean;
  portfolioFocused: boolean;
  idCardFocused: boolean;
  teachingFocused: boolean;
  experienceFocused: boolean;
  researchFocused: boolean;
  phoneFocused: boolean;
  reducedMotion: boolean;
  onEnter: (position: Point, href: string) => void;
  onInspectComputer: () => void;
  onOpenProjects: () => void;
  onInspectPortfolio: () => void;
  onOpenPortfolio: () => void;
  onInspectIdCard: () => void;
  onInspectTeaching: () => void;
  onOpenTeaching: () => void;
  onInspectExperience: () => void;
  onOpenExperience: () => void;
  onInspectResearch: () => void;
  onOpenResearch: () => void;
  onInspectPhone: () => void;
}) {
  const [rugLoaded, setRugLoaded] = useState(false);
  // Lift furniture only once the carpet is visible. Its fallback is the original floor.
  const floorLift =
    rugLoaded && studyModelConfigs.rug.enabled
      ? studyModelConfigs.rug.targetHeight * studyModelConfigs.rug.scale[1]
      : 0;

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
        <StudyModelSlot
          config={studyModelConfigs.rug}
          fallback={null}
          onLoaded={() => setRugLoaded(true)}
        />
        <group name="rug-supported-items" position={[0, floorLift, 0]}>
          <RetroDesk
            portfolioFocused={portfolioFocused}
            teachingFocused={teachingFocused}
            experienceFocused={experienceFocused}
            researchFocused={researchFocused}
            onInspectPortfolio={onInspectPortfolio}
            onOpenPortfolio={onOpenPortfolio}
            onInspectTeaching={onInspectTeaching}
            onOpenTeaching={onOpenTeaching}
            onInspectExperience={onInspectExperience}
            onOpenExperience={onOpenExperience}
            onInspectResearch={onInspectResearch}
            onOpenResearch={onOpenResearch}
          />
          <StudyModelSlot
            config={studyModelConfigs.bookStackFloor}
            fallback={null}
          />
          <RetroFloorPhone
            focused={phoneFocused}
            onInspect={onInspectPhone}
          />
          <RetroPrinter />
          <RetroLaptop
            focused={computerFocused}
            onInspect={onInspectComputer}
            onOpenProjects={onOpenProjects}
          />
          <RetroChair />
          <StudyModelSlot
            config={studyModelConfigs.chairPad}
            fallback={null}
          />
          <StudyModelSlot
            config={studyModelConfigs.schoolBag}
            fallback={null}
          />
        </group>
        <RetroWallHooks
          focused={idCardFocused}
          onInspect={onInspectIdCard}
        />
        <WindowAndCurtains />
        {SHOW_LEGACY_FURNITURE && (
          <>
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

      <CameraRig
        floorLift={floorLift}
        detailView={
          computerFocused
            ? "computer"
            : idCardFocused
              ? "idcard"
              : teachingFocused
                ? "teaching"
                : experienceFocused
                  ? "experience"
                  : researchFocused
                    ? "research"
                    : portfolioFocused
                      ? "portfolio"
                      : null
        }
        entering={entering}
        focus={
          computerFocused
            ? LAPTOP_FOCUS_POINT
            : idCardFocused
              ? ID_CARD_FOCUS_POINT
              : teachingFocused
                ? TEACHING_FOCUS_POINT
                : experienceFocused
                  ? EXPERIENCE_FOCUS_POINT
                  : researchFocused
                    ? RESEARCH_FOCUS_POINT
                    : portfolioFocused
                      ? PORTFOLIO_FOCUS_POINT
                      : focus
        }
        reducedMotion={reducedMotion}
      />
      <AdaptiveDpr pixelated />
    </>
  );
}

export function StudyScene() {
  const router = useRouter();
  const [focus, setFocus] = useState<Point | null>(null);
  const [entering, setEntering] = useState(false);
  const [computerFocused, setComputerFocused] = useState(false);
  const [portfolioFocused, setPortfolioFocused] = useState(false);
  const [idCardFocused, setIdCardFocused] = useState(false);
  const [teachingFocused, setTeachingFocused] = useState(false);
  const [experienceFocused, setExperienceFocused] = useState(false);
  const [researchFocused, setResearchFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const inspecting =
    computerFocused ||
    portfolioFocused ||
    idCardFocused ||
    teachingFocused ||
    experienceFocused ||
    researchFocused ||
    phoneFocused;
  const inspectionCopy = idCardFocused
    ? {
        index: "WALL OBJECT · 02",
        title: "Student ID",
        detail: `${siteProfile.name} · ${siteProfile.role}`,
        hint: "Press Esc to return",
      }
    : computerFocused
      ? {
          index: "DESK OBJECT · 01",
          title: "Study laptop",
          detail: "Silver shell · custom screen · sticker keyboard",
          hint: "Press Esc to return",
        }
      : teachingFocused
        ? {
            index: "SHELF OBJECT · 03",
            title: "Teaching",
            detail: "Top shelf · books · folders",
            hint: "Click again to open Teaching",
          }
        : researchFocused
          ? {
              index: "DESK OBJECT · 04",
              title: "Research files",
              detail: "Open drawers · folders · notes",
              hint: "Click again to open Research",
            }
          : experienceFocused
            ? {
                index: "DESK OBJECT · 05",
                title: "Briefcase",
                detail: "Black case · side buckle · work bag",
                hint: "Click again to open Experience",
              }
            : phoneFocused
              ? {
                  index: "FLOOR OBJECT · 08",
                  title: "Keitai phone",
                  detail: "Guestbook · write a text · read notes",
                  hint: "Press Esc to return",
                }
            : {
                index: "DESK OBJECT · 06",
                title: "Book",
                detail: "Open pages · printed study · desk reading",
                hint: "Click again to open Portfolio",
              };

  function clearInspect() {
    setComputerFocused(false);
    setPortfolioFocused(false);
    setIdCardFocused(false);
    setTeachingFocused(false);
    setExperienceFocused(false);
    setResearchFocused(false);
    setPhoneFocused(false);
  }

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    preloadStudyModel(studyModelConfigs.briefcase.src);
  }, []);

  useEffect(() => {
    if (!inspecting) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      clearInspect();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [inspecting]);

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
    <div
      className={`study-canvas ${entering ? "is-entering" : ""} ${
        inspecting ? "is-inspecting" : ""
      }`}
    >
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
        <StudyWorld
          computerFocused={computerFocused}
          portfolioFocused={portfolioFocused}
          idCardFocused={idCardFocused}
          teachingFocused={teachingFocused}
          experienceFocused={experienceFocused}
          researchFocused={researchFocused}
          phoneFocused={phoneFocused}
          entering={entering}
          focus={focus}
          onEnter={enterSection}
          onInspectComputer={() => {
            setFocus(null);
            setPortfolioFocused(false);
            setIdCardFocused(false);
            setTeachingFocused(false);
            setExperienceFocused(false);
            setResearchFocused(false);
            setPhoneFocused(false);
            setComputerFocused(true);
          }}
          onOpenProjects={() =>
            enterSection(LAPTOP_FOCUS_POINT, "/projects")
          }
          onInspectPortfolio={() => {
            setFocus(null);
            setComputerFocused(false);
            setIdCardFocused(false);
            setTeachingFocused(false);
            setExperienceFocused(false);
            setResearchFocused(false);
            setPhoneFocused(false);
            setPortfolioFocused(true);
          }}
          onOpenPortfolio={() =>
            enterSection(PORTFOLIO_FOCUS_POINT, "/portfolio")
          }
          onInspectIdCard={() => {
            setFocus(null);
            setComputerFocused(false);
            setPortfolioFocused(false);
            setTeachingFocused(false);
            setExperienceFocused(false);
            setResearchFocused(false);
            setPhoneFocused(false);
            setIdCardFocused(true);
          }}
          onInspectTeaching={() => {
            setFocus(null);
            setComputerFocused(false);
            setPortfolioFocused(false);
            setIdCardFocused(false);
            setExperienceFocused(false);
            setResearchFocused(false);
            setPhoneFocused(false);
            setTeachingFocused(true);
          }}
          onOpenTeaching={() =>
            enterSection(TEACHING_FOCUS_POINT, "/teaching")
          }
          onInspectExperience={() => {
            setFocus(null);
            setComputerFocused(false);
            setPortfolioFocused(false);
            setIdCardFocused(false);
            setTeachingFocused(false);
            setResearchFocused(false);
            setPhoneFocused(false);
            setExperienceFocused(true);
          }}
          onOpenExperience={() =>
            enterSection(EXPERIENCE_FOCUS_POINT, "/experience")
          }
          onInspectResearch={() => {
            setFocus(null);
            setComputerFocused(false);
            setPortfolioFocused(false);
            setIdCardFocused(false);
            setTeachingFocused(false);
            setExperienceFocused(false);
            setPhoneFocused(false);
            setResearchFocused(true);
          }}
          onOpenResearch={() =>
            enterSection(RESEARCH_FOCUS_POINT, "/research")
          }
          onInspectPhone={() => {
            setFocus(null);
            setComputerFocused(false);
            setPortfolioFocused(false);
            setIdCardFocused(false);
            setTeachingFocused(false);
            setExperienceFocused(false);
            setResearchFocused(false);
            setPhoneFocused(true);
          }}
          reducedMotion={reducedMotion}
        />
      </Canvas>
      {inspecting && (
        <div className="computer-inspection-ui" aria-live="polite">
          <button
            className="computer-inspection-back"
            type="button"
            onClick={clearInspect}
          >
            <span aria-hidden="true">←</span>
            Back to room
          </button>
          {phoneFocused ? (
            <PhoneGuestbook />
          ) : (
            <div className="computer-detail-card">
              <span>{inspectionCopy.index}</span>
              <strong>{inspectionCopy.title}</strong>
              <p>{inspectionCopy.detail}</p>
              <small>{inspectionCopy.hint}</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
