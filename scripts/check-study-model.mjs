import fs from "node:fs";
import path from "node:path";

const modelsDir = path.resolve(process.cwd(), "public/models/study");
const maxBytes = 3 * 1024 * 1024;
const maxTriangles = 80_000;

if (!fs.existsSync(modelsDir)) {
  console.error(`Missing study model directory: ${modelsDir}`);
  process.exit(1);
}

const modelPaths = fs
  .readdirSync(modelsDir)
  .filter((fileName) => fileName.endsWith(".glb"))
  .map((fileName) => path.join(modelsDir, fileName))
  .sort();

if (modelPaths.length === 0) {
  console.error(`No GLB files found in ${modelsDir}`);
  process.exit(1);
}

let hasFailures = false;

for (const modelPath of modelPaths) {
  const buffer = fs.readFileSync(modelPath);
  const modelName = path.basename(modelPath);
  const failures = [];

  if (buffer.toString("ascii", 0, 4) !== "glTF") {
    failures.push("not a valid GLB file");
  } else {
    const jsonLength = buffer.readUInt32LE(12);
    const document = JSON.parse(buffer.toString("utf8", 20, 20 + jsonLength));
    const accessors = document.accessors ?? [];
    const triangles = (document.meshes ?? []).reduce((total, mesh) => {
      return (
        total +
        (mesh.primitives ?? []).reduce((meshTotal, primitive) => {
          const indexAccessor =
            primitive.indices == null ? null : accessors[primitive.indices];
          const positionAccessor =
            primitive.attributes?.POSITION == null
              ? null
              : accessors[primitive.attributes.POSITION];
          const count = indexAccessor?.count ?? positionAccessor?.count ?? 0;
          return meshTotal + Math.floor(count / 3);
        }, 0)
      );
    }, 0);

    if (triangles > maxTriangles) {
      failures.push(`triangle count ${triangles} exceeds ${maxTriangles}`);
    }
    if ((document.animations ?? []).length > 0) {
      failures.push("animations are not allowed for static study models");
    }
    if ((document.cameras ?? []).length > 0) {
      failures.push("embedded cameras are not allowed in study models");
    }

    console.log(
      `${modelName}: ${(buffer.byteLength / 1024).toFixed(0)} KB, ${triangles} triangles`,
    );
  }

  if (buffer.byteLength > maxBytes) {
    failures.push(
      `file size ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB exceeds 3 MB`,
    );
  }

  if (failures.length > 0) {
    hasFailures = true;
    console.error(`${modelName}: ${failures.map((failure) => `- ${failure}`).join("; ")}`);
  }
}

if (hasFailures) {
  process.exit(1);
}
