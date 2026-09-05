import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const publicRoot = path.join(root, "public");
const sourceRoots = [path.join(root, "src"), path.join(root, "scripts")];
const ignoredDirectories = new Set(["portfolio-template"]);
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".css"]);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return [fullPath];
  });
}

const sourceText = sourceRoots
  .flatMap((directory) => walk(directory))
  .filter((file) => sourceExtensions.has(path.extname(file)))
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");

const publicFiles = walk(publicRoot).filter((file) => {
  const relative = path.relative(publicRoot, file);
  return !relative.split(path.sep).some((part) => ignoredDirectories.has(part));
});
const missing = [];
const unreferenced = [];
const criticalAssets = [
  "assets/study-wallpaper.jpg",
  "assets/study-floor.webp",
  "models/study/desk.glb",
  "models/study/chair.glb",
  "models/study/rug.glb",
  "models/study/curtain.glb",
  "models/study/laptop.glb",
  "models/study/briefcase.glb",
  "models/study/book.glb",
];

for (const file of publicFiles) {
  const relative = path.relative(publicRoot, file).split(path.sep).join("/");
  const basename = path.basename(file);
  if (!sourceText.includes(basename)) unreferenced.push(relative);
  if (relative.startsWith("assets/") || relative.startsWith("models/")) {
    const url = `/${relative}`;
    if (!sourceText.includes(url) && !sourceText.includes(basename)) missing.push(url);
  }
}

if (missing.length > 0) {
  console.error(`Missing public asset references:\n${missing.join("\n")}`);
  process.exitCode = 1;
}

const criticalBytes = criticalAssets.reduce((total, relative) => {
  const file = path.join(publicRoot, relative);
  if (!fs.existsSync(file)) return total;
  return total + fs.statSync(file).size;
}, 0);
const floorBytes = fs.statSync(path.join(publicRoot, "assets/study-floor.webp")).size;
if (criticalBytes > 2 * 1024 * 1024 || floorBytes > 700 * 1024) {
  console.error(`Critical asset budget exceeded: ${(criticalBytes / 1024 / 1024).toFixed(2)} MB; floor ${(floorBytes / 1024).toFixed(1)} KB.`);
  process.exitCode = 1;
}

console.log(`Checked ${publicFiles.length} public files.`);
console.log(`Critical assets: ${(criticalBytes / 1024 / 1024).toFixed(2)} MB; floor: ${(floorBytes / 1024).toFixed(1)} KB.`);
if (unreferenced.length > 0) {
  console.log(`Unreferenced candidates:\n${unreferenced.join("\n")}`);
} else {
  console.log("No unreferenced public files found.");
}
