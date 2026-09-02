"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
} from "react";
import { useRouter } from "next/navigation";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  AdaptiveDpr,
  Html,
  RoundedBox,
  useTexture,
} from "@react-three/drei";
import * as THREE from "three";
import { siteProfile } from "@/data/content";
import { PhoneGuestbook } from "@/components/study/PhoneGuestbook";
import { StudyModelSlot, StudyAssetBoundary } from "@/components/study/StudyModel";
import { studyModelConfigs } from "@/components/study/studyModels";
import { StudyDiagnostics } from "./StudyDiagnostics";
import { studyAssets, studyTextures } from "./studyAssets";
import { useStudyLoading, useStudyLoadingSnapshot } from "./StudyLoading";
import { assetRequestUrl } from "./studyLoadingState";
import { preloadStudyAssets, StudyTexturePreparation, StudyScenePreparation } from "./StudyPreparation";

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
const idCardFaceRef: { current: THREE.Object3D | null } = { current: null };

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

function CameraRig({
  focus,
  entering,
  detailView,
  reducedMotion,
  floorLift,
  preparing,
}: {
  focus: Point | null;
  entering: boolean;
  detailView: DetailView;
  reducedMotion: boolean;
  floorLift: number;
  preparing: boolean;
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

    if (reducedMotion || preparing) {
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
    if (reducedMotion || preparing || lockViewUp) {
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
      state.camera.zoom = reducedMotion || preparing
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
  const store = useStudyLoading();
  const { entries, run } = useStudyLoadingSnapshot();
  const wallpaper = useTexture(assetRequestUrl(entries[studyTextures.wallpaper]));
  const floor = useTexture(assetRequestUrl(entries[studyTextures.floor]));
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

  useEffect(() => {
    store.reportShellReady(run);
  }, [store, run, wallpaperTexture, floorTexture]);
  useEffect(() => () => { wallpaperTexture.dispose(); floorTexture.dispose(); }, [wallpaperTexture, floorTexture]);

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

function RetroPrinter() {
  const [hovered, setHovered] = useState(false);
  const [printing, setPrinting] = useState(false);

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

function RetroStudentId({
  focused,
  onInspect,
}: {
  focused: boolean;
  onInspect: () => void;
}) {
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
      <group position={[ID_CARD_LOCAL_POSITION.x, ID_CARD_LOCAL_POSITION.y, ID_CARD_LOCAL_POSITION.z]} rotation={[0, 0, ID_CARD_ROLL]}>
        <object3D ref={(object) => { idCardFaceRef.current = object; }} position={[0, 0, 0.042]} />
      </group>
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
  );
}

function RetroWallHooks({
  focused,
  onInspect,
}: {
  focused: boolean;
  onInspect: () => void;
}) {

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

      <RetroStudentId focused={focused} onInspect={onInspect} />

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
      />

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
      onOpenTeaching();
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
      />
      <StudyModelSlot
        config={studyModelConfigs.teddybear}
        fallback={null}
      />
      <StudyModelSlot
        config={studyModelConfigs.notebooks}
        fallback={null}
      />

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
        fallback={null}
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

  return (
    <group position={[-0.965, 0.84, -1.94]}>
      <StudyModelSlot
        config={studyModelConfigs.desk}
        fallback={null}
      />
      <RetroResearchDrawers focused={researchFocused} onInspect={onInspectResearch} onOpenResearch={onOpenResearch} />

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

      <group
        position={[0, 0.09, -0.43]}
        rotation={[-LAPTOP_LID_TILT, 0, 0]}
      >

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

function RetroChair() {
  return (
    <StudyModelSlot
      config={studyModelConfigs.chair}
      fallback={null}
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
  const { entries, phase } = useStudyLoadingSnapshot();
  const rugLoaded = entries[studyModelConfigs.rug.src]?.status === "ready";
  const textureAttempt = `${entries[studyTextures.wallpaper]?.attempt}:${entries[studyTextures.floor]?.attempt}`;
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
        <StudyTexturePreparation />
        <StudyAssetBoundary key={textureAttempt} asset="room textures" fallback={null}>
          <Suspense fallback={null}><RoomShell /></Suspense>
        </StudyAssetBoundary>
        <StudyModelSlot
          config={studyModelConfigs.rug}
          fallback={null}
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

      </group>

      <CameraRig
        floorLift={floorLift}
        preparing={phase !== "ready"}
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
      <StudyDiagnostics />
      <StudyScenePreparation />
    </>
  );
}

export function StudyScene() {
  const store = useStudyLoading();
  const { phase } = useStudyLoadingSnapshot();
  useEffect(() => {
    store.configure(studyAssets);
    preloadStudyAssets(store);
  }, [store]);
  if (phase === "module" || phase === "unavailable") return null;
  return <StudySceneContent />;
}

function StudySceneContent() {
  const store = useStudyLoading();
  const renderer = useRef<THREE.WebGLRenderer | null>(null);
  const createRenderer = useCallback((defaults: THREE.WebGLRendererParameters) => {
    // Fiber awaits custom renderer factories. Overlapping configuration passes
    // must reuse one renderer; two renderers cannot safely share this canvas.
    if (renderer.current) return renderer.current;
    try {
      renderer.current = new THREE.WebGLRenderer({ ...defaults, antialias: true, alpha: false, powerPreference: "high-performance" });
      return renderer.current;
    } catch (error) {
      store.fail("WebGL is unavailable", true);
      throw error;
    }
  }, [store]);
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
        // Three already falls back to PCF for the deprecated soft mode. Pin
        // that same effective mode so loading updates do not flip shader variants.
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 1.6]}
        frameloop={reducedMotion ? "demand" : "always"}
        camera={{
          position: [11, 12.68, 10.9],
          zoom: 30,
          near: 0.1,
          far: 100,
        }}
        gl={createRenderer}
        fallback={<span>The interactive study requires WebGL.</span>}
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
