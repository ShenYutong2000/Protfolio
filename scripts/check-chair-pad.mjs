// Inspect actual GLB surfaces when positioning a cushion, not only model bounds.
import { NodeIO } from "@gltf-transform/core";
import assert from "node:assert/strict";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";
import { studyModelConfigs as configs } from "../src/components/study/studyModels.ts";

await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder });

async function load(config) {
  const doc = await io.read(`public${config.src}`);
  const root = new THREE.Group();
  for (const node of doc.getRoot().listNodes()) {
    if (!node.getMesh()) continue;
    for (const primitive of node.getMesh().listPrimitives()) {
      const positions = primitive.getAttribute("POSITION");
      const array = new Float32Array(positions.getCount() * 3);
      for (let i = 0; i < positions.getCount(); i++) array.set(positions.getElement(i, []), i * 3);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(array, 3));
      if (primitive.getIndices()) geometry.setIndex(Array.from(primitive.getIndices().getArray()));
      const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
      mesh.applyMatrix4(new THREE.Matrix4().fromArray(node.getWorldMatrix()));
      root.add(mesh);
    }
  }
  root.rotation.set(...config.rotation);
  root.updateMatrixWorld(true);
  const height = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3()).y;
  const scale = typeof config.scale === "number" ? [config.scale, config.scale, config.scale] : config.scale ?? [1, 1, 1];
  root.scale.set(...scale.map(v => v * config.targetHeight / height));
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root);
  const center = bounds.getCenter(new THREE.Vector3());
  root.position.set(-center.x, -bounds.min.y, -center.z).add(new THREE.Vector3(...config.position));
  root.updateMatrixWorld(true);
  return root;
}

const chair = await load(configs.chair);
const pad = await load(configs.chairPad);
const chairBounds = new THREE.Box3().setFromObject(chair);
const padBounds = new THREE.Box3().setFromObject(pad);
console.log("Chair bounds", chairBounds.min.toArray(), chairBounds.max.toArray());
console.log("Cushion bounds", padBounds.min.toArray(), padBounds.max.toArray());
const ray = new THREE.Raycaster();
const down = new THREE.Vector3(0, -1, 0);
function surface(object, x, z, y = 1.5) {
  ray.set(new THREE.Vector3(x, y, z), down);
  return ray.intersectObject(object, true)[0]?.point.y;
}
if (process.argv.includes("--survey")) {
  let area = 0;
  const centroid = new THREE.Vector3();
  const seatBounds = new THREE.Box3();
  chair.traverse(mesh => {
    if (!mesh.isMesh) return;
    const vertices = mesh.geometry.attributes.position;
    const indices = mesh.geometry.index;
    for (let i = 0; i < indices.count; i += 3) {
      const points = [0, 1, 2].map(k => new THREE.Vector3().fromBufferAttribute(vertices, indices.getX(i + k)).applyMatrix4(mesh.matrixWorld));
      if (points.some(p => p.y < 0.48 || p.y > 0.51)) continue;
      const normal = points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0]));
      const weight = Math.abs(normal.y) / 2;
      if (Math.abs(normal.y) < 0.95 * normal.length()) continue;
      area += weight;
      for (const p of points) { centroid.addScaledVector(p, weight / 3); seatBounds.expandByPoint(p); }
    }
  });
  console.log("Seat surface", {center: centroid.divideScalar(area).toArray(), min: seatBounds.min.toArray(), max: seatBounds.max.toArray()});
  // Sample below the backrest to locate the seating plane in room coordinates.
  for (let z = 0.9; z <= 3.3; z += 0.2) {
    const row = [];
    for (let x = -3; x <= -0.5; x += 0.2) {
      const y = surface(chair, x, z);
      row.push(y == null ? "-" : y.toFixed(3));
    }
    console.log("z", z.toFixed(1), "x -3 .. -0.6:", row.join(" "));
  }
}

// For each cushion mesh vertex, compare with the chair surface at the same X/Z.
let deepestGap = Infinity;
let closestBaseGap = Infinity;
let bottomMisses = 0;
let bottomSamples = 0;
pad.traverse(mesh => {
  if (!mesh.isMesh) return;
  const positions = mesh.geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const p = new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld);
    const y = surface(chair, p.x, p.z);
    if (y != null) deepestGap = Math.min(deepestGap, p.y - y);
    if (p.y > padBounds.min.y + 0.025) continue;
    bottomSamples++;
    if (y == null || y < -0.1) bottomMisses++;
    else closestBaseGap = Math.min(closestBaseGap, p.y - y);
  }
});
console.log({ deepestGap, closestBaseGap, bottomSamples, bottomMisses });
if (process.argv.includes("--verify")) {
  assert.ok(bottomSamples > 0 && bottomMisses === 0, "The entire cushion base must be supported by the seat");
  assert.ok(deepestGap >= 0, "The cushion penetrates the seat or backrest");
  assert.ok(closestBaseGap <= 0.002, "The cushion floats above the seat");
  chair.traverse(chairMesh => {
    if (!chairMesh.isMesh) return;
    const tree = new MeshBVH(chairMesh.geometry);
    pad.traverse(padMesh => {
      if (!padMesh.isMesh) return;
      const relative = new THREE.Matrix4().copy(chairMesh.matrixWorld).invert().multiply(padMesh.matrixWorld);
      assert.ok(!tree.intersectsGeometry(padMesh.geometry, relative), "Cushion triangles intersect chair triangles");
    });
  });
  console.log("PASS: cushion supported by seat, contact gap below 0.002, no chair/cushion triangle intersections.");
}
