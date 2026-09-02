import assert from "node:assert/strict";
import { test } from "node:test";
import { createStudyLoadingStore, loadingSummary, assetRequestUrl } from "../src/components/study/studyLoadingState.ts";

const assets = [
  { src: "/desk.glb", label: "Desk", kind: "model", required: true },
  { src: "/book.glb", label: "Book", kind: "model", required: false },
  { src: "/cup.glb", label: "Cup", kind: "model", required: false, dependsOn: "/book.glb" },
];
function create() { const store = createStudyLoadingStore(); store.configure(assets); return store; }
test("progress cannot complete from an empty or partially ready scene", () => {
  const store = createStudyLoadingStore();
  store.advance("ready", 0);
  assert.equal(loadingSummary(store.getSnapshot()).progress, 0);
  store.configure(assets);
  store.report("/desk.glb", 0, "ready");
  store.advance("ready", 0);
  assert.equal(loadingSummary(store.getSnapshot()).progress, 30);
});
test("cached resources register once; ready is separate from asset completion", () => {
  const store = create();
  for (const a of assets) { store.report(a.src, 0, "ready"); store.report(a.src, 0, "ready"); }
  assert.equal(loadingSummary(store.getSnapshot()).progress, 90);
  store.advance("ready", 0);
  assert.equal(store.getSnapshot().phase, "loading");
  store.reportShellReady(0);
  store.advance("preparing", 0);
  store.advance("compiled", 0);
  assert.equal(loadingSummary(store.getSnapshot()).progress, 95);
  store.advance("ready", 0);
  assert.equal(loadingSummary(store.getSnapshot()).progress, 100);
  store.advance("preparing", 0);
  assert.equal(store.getSnapshot().phase, "ready");
  store.configure(assets);
  assert.equal(store.getSnapshot().phase, "ready");
  assert.equal(loadingSummary(create().getSnapshot()).progress, 0);
});
test("required failures cannot be skipped", () => {
  const store = create();
  store.report("/desk.glb", 0, "error");
  store.skipOptional(true);
  assert.equal(store.getSnapshot().entries["/desk.glb"].status, "error");
  assert.equal(loadingSummary(store.getSnapshot()).canSkip, false);
});
test("skipping a failed supporting book also removes its already-loaded cup", () => {
  const store = create();
  store.report("/desk.glb", 0, "ready");
  store.report("/book.glb", 0, "error");
  store.report("/cup.glb", 0, "ready");
  assert.equal(loadingSummary(store.getSnapshot()).canSkip, true);
  store.skipOptional();
  assert.equal(store.getSnapshot().entries["/cup.glb"].status, "skipped");
  assert.equal(loadingSummary(store.getSnapshot()).settled, true);
  store.report("/book.glb", 0, "ready");
  assert.equal(store.getSnapshot().entries["/book.glb"].status, "skipped");
});
test("retry preserves successful resources and ignores earlier attempt callbacks", () => {
  const store = create();
  store.report("/desk.glb", 0, "ready");
  store.report("/book.glb", 0, "error");
  store.retry();
  assert.equal(store.getSnapshot().entries["/desk.glb"].attempt, 0);
  assert.equal(store.getSnapshot().entries["/book.glb"].attempt, 1);
  assert.equal(store.getSnapshot().entries["/cup.glb"].attempt, 1);
  store.report("/book.glb", 0, "ready");
  assert.equal(store.getSnapshot().entries["/book.glb"].status, "pending");
  store.report("/book.glb", 1, "ready");
  store.report("/cup.glb", 1, "ready");
  store.advance("ready", 0);
  assert.equal(store.getSnapshot().phase, "loading");
  assert.equal(assetRequestUrl(store.getSnapshot().entries["/book.glb"]), "/book.glb?study-attempt=1");
});
test("fatal preparation failures remain blocked until retry", () => {
  const store = create();
  for (const a of assets) store.report(a.src, 0, "ready");
  store.fail("compile failed");
  store.advance("ready", 0);
  assert.equal(store.getSnapshot().phase, "error");
  store.retry();
  assert.equal(store.getSnapshot().phase, "loading");
  assert.equal(loadingSummary(store.getSnapshot()).ready, 3);
});
test("repeated renderer failures do not trigger a rerender loop", () => {
  const store = create();
  let changes = 0;
  store.subscribe(() => changes++);
  store.fail("No WebGL", true);
  store.fail("No WebGL", true);
  assert.equal(changes, 1);
  assert.equal(store.getSnapshot().phase, "unavailable");
});
