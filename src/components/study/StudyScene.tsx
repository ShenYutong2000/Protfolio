"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
  type MutableRefObject,
} from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  Html,
  OrbitControls,
  RoundedBox,
  useTexture,
} from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { education } from "@/data/experience";
import { projects } from "@/data/projects";
import { siteProfile } from "@/data/profile";
import { preloadPortfolio } from "@/components/portfolio/preloadPortfolio";
import { projectFolderLayouts, useLaptopFolderTexture } from "./useLaptopFolderTexture";
import { StudyModelSlot, StudyAssetBoundary } from "@/components/study/StudyModel";
import { studyModelConfigs } from "@/components/study/studyModels";
import { StudyDiagnostics } from "./StudyDiagnostics";
import { studyAssets, studyTextures } from "./studyAssets";
import { useStudyLoading, useStudyLoadingSnapshot } from "./StudyLoading";
import { assetRequestUrl } from "./studyLoadingState";
import { preloadStudyAssets, StudyTexturePreparation, StudyScenePreparation } from "./StudyPreparation";
import { createStudyRenderer } from "./createStudyRenderer";

const ExperienceCards = dynamic(() => import("./ExperienceCards").then((module) => module.ExperienceCards), { ssr: false });
const PhoneGuestbook = dynamic(() => import("./PhoneGuestbook").then((module) => module.PhoneGuestbook), { ssr: false });
const ResearchFolders = dynamic(() => import("./ResearchFolders").then((module) => module.ResearchFolders), { ssr: false });
const StudentCardDialog = dynamic(() => import("./StudentCardDialog").then((module) => module.StudentCardDialog), { ssr: false });

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
const LAPTOP_SCREEN_LOCAL = new THREE.Vector3(0, 0.48, 0.18);
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
const EXPERIENCE_FOCUS_POINT: Point = [1.715, 0.44, -1.94];
const DRAWER_FOCUS_POINT: Point = [0.725, -0.1, -0.06];
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
type DetailView =
  | "computer"
  | "drawer"
  | "experience"
  | "portfolio"
  | null;

const OVERVIEW_TARGET = new THREE.Vector3(0, 1.68, -0.1);
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const DRAG_CLICK_THRESHOLD = 6;
const PAGE_FLIP_MS = 780;
const BOOK_FOCUS_MS = 160;
const BOOK_ENTRY_MS = 850;
const BOOK_REDUCED_MOTION_MS = 160;

type OverviewViewApi = {
  capture: () => void;
  restore: () => void;
  reset: () => void;
};
function CameraRig({
  focus,
  entering,
  bookEntryStage,
  detailView,
  reducedMotion,
  floorLift,
  preparing,
}: {
  focus: Point | null;
  entering: boolean;
  bookEntryStage: "idle" | "focus" | "zoom";
  detailView: DetailView;
  reducedMotion: boolean;
  floorLift: number;
  preparing: boolean;
}) {
  const invalidate = useThree((state) => state.invalidate);
  const target = useMemo(() => new THREE.Vector3(), []);
  const destination = useMemo(() => new THREE.Vector3(), []);
  const desiredUp = useMemo(() => new THREE.Vector3(), []);
  useFrame((state, delta) => {
    // OrbitControls owns the overview camera. This rig only owns a deliberate
    // focus/route transition so the two systems never fight over the camera.
    if (!focus && !detailView) return;
    const cameraOffset = focus ? 8.5 : 11;
    const face =
      detailView === "computer"
        ? getLaptopScreenAlignment()
        : null;
    if (face) target.copy(face.center);
    else if (focus) target.set(focus[0], focus[1] + floorLift, focus[2]);
    else target.copy(OVERVIEW_TARGET);
    const faceDistance = 5.2;
    if (face) {
      destination.set(
        target.x + face.normal.x * faceDistance,
        target.y + face.normal.y * faceDistance,
        target.z + face.normal.z * faceDistance,
      );
    } else if (detailView === "drawer") {
      destination.set(target.x + 4, target.y + 3, target.z + 4);
    } else if (detailView === "experience") {
      destination.set(target.x + 4, target.y + 2.8, target.z + 3);
    } else if (bookEntryStage === "zoom") {
      destination.set(target.x + 0.9, target.y + 2.25, target.z + 0.9);
    } else if (bookEntryStage === "focus") {
      destination.set(target.x + 4.8, target.y + 5.8, target.z + 4.8);
    } else if (detailView === "portfolio") {
      destination.set(target.x + 1.05, target.y + 4.85, target.z + 2.35);
    } else {
      destination.set(target.x + cameraOffset, target.y + cameraOffset, target.z + cameraOffset);
    }

    if (reducedMotion || preparing) {
      state.camera.position.copy(destination);
    } else {
      const cameraSpeed = bookEntryStage !== "idle" ? 10 : detailView || entering ? 7.2 : 2.5;
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

    const lockViewUp = detailView === "computer";
    desiredUp.copy(lockViewUp && face ? face.up : WORLD_UP);
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
          ? 16
          : detailView === "drawer"
            ? 3.7
          : detailView === "experience"
            ? 3.2
          : bookEntryStage === "zoom"
            ? 8.8
          : bookEntryStage === "focus"
            ? 2.8
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
            bookEntryStage !== "idle" ? 10 : detailView ? 7.2 : entering ? 4.8 : 3,
            delta,
          );
      state.camera.updateProjectionMatrix();
    }

    if (!reducedMotion && !preparing) {
      const stillMoving = state.camera.position.distanceTo(destination) > 0.002;
      if (stillMoving) invalidate();
    }
  });

  return null;
}

