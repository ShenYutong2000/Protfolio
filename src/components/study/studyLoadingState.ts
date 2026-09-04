export type StudyAsset = {
    src: string;
    label: string;
    kind: "model" | "texture";
    required: boolean;
    dependsOn?: string;
};
export type AssetStatus = "pending" | "ready" | "error" | "skipped";
export type AssetEntry = StudyAsset & {
    status: AssetStatus;
    attempt: number;
};
export type LoadingPhase = "module" | "loading" | "preparing" | "compiled" | "ready" | "error" | "unavailable";
export type LoadingSnapshot = {
    entries: Readonly<Record<string, AssetEntry>>;
    phase: LoadingPhase;
    run: number;
    message: string;
    shellReady: boolean;
};
export function loadingSummary(snapshot: LoadingSnapshot) {
    const entries = Object.values(snapshot.entries);
    const ready = entries.filter((entry) => entry.status === "ready").length;
    const skipped = entries.filter((entry) => entry.status === "skipped").length;
    const errors = entries.filter((entry) => entry.status === "error");
    return {
        total: entries.length, ready, skipped, errors,
        settled: entries.length > 0 && ready + skipped === entries.length,
        canSkip: errors.length > 0 && entries.every((entry) => !entry.required || entry.status === "ready"),
        progress: snapshot.phase === "ready" ? 100 : snapshot.phase === "compiled" ? 95 :
            entries.length ? Math.floor(90 * (ready + skipped) / entries.length) : 0,
    };
}
// One store per mounted homepage. Cached assets still register in each new Canvas.
export function createStudyLoadingStore() {
    let snapshot: LoadingSnapshot = { entries: {}, phase: "module", run: 0, message: "", shellReady: false };
    const listeners = new Set<() => void>();
    function publish(next: LoadingSnapshot) {
        snapshot = next;
        listeners.forEach((listener) => listener());
    }
    return {
        getSnapshot: () => snapshot,
        subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
        configure(assets: StudyAsset[]) {
            if (Object.keys(snapshot.entries).length)
                return;
            const entries = Object.fromEntries(assets.map((asset) => [asset.src, { ...asset, status: "pending" as const, attempt: 0 }]));
            publish({ ...snapshot, entries, phase: "loading" });
        },
        report(src: string, attempt: number, status: "ready" | "error") {
            const entry = snapshot.entries[src];
            if (!entry || entry.attempt !== attempt || entry.status === "skipped" || entry.status === status)
                return;
            // An error may only be replaced by an explicit retry, never a stale callback.
            if (entry.status !== "pending")
                return;
            publish({ ...snapshot, entries: { ...snapshot.entries, [src]: { ...entry, status } } });
        },
        retry() {
            const entries = Object.fromEntries(Object.entries(snapshot.entries).map(([src, entry]) => [src,
                entry.status === "error" || entry.status === "pending"
                    ? { ...entry, status: "pending" as const, attempt: entry.attempt + 1 } : entry,
            ]));
            publish({ ...snapshot, entries, phase: "loading", run: snapshot.run + 1, message: "", shellReady: false });
        },
        skipOptional(includePending = false) {
            if (!Object.values(snapshot.entries).every((entry) => !entry.required || entry.status === "ready"))
                return;
            const entries = { ...snapshot.entries };
            for (const [src, entry] of Object.entries(entries)) {
                if (!entry.required && (entry.status === "error" || (includePending && entry.status === "pending"))) {
                    entries[src] = { ...entry, status: "skipped" };
                }
            }
            for (const [src, entry] of Object.entries(entries)) {
                if (entry.dependsOn && entries[entry.dependsOn]?.status === "skipped")
                    entries[src] = { ...entry, status: "skipped" };
            }
            publish({ ...snapshot, entries });
        },
        advance(phase: "preparing" | "compiled" | "ready", run: number) {
            const previous = { preparing: "loading", compiled: "preparing", ready: "compiled" };
            const requiredReady = Object.values(snapshot.entries).length > 0
                && Object.values(snapshot.entries).every((entry) => !entry.required || entry.status === "ready");
            if (snapshot.run !== run || !snapshot.shellReady || !requiredReady || snapshot.phase !== previous[phase])
                return;
            publish({ ...snapshot, phase });
        },
        reportShellReady(run: number) {
            if (snapshot.run === run && !snapshot.shellReady)
                publish({ ...snapshot, shellReady: true });
        },
        fail(message: string, unavailable = false) {
            const phase = unavailable ? "unavailable" : "error";
            if (snapshot.phase === phase && snapshot.message === message)
                return;
            publish({ ...snapshot, phase, message });
        },
    };
}
export type StudyLoadingStore = ReturnType<typeof createStudyLoadingStore>;
export function assetRequestUrl(entry: Pick<AssetEntry, "src" | "attempt">) {
    return entry.attempt ? `${entry.src}${entry.src.includes("?") ? "&" : "?"}study-attempt=${entry.attempt}` : entry.src;
}
