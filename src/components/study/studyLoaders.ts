import { LoadingManager } from "three";
import type { StudyLoadingStore } from "./studyLoadingState";

const sessions = new WeakMap<StudyLoadingStore, {
  manager: LoadingManager;
  configure: (loader: { manager: LoadingManager }) => void;
}>();

export function studyModelLoader(store: StudyLoadingStore) {
  let session = sessions.get(store);
  if (!session) {
    const manager = new LoadingManager();
    session = { manager, configure: (loader) => { loader.manager = manager; } };
    sessions.set(store, session);
  }
  return session;
}