function isIntentionalClick(event: ThreeEvent<MouseEvent>) {
  return event.delta <= DRAG_CLICK_THRESHOLD;
}

function OverviewControls({
  apiRef,
  disabled,
}: {
  apiRef: MutableRefObject<OverviewViewApi | null>;
  disabled: boolean;
}) {
  const get = useThree((state) => state.get);
  const invalidate = useThree((state) => state.invalidate);
  const size = useThree((state) => state.size);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const initialized = useRef(false);
  const savedView = useRef<{ position: THREE.Vector3; target: THREE.Vector3; up: THREE.Vector3; zoom: number } | null>(null);
  const homeView = useRef<{ position: THREE.Vector3; target: THREE.Vector3; up: THREE.Vector3; zoom: number } | null>(null);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const camera = get().camera as THREE.OrthographicCamera;
    if (!initialized.current) {
      camera.zoom = Math.min(size.width / 18, size.height / 17);
      camera.updateProjectionMatrix();
      initialized.current = true;
    }
    const capture = () => {
      // Drain OrbitControls' private damping deltas before freezing the view.
      // This prevents a latent gesture from replaying when the book closes.
      if (controls.enableDamping) {
        for (let index = 0; index < 60; index += 1) controls.update();
      }
      return { position: camera.position.clone(), target: controls.target.clone(), up: camera.up.clone(), zoom: camera.zoom };
    };
    if (!homeView.current) homeView.current = capture();
    apiRef.current = {
      capture: () => { savedView.current = capture(); },
      restore: () => {
        const view = savedView.current;
        if (!view) return;
        camera.position.copy(view.position);
        camera.up.copy(view.up);
        controls.target.copy(view.target);
        camera.zoom = view.zoom;
        controls.update();
        camera.updateProjectionMatrix();
        invalidate();
      },
      reset: () => {
        const view = homeView.current;
        if (!view) return;
        camera.position.copy(view.position);
        camera.up.copy(view.up);
        controls.target.copy(view.target);
        camera.zoom = view.zoom;
        controls.update();
        camera.updateProjectionMatrix();
        invalidate();
      },
    };
    return () => { apiRef.current = null; };
  }, [apiRef, get, invalidate, size.height, size.width]);

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={!disabled}
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      enableZoom={false}
      rotateSpeed={0.6}
      minAzimuthAngle={THREE.MathUtils.degToRad(15)}
      maxAzimuthAngle={THREE.MathUtils.degToRad(75)}
      minPolarAngle={THREE.MathUtils.degToRad(40)}
      maxPolarAngle={THREE.MathUtils.degToRad(70)}
      target={OVERVIEW_TARGET.toArray()}
    />
  );
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
    if (!isIntentionalClick(event)) return;
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
    if (!isIntentionalClick(event)) return;
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
    if (!isIntentionalClick(event)) return;
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
            Click to view
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
    if (!isIntentionalClick(event)) return;
    // The book is the portfolio entrance: one click owns the complete
    // focus-and-enter sequence. Keep the second callback for compatibility
    // with the existing world wiring and direct keyboard activation.
    if (focused) onOpenPortfolio();
    else onInspect();
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

    </group>
  );
}

