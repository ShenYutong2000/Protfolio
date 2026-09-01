import * as THREE from "three";

export type ObjectModelFactory = (
  options?: { seed?: number },
) => THREE.Group;

function material(color: string, roughness: number, metalness = 0) {
  return new THREE.MeshPhysicalMaterial({
    color,
    clearcoat: 0.18,
    clearcoatRoughness: 0.42,
    metalness,
    roughness,
  });
}

function addRuntimeMetadata(root: THREE.Group) {
  const nodes: Record<string, THREE.Object3D> = {};
  root.traverse((child) => {
    if (child.name) nodes[child.name] = child;
  });

  root.userData.sculptRuntime = {
    nodes,
    sockets: {
      grip: nodes["socket-grip"],
      lens: nodes["socket-lens"],
    },
    colliders: [
      { id: "body-collider", type: "box", size: [1.7, 0.9, 1.12] },
      { id: "lens-collider", type: "cylinder", radius: 0.38, height: 0.22 },
    ],
    destructionGroups: ["body", "lens", "shutter"],
  };
}

/**
 * A small hand-authored factory used to verify the img2threejs runtime contract.
 * A generated factory can replace this module without changing the viewer.
 */
export const createDemoObjectModel: ObjectModelFactory = (options) => {
  const root = new THREE.Group();
  root.name = "demo-camera-root";
  root.userData.img2threejs = {
    generated: false,
    note: "Replace with a factory generated from ObjectSculptSpec.",
    seed: options?.seed ?? 7,
  };

  const bodyPivot = new THREE.Group();
  bodyPivot.name = "body";
  root.add(bodyPivot);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.9, 1.12),
    material("#d7c8b6", 0.55),
  );
  body.name = "body-visual";
  body.castShadow = true;
  body.receiveShadow = true;
  bodyPivot.add(body);

  const topPlate = new THREE.Mesh(
    new THREE.BoxGeometry(1.26, 0.08, 0.72),
    material("#5c777a", 0.28, 0.42),
  );
  topPlate.name = "top-plate";
  topPlate.position.y = 0.49;
  topPlate.castShadow = true;
  bodyPivot.add(topPlate);

  const lensPivot = new THREE.Group();
  lensPivot.name = "lens";
  lensPivot.position.set(0, -0.02, 0.63);
  bodyPivot.add(lensPivot);

  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.39, 0.31, 0.24, 32),
    material("#32484e", 0.2, 0.66),
  );
  lens.name = "lens-visual";
  lens.rotation.x = Math.PI / 2;
  lens.castShadow = true;
  lensPivot.add(lens);

  const lensGlass = new THREE.Mesh(
    new THREE.CircleGeometry(0.26, 32),
    new THREE.MeshPhysicalMaterial({
      color: "#7fc4c8",
      metalness: 0.24,
      roughness: 0.08,
      transmission: 0.28,
      transparent: true,
    }),
  );
  lensGlass.name = "lens-glass";
  lensGlass.position.z = 0.13;
  lensGlass.rotation.x = -Math.PI / 2;
  lensPivot.add(lensGlass);

  const shutterPivot = new THREE.Group();
  shutterPivot.name = "shutter";
  shutterPivot.position.set(0.58, 0.54, -0.18);
  bodyPivot.add(shutterPivot);
  const shutter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.08, 20),
    material("#e7a37f", 0.34),
  );
  shutter.name = "shutter-visual";
  shutter.castShadow = true;
  shutterPivot.add(shutter);

  const gripSocket = new THREE.Object3D();
  gripSocket.name = "socket-grip";
  gripSocket.position.set(-0.86, -0.08, 0);
  bodyPivot.add(gripSocket);

  const lensSocket = new THREE.Object3D();
  lensSocket.name = "socket-lens";
  lensSocket.position.set(0, 0, 0.83);
  lensPivot.add(lensSocket);

  addRuntimeMetadata(root);
  return root;
};
