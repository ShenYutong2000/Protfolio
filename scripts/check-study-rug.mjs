// Read the actual GLB triangles, using the same fit/anchor transforms as StudyModel.
// Run after changing the rug footprint or positions of floor-standing models.
import assert from "node:assert/strict";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
import * as THREE from "three";
import { studyModelConfigs as configs } from "../src/components/study/studyModels.ts";

await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder });

async function load(config, parentPosition = [0, 0, 0], parentYaw = 0, parentScale = 1) {
  const document = await io.read(`public${config.src}`);
  const model = new THREE.Group();
  for (const node of document.getRoot().listNodes()) {
    if (!node.getMesh()) continue;
    for (const primitive of node.getMesh().listPrimitives()) {
      const accessor = primitive.getAttribute("POSITION");
      const values = new Float32Array(accessor.getCount() * 3);
      for (let i = 0; i < accessor.getCount(); i++) values.set(accessor.getElement(i, []), i * 3);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(values, 3));
      if (primitive.getIndices()) geometry.setIndex(Array.from(primitive.getIndices().getArray()));
      const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
      mesh.applyMatrix4(new THREE.Matrix4().fromArray(node.getWorldMatrix()));
      model.add(mesh);
    }
  }
  model.rotation.set(...(config.rotation ?? [0, 0, 0]));
  model.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
  const fit = config.targetHeight / Math.max(size.y, 0.0001);
  const scale = typeof config.scale === "number" ? [config.scale, config.scale, config.scale] : config.scale ?? [1, 1, 1];
  model.scale.set(...scale.map(value => value * fit));
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  const anchor = config.anchor === "top" ? bounds.max.y : config.anchor === "center" ? center.y : bounds.min.y;
  model.position.set(-center.x, -anchor, -center.z).add(new THREE.Vector3(...(config.offset ?? [0, 0, 0])));
  const slot = new THREE.Group();
  slot.position.set(...(config.position ?? [0, 0, 0]));
  slot.add(model);
  const parent = new THREE.Group();
  parent.position.set(...parentPosition);
  parent.rotation.y = parentYaw;
  parent.scale.setScalar(parentScale);
  parent.add(slot);
  parent.updateMatrixWorld(true);
  return parent;
}

const floorY = -2.08;
const rug = await load(configs.rug);
const rugBounds = new THREE.Box3().setFromObject(rug);
const lift = rugBounds.max.y - floorY;
const objects = [
  ["desk", [-0.965, 0.84 + lift, -1.94]],
  ["chair", [0, lift, 0]],
  ["schoolBag", [0, lift, 0]],
  ["bookStackFloor", [0, lift, 0]],
  ["printer", [2.55, floorY + lift, -2.35], THREE.MathUtils.degToRad(-10), 1.2],
  ["phone", [3.08, floorY + lift, -0.18], THREE.MathUtils.degToRad(-45)],
];
const round = v => v.toArray().map(n => +n.toFixed(5));
console.log("Rug", { min: round(rugBounds.min), max: round(rugBounds.max), lift });
const ray = new THREE.Raycaster();
const results = [];
for (const [key, position, yaw, scale] of objects) {
  const model = await load(configs[key], position, yaw, scale);
  const bounds = new THREE.Box3().setFromObject(model);
  const supports = [];
  const vertices = [];
  model.traverse(child => {
    if (!child.isMesh) return;
    const positions = child.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const point = new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(child.matrixWorld);
      vertices.push(point);
      if (point.y <= bounds.min.y + 0.002) supports.push(point);
    }
  });
  let minGap = Infinity;
  let maxGap = -Infinity;
  let missed = 0;
  for (const point of supports) {
    ray.set(new THREE.Vector3(point.x, rugBounds.max.y + 1, point.z), new THREE.Vector3(0, -1, 0));
    const hit = ray.intersectObject(rug, true)[0];
    if (!hit) { missed++; continue; }
    minGap = Math.min(minGap, point.y - hit.point.y);
    maxGap = Math.max(maxGap, point.y - hit.point.y);
  }
  const margin = vertices.reduce((value, p) => Math.min(value, p.x - rugBounds.min.x, rugBounds.max.x - p.x, p.z - rugBounds.min.z, rugBounds.max.z - p.z), Infinity);
  results.push({ key, margin, minGap, maxGap, supports: supports.length, missed });
  console.log(key, { min: round(bounds.min), max: round(bounds.max), margin, minGap, maxGap, supports: supports.length, missed });
}
if (process.argv.includes("--verify")) {
  assert.ok(Math.abs(rugBounds.min.y - floorY) < 0.0001, "Rug bottom must touch the floor");
  assert.ok(rugBounds.min.x >= -3.6 && rugBounds.max.x <= 3.96, "Rug must stay inside left wall and flat floor edge");
  assert.ok(rugBounds.min.z >= -3.7 && rugBounds.max.z <= 3.86, "Rug must stay inside back wall and flat floor edge");
  for (const r of results) {
    assert.ok(r.margin >= 0, `${r.key} extends past rug bounds`);
    assert.ok(r.supports > 0 && r.missed === 0, `${r.key} has unsupported ground contacts`);
    assert.ok(r.minGap >= -0.0001, `${r.key} penetrates rug`);
    assert.ok(r.minGap < 0.003 && r.maxGap < 0.005, `${r.key} floats above rug`);
  }
  console.log("PASS: footprint coverage, real triangle support, floor/wall clearance and rug contact.");
}