function RetroTopShelfItems({
  onOpenTeachingBook,
}: {
  onOpenTeachingBook: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    if (!isIntentionalClick(event)) return;
    onOpenTeachingBook();
  }

  return (
    <group>
      <mesh
        position={[-0.06, 3.35, -1.21]}
        onClick={handleClick}
        onPointerEnter={(event) => {
          event.stopPropagation();
          setHovered(true);
        }}
        onPointerLeave={() => setHovered(false)}
      >
        <planeGeometry args={[0.95, 1.16]} />
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
          position={[-0.06, 3.48, -1.1]}
          style={{ pointerEvents: "none" }}
        >
          <div className="computer-hover-prompt">
            <span>TEACHING · SHELF</span>
            Click to open book
          </div>
        </Html>
      )}
    </group>
  );
}

type TeachingBookDialogProps = {
  onClose: () => void;
  onOpenTeaching: () => void;
  reducedMotion: boolean;
};

type TeachingBookPage =
  | (typeof education)[number]
  | { kind: "closing"; title: string; summary: string };

function TeachingBookDialog({
  onClose,
  onOpenTeaching,
  reducedMotion,
}: TeachingBookDialogProps) {
  const [spreadStart, setSpreadStart] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"next" | "previous">("next");
  const [mobileMode, setMobileMode] = useState(false);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const flipTimerRef = useRef<number | null>(null);
  const bookPages: TeachingBookPage[] = [
    ...education,
    {
      kind: "closing",
      title: "Teaching, in progress.",
      summary: "Turn the page to continue exploring the courses, studios, and questions behind this work.",
    },
    {
      kind: "closing",
      title: "Keep learning.",
      summary: "The full teaching story is waiting in the Teaching section.",
    },
  ];
  const pageCount = bookPages.length;
  const canTurn = pageCount > 2;
  const leftPage = bookPages[spreadStart];
  const rightPage = bookPages[spreadStart + 1];

  useEffect(() => {
    const media = window.matchMedia("(max-width: 700px)");
    const updateMode = () => setMobileMode(media.matches);
    updateMode();
    media.addEventListener("change", updateMode);
    return () => media.removeEventListener("change", updateMode);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    dialog?.showModal();
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      if (flipTimerRef.current !== null) window.clearTimeout(flipTimerRef.current);
      flipTimerRef.current = null;
      document.body.style.overflow = previousOverflow;
      if (dialog?.open) dialog.close();
      previousFocusRef.current?.focus();
    };
  }, []);

  const turn = useCallback((direction: number) => {
    if (!canTurn || flipping) return;
    const step = mobileMode ? Math.sign(direction) : direction;
    const maxStart = mobileMode ? pageCount - 1 : Math.max(0, pageCount - 2);
    const next = Math.max(0, Math.min(spreadStart + step, maxStart));
    if (next === spreadStart) return;
    if (reducedMotion || mobileMode) {
      setSpreadStart(next);
      return;
    }
    setFlipDirection(direction > 0 ? "next" : "previous");
    setFlipping(true);
    if (flipTimerRef.current !== null) window.clearTimeout(flipTimerRef.current);
    flipTimerRef.current = window.setTimeout(() => {
      setSpreadStart(next);
      setFlipping(false);
      flipTimerRef.current = null;
    }, PAGE_FLIP_MS);
  }, [canTurn, flipping, mobileMode, pageCount, reducedMotion, spreadStart]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        turn(-2);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        turn(2);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [turn]);

  function renderPage(
    page: TeachingBookPage | undefined,
    side: "left" | "right",
    pageIndex = spreadStart + (side === "left" ? 0 : 1),
    extraClass = "",
  ) {
    const pageClass = `teaching-book-page teaching-book-page--${side} ${extraClass}`.trim();
    if (!page) {
      return (
        <article className={`${pageClass} teaching-book-page--empty`}>
          <span className="teaching-book-page-number">✦</span>
          <p>More chapters soon.</p>
          <a href="/teaching" onClick={(event) => { event.stopPropagation(); onOpenTeaching(); }}>
            Teaching
          </a>
        </article>
      );
    }
    if ("kind" in page) {
      return (
        <article className={`${pageClass} teaching-book-page--closing`}>
          <span className="teaching-book-page-number">{String(pageIndex + 1).padStart(2, "0")}</span>
          <p className="teaching-book-period">A note from the shelf</p>
          <h2>{page.title}</h2>
          <p className="teaching-book-summary">{page.summary}</p>
          <a href="/teaching" onClick={(event) => { event.stopPropagation(); onOpenTeaching(); }}>
            Teaching <span aria-hidden="true">↗</span>
          </a>
        </article>
      );
    }
    return (
      <article className={pageClass}>
        <span className="teaching-book-page-number">{String(pageIndex + 1).padStart(2, "0")}</span>
        <p className="teaching-book-period">{page.period}</p>
        <h2>{page.institution}</h2>
        <h3>{page.degree}</h3>
        <p className="teaching-book-summary">{page.summary ?? page.details}</p>
        <a href="/teaching" onClick={(event) => { event.stopPropagation(); onOpenTeaching(); }}>
          Teaching <span aria-hidden="true">↗</span>
        </a>
      </article>
    );
  }

  function renderFlipLeaf(direction: "next" | "previous") {
    const isNext = direction === "next";
    const frontPage = isNext ? rightPage : leftPage;
    const backPage = isNext
      ? bookPages[spreadStart + 2]
      : bookPages[spreadStart - 1];
    const frontSide = isNext ? "right" : "left";
    const backSide = isNext ? "left" : "right";
    const frontIndex = isNext ? spreadStart + 1 : spreadStart;
    const backIndex = isNext ? spreadStart + 2 : spreadStart - 1;
    return (
      <div className={`teaching-book-flip-leaf teaching-book-flip-leaf--${direction}`}>
        {renderPage(frontPage, frontSide, frontIndex, "teaching-book-flip-face teaching-book-flip-face--front")}
        {renderPage(backPage, backSide, backIndex, "teaching-book-flip-face teaching-book-flip-face--back")}
      </div>
    );
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label="Teaching education book"
      className="teaching-book-dialog"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="teaching-book-stage">
        <button ref={closeButtonRef} className="teaching-book-close" type="button" onClick={onClose} aria-label="Close book">×</button>
        <div className={`teaching-book ${flipping ? "is-flipping" : ""} is-flipping-${flipDirection}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="teaching-book-art" src="/assets/teaching-journal-clean.png" alt="" aria-hidden="true" />
          <div className={`teaching-book-spread${mobileMode ? " teaching-book-spread--single" : ""}`}>
            {mobileMode ? (
              renderPage(bookPages[spreadStart], "right", spreadStart, "teaching-book-page--single")
            ) : (
              <>
                {flipping && flipDirection === "previous"
                  ? renderFlipLeaf("previous")
                  : renderPage(leftPage, "left")}
                <div className="teaching-book-spine" aria-hidden="true" />
                {flipping && flipDirection === "next" && renderPage(
                  bookPages[spreadStart + 3],
                  "right",
                  spreadStart + 3,
                  "teaching-book-page--incoming",
                )}
                {flipping && flipDirection === "next"
                  ? renderFlipLeaf("next")
                  : renderPage(rightPage, "right")}
              </>
            )}
          </div>
        </div>
        {canTurn && (
          <nav className="teaching-book-controls" aria-label="Book pages">
            <button type="button" onClick={() => turn(-2)} disabled={flipping || spreadStart === 0}>← Previous</button>
            <span>{mobileMode ? spreadStart + 1 : Math.floor(spreadStart / 2) + 1} / {mobileMode ? pageCount : Math.ceil(pageCount / 2)}</span>
            <button type="button" onClick={() => turn(2)} disabled={flipping || (mobileMode ? spreadStart + 1 >= pageCount : spreadStart + 2 >= pageCount)}>Next →</button>
          </nav>
        )}
      </div>
    </dialog>
  );
}

function RetroSideBriefcase({
  onOpenExperience,
}: {
  onOpenExperience: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    if (!isIntentionalClick(event)) return;
    onOpenExperience();
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
            Click to open Experience
          </div>
        </Html>
      )}
    </group>
  );
}

function RetroResearchDrawers({
  onOpenResearch,
}: {
  onOpenResearch: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    if (!isIntentionalClick(event)) return;
    onOpenResearch();
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
            Click to open Research folders
          </div>
        </Html>
      )}
    </group>
  );
}

function RetroDesk({
  portfolioFocused,
  onInspectPortfolio,
  onOpenPortfolio,
  onOpenTeachingBook,
  onOpenExperience,
  onOpenResearch,
}: {
  portfolioFocused: boolean;
  onInspectPortfolio: () => void;
  onOpenPortfolio: () => void;
  onOpenTeachingBook: () => void;
  onOpenExperience: () => void;
  onOpenResearch: () => void;
}) {

  return (
    <group position={[-0.965, 0.84, -1.94]}>
      <StudyModelSlot
        config={studyModelConfigs.desk}
        fallback={null}
      />

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
        onOpenTeachingBook={onOpenTeachingBook}
      />
      <RetroDesktopCraftSet
        focused={portfolioFocused}
        onInspect={onInspectPortfolio}
        onOpenPortfolio={onOpenPortfolio}
      />
      <RetroDeskLamp />
      <RetroSideBriefcase
        onOpenExperience={onOpenExperience}
      />
      <RetroResearchDrawers
        onOpenResearch={onOpenResearch}
      />
    </group>
  );
}

function RetroLaptop({
  focused,
  onInspect,
  onOpenProject,
}: {
  focused: boolean;
  onInspect: () => void;
  onOpenProject: (index: number) => void;
}) {
  const [hoveredProject, setHoveredProject] = useState<number | null>(null);
  const screenTexture = useLaptopFolderTexture(hoveredProject);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = (hovered && !focused) || hoveredProject !== null ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [focused, hovered, hoveredProject]);

  function handleLaptopClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    if (!isIntentionalClick(event)) return;
    if (!focused) {
      onInspect();
    }
  }

  function handleProjectClick(event: ThreeEvent<MouseEvent>, index: number) {
    event.stopPropagation();
    if (!isIntentionalClick(event) || !focused) return;
    onOpenProject(index);
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
          position={[0, 0.48, 0.18]}
          onClick={handleLaptopClick}
        >
          <planeGeometry args={[1.27, 0.74]} />
          <meshBasicMaterial
            color={screenTexture ? "#ffffff" : "#171c28"}
            map={screenTexture ?? undefined}
            toneMapped={false}
          />
        </mesh>
        {focused && projectFolderLayouts.slice(0, projects.length).map((layout, index) => (
          <mesh
            key={index}
            position={[layout.screenX, layout.screenY, 0.19]}
            onClick={(event) => handleProjectClick(event, index)}
            onPointerEnter={(event) => {
              event.stopPropagation();
              setHoveredProject(index);
            }}
            onPointerLeave={() => setHoveredProject(null)}
          >
            <planeGeometry args={[0.45, 0.25]} />
            <meshBasicMaterial
              depthWrite={false}
              opacity={0}
              side={THREE.DoubleSide}
              transparent
            />
          </mesh>
        ))}

      </group>
      {hovered && !focused && (
        <Html
          center
          position={[0, 1.18, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="computer-hover-prompt">
            <span>PROJECTS · COMPUTER</span>
            Open project folders
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
  bookEntryStage,
  computerFocused,
  experienceFocused,
  portfolioFocused,
  researchFocused,
  phoneFocused,
  studentCardFocused,
  teachingBookOpen,
  reducedMotion,
  onInspectComputer,
  onOpenComputerProject,
  onInspectPortfolio,
  onOpenPortfolio,
  onOpenTeachingBook,
  onOpenExperience,
  onInspectPhone,
  onInspectStudentCard,
  onOpenResearch,
  overviewViewApiRef,
}: {
  focus: Point | null;
  entering: boolean;
  bookEntryStage: "idle" | "focus" | "zoom";
  computerFocused: boolean;
  experienceFocused: boolean;
  portfolioFocused: boolean;
  researchFocused: boolean;
  phoneFocused: boolean;
  studentCardFocused: boolean;
  teachingBookOpen: boolean;
  reducedMotion: boolean;
  onInspectComputer: () => void;
  onOpenComputerProject: (index: number) => void;
  onInspectPortfolio: () => void;
  onOpenPortfolio: () => void;
  onOpenTeachingBook: () => void;
  onOpenExperience: () => void;
  onInspectPhone: () => void;
  onInspectStudentCard: () => void;
  onOpenResearch: () => void;
  overviewViewApiRef: MutableRefObject<OverviewViewApi | null>;
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
        shadow-mapSize={[1024, 1024]}
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
            onInspectPortfolio={onInspectPortfolio}
            onOpenPortfolio={onOpenPortfolio}
            onOpenTeachingBook={onOpenTeachingBook}
            onOpenExperience={onOpenExperience}
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
            onOpenProject={onOpenComputerProject}
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
        <RetroWallHooks focused={studentCardFocused} onInspect={onInspectStudentCard} />
        <WindowAndCurtains />

      </group>

      <CameraRig
        floorLift={floorLift}
        preparing={phase !== "ready"}
        bookEntryStage={bookEntryStage}
        detailView={
          computerFocused
            ? "computer"
            : researchFocused
              ? "drawer"
            : experienceFocused
              ? "experience"
            : portfolioFocused
              ? "portfolio"
              : null
        }
        entering={entering}
        focus={
          computerFocused
            ? LAPTOP_FOCUS_POINT
            : researchFocused
              ? DRAWER_FOCUS_POINT
            : experienceFocused
              ? EXPERIENCE_FOCUS_POINT
            : portfolioFocused
              ? PORTFOLIO_FOCUS_POINT
              : focus
        }
        reducedMotion={reducedMotion}
      />
      <OverviewControls
        apiRef={overviewViewApiRef}
        disabled={phase !== "ready" || teachingBookOpen || studentCardFocused || Boolean(focus || entering || computerFocused || researchFocused || experienceFocused || portfolioFocused || phoneFocused)}
      />
      <StudyDiagnostics />
      <StudyScenePreparation />
    </>
  );
}

export function StudyScene() {
  const store = useStudyLoading();
  const { phase, run } = useStudyLoadingSnapshot();
  useEffect(() => {
    store.configure(studyAssets);
    preloadStudyAssets(store, false);
  }, [store]);
  useEffect(() => {
    if (phase !== "ready") return;
    const timer = window.setTimeout(preloadPortfolio, 1400);
    let idleId: number | undefined;
    let backgroundTimer: number | undefined;
    const release = () => {
      preloadStudyAssets(store, true);
      store.releaseBackground(run);
    };
    const requestIdleCallback = (window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number }).requestIdleCallback;
    if (requestIdleCallback) {
      idleId = requestIdleCallback(release, { timeout: 900 });
    } else {
      backgroundTimer = window.setTimeout(release, 450);
    }
    return () => {
      window.clearTimeout(timer);
      const cancelIdleCallback = (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
      if (idleId !== undefined) cancelIdleCallback?.(idleId);
      if (backgroundTimer !== undefined) window.clearTimeout(backgroundTimer);
    };
  }, [phase, run, store]);
  if (phase === "module" || phase === "unavailable") return null;
  return <StudySceneContent />;
}

function StudySceneContent() {
  const store = useStudyLoading();
  const { phase: scenePhase } = useStudyLoadingSnapshot();
  const renderer = useRef<THREE.WebGLRenderer | null>(null);
  const rendererSetup = useRef<Promise<THREE.WebGLRenderer> | null>(null);
  const createRenderer = useCallback((defaults: {
    canvas: EventTarget;
    alpha?: boolean;
    antialias?: boolean;
    powerPreference?: WebGLPowerPreference;
  }) => createStudyRenderer(store, renderer, rendererSetup, defaults), [store]);
  const router = useRouter();
  const [focus, setFocus] = useState<Point | null>(null);
  const [entering, setEntering] = useState(false);
  const [bookEntryStage, setBookEntryStage] = useState<"idle" | "focus" | "zoom">("idle");
  const [activeView, setActiveView] = useState<"computer" | "drawerResearch" | "experience" | "portfolio" | "phone" | "teachingBook" | "studentCard" | null>(() => {
    if (typeof window === "undefined") return null;
    const view = new URLSearchParams(window.location.search).get("view");
    return view === "computer" ? "computer" : view === "research" ? "drawerResearch" : null;
  });
  const overviewViewApiRef = useRef<OverviewViewApi | null>(null);
  const entryTimersRef = useRef<number[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const inspecting = activeView !== null && activeView !== "teachingBook";

  useEffect(() => {
    return () => {
      entryTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      entryTimersRef.current = [];
    };
  }, []);
  useEffect(() => {
    if (scenePhase !== "ready") return;
    if (activeView !== "computer" && activeView !== "drawerResearch") return;

    overviewViewApiRef.current?.capture();
    window.history.replaceState(null, "", window.location.pathname);
  }, [activeView, scenePhase]);
  useEffect(() => {
    if (scenePhase !== "ready") return;
    const timer = window.setTimeout(() => {
      router.prefetch("/portfolio");
      router.prefetch("/?view=research");
      projects.forEach((project) => router.prefetch(`/projects/${project.slug}`));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [router, scenePhase]);
  const clearInspect = useCallback(() => {
    entryTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    entryTimersRef.current = [];
    overviewViewApiRef.current?.restore();
    setFocus(null);
    setEntering(false);
    setBookEntryStage("idle");
    setActiveView(null);
  }, []);

  function inspect(view: "computer" | "experience" | "phone") {
    if (entering || activeView !== null || bookEntryStage !== "idle") return;
    overviewViewApiRef.current?.capture();
    setFocus(view === "experience" ? EXPERIENCE_FOCUS_POINT : null);
    setActiveView(view);
  }

  function openTeachingBook() {
    if (entering || activeView !== null) return;
    overviewViewApiRef.current?.capture();
    setFocus(null);
    setActiveView("teachingBook");
  }

  function openStudentCard() {
    if (entering || activeView !== null || bookEntryStage !== "idle") return;
    overviewViewApiRef.current?.capture();
    setFocus(null);
    setActiveView("studentCard");
  }

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (!inspecting || activeView === "drawerResearch" || activeView === "experience" || activeView === "studentCard") return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      clearInspect();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [inspecting, activeView, clearInspect]);

  function startPortfolioEntry() {
    if (entering || activeView !== null || bookEntryStage !== "idle") return;
    preloadPortfolio();
    overviewViewApiRef.current?.capture();
    setFocus(PORTFOLIO_FOCUS_POINT);
    setActiveView("portfolio");
    setBookEntryStage("focus");
    if (reducedMotion) {
      setEntering(true);
      const timer = window.setTimeout(() => router.push("/portfolio"), BOOK_REDUCED_MOTION_MS);
      entryTimersRef.current.push(timer);
      return;
    }
    // Begin the close-up while the focus camera is still settling. The two
    // phases overlap so there is no visually idle frame between them.
    const focusTimer = window.setTimeout(() => {
      setBookEntryStage("zoom");
      setEntering(true);
    }, BOOK_FOCUS_MS);
    const routeTimer = window.setTimeout(() => router.push("/portfolio"), BOOK_ENTRY_MS);
    entryTimersRef.current.push(focusTimer, routeTimer);
  }

  function openComputerProject(index: number) {
    if (entering || activeView !== "computer") return;
    const project = projects[index];
    if (!project) return;
    setEntering(true);
    const timer = window.setTimeout(
      () => router.push(`/projects/${project.slug}`),
      reducedMotion ? 80 : 360,
    );
    entryTimersRef.current.push(timer);
  }

  function openResearchFolders() {
    if (entering || activeView !== null || bookEntryStage !== "idle") return;
    overviewViewApiRef.current?.capture();
    setFocus(DRAWER_FOCUS_POINT);
    setActiveView("drawerResearch");
  }

  const computerFocused = activeView === "computer";
  const researchFocused = activeView === "drawerResearch";

  return (
    <div
      tabIndex={-1}
      className={`study-canvas ${entering ? "is-entering" : ""} ${
        inspecting ? "is-inspecting" : ""
      }`}
    >
      <Canvas
        orthographic
        // Three already falls back to PCF for the deprecated soft mode. Pin
        // that same effective mode so loading updates do not flip shader variants.
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 1.35]}
        // Keep the renderer continuous only while the book transition owns
        // the camera; the room returns to demand rendering afterward.
        frameloop={bookEntryStage !== "idle" || entering ? "always" : "demand"}
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
          researchFocused={researchFocused}
          experienceFocused={activeView === "experience"}
          portfolioFocused={activeView === "portfolio"}
          phoneFocused={activeView === "phone"}
          studentCardFocused={activeView === "studentCard"}
          teachingBookOpen={activeView === "teachingBook"}
          entering={entering}
          bookEntryStage={bookEntryStage}
          focus={focus}
          onInspectComputer={() => inspect("computer")}
          onOpenComputerProject={openComputerProject}
          onInspectPortfolio={startPortfolioEntry}
          onOpenPortfolio={startPortfolioEntry}
          onOpenTeachingBook={openTeachingBook}
          onOpenExperience={() => inspect("experience")}
          onInspectPhone={() => inspect("phone")}
          onInspectStudentCard={openStudentCard}
          onOpenResearch={openResearchFolders}
          overviewViewApiRef={overviewViewApiRef}
          reducedMotion={reducedMotion}
        />
      </Canvas>
      {!inspecting && !entering && (
        <>
          <div className="study-drag-hint" aria-hidden="true">Drag to explore</div>
          <button
            className="study-view-reset"
            type="button"
            onClick={() => overviewViewApiRef.current?.reset()}
          >
            Reset view
          </button>
        </>
      )}
      {activeView === "drawerResearch" && <ResearchFolders onClose={clearInspect} reducedMotion={reducedMotion} />}
      {activeView === "computer" && (
        <div className="computer-inspection-ui computer-inspection-ui--desktop" aria-live="polite">
          <button
            className="computer-inspection-back"
            type="button"
            onClick={clearInspect}
          >
            <span aria-hidden="true">←</span>
            Back to room
          </button>
          <div className="computer-detail-card">
            <span>PROJECT DESKTOP</span>
            <strong>Choose a folder</strong>
            <p>The screen is active. Select a folder to open that project directly.</p>
            <small>Click a folder · Esc to return</small>
          </div>
        </div>
      )}
      {activeView === "experience" && <ExperienceCards onClose={clearInspect} reducedMotion={reducedMotion} />}
      {activeView === "phone" && (
        <div className="computer-inspection-ui" aria-live="polite">
          <button
            className="computer-inspection-back"
            type="button"
            onClick={clearInspect}
          >
            <span aria-hidden="true">←</span>
            Back to room
          </button>
          <PhoneGuestbook />
        </div>
      )}
      {activeView === "teachingBook" && (
        <TeachingBookDialog
          onClose={clearInspect}
          onOpenTeaching={() => router.push("/teaching")}
          reducedMotion={reducedMotion}
        />
      )}
      {activeView === "studentCard" && (
        <StudentCardDialog onClose={clearInspect} reducedMotion={reducedMotion} />
      )}
    </div>
  );
}
