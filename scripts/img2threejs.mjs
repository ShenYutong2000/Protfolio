import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const commands = {
  probe: "forge/stage1_intake/probe_image.py",
  assess: "forge/stage2_spec/new_pre_spec_assessment.py",
  spec: "forge/stage2_spec/new_sculpt_spec.py",
  validate: "forge/stage2_spec/validate_sculpt_spec.py",
  build: "forge/stage3_build/generate_threejs_factory.py",
  inventory: "forge/stage1_intake/build_detail_inventory.py",
  init: "forge/state.py",
  next: "forge/next.py",
};

const [command, ...args] = process.argv.slice(2);
const skillRoot = process.env.IMG2THREEJS_ROOT;

if (!command || command === "--help" || command === "-h") {
  console.log(`img2threejs bridge

Set IMG2THREEJS_ROOT to your img2threejs checkout, then run one of:
  npm run img2threejs -- probe <image>
  npm run img2threejs -- assess <name> --image <image> --out assessment.json
  npm run img2threejs -- spec <name> --image <image> --assessment assessment.json --out object-sculpt-spec.json
  npm run img2threejs -- validate object-sculpt-spec.json --strict-quality
  npm run img2threejs -- build object-sculpt-spec.json --out src/components/image3d/generated/createObjectModel.ts
  npm run img2threejs -- init --state .img2threejs/state.json --reference <image> --profile generic --spec object-sculpt-spec.json
  npm run img2threejs -- next --state .img2threejs/state.json object-sculpt-spec.json

The bridge delegates to the repository's dependency-free Python forge scripts.

If Python is not on PATH, set IMG2THREEJS_PYTHON to a Python 3.10+ executable.
`);
  process.exit(command ? 0 : 1);
}

if (!skillRoot) {
  console.error(
    "IMG2THREEJS_ROOT is not set. Point it at a checkout of github.com/img2threejs/img2threejs.",
  );
  process.exit(1);
}

const relativeScript = commands[command];
if (!relativeScript) {
  console.error(`Unknown command: ${command}`);
  console.error(`Available commands: ${Object.keys(commands).join(", ")}`);
  process.exit(1);
}

const script = resolve(skillRoot, relativeScript);
if (!existsSync(script)) {
  console.error(`Could not find ${script}. Check IMG2THREEJS_ROOT.`);
  process.exit(1);
}

const interpreters = process.env.IMG2THREEJS_PYTHON
  ? [process.env.IMG2THREEJS_PYTHON]
  : process.platform === "win32"
    ? ["python", "py", "python3"]
    : ["python3", "python"];
let result;
for (const interpreter of interpreters) {
  result = spawnSync(interpreter, [script, ...args], {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: false,
  });
  if (!result.error) break;
}

if (result.error) {
  console.error(
    `Could not start Python. Install Python 3.10+ or set IMG2THREEJS_PYTHON to its executable.`,
  );
  process.exit(1);
}

process.exit(result.status ?? 1);
