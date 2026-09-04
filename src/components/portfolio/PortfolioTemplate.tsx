"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function syncPortfolioRoute(path: string) {
  if (path !== "/" && path !== "/index") return;
  const url = new URL(window.location.href);
  if (path === "/") url.searchParams.delete("view");
  else url.searchParams.set("view", "index");
  if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url);
}

// The original vanilla renderer owns its document and animation loop. Keeping
// it in a local frame preserves its viewport math and disposes it on unmount.
export function PortfolioTemplate({ initialPath }: { initialPath: string }) {
  const router = useRouter();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [resolvedPath] = useState(() => {
    if (typeof window === "undefined") return initialPath;
    return new URLSearchParams(window.location.search).get("view") === "index"
      ? "/index"
      : initialPath;
  });
  const [source] = useState(`/portfolio-template/index.html?embed=1#${resolvedPath}`);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    syncPortfolioRoute(resolvedPath);
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type === "portfolio:return") router.push("/");
      if (event.data?.type === "portfolio:error") setFailed(true);
      if (event.data?.type !== "portfolio:route" || typeof event.data.path !== "string" || !/^\/(index)?$/.test(event.data.path)) return;
      // The child already adds the browser history entry. Mirror its route
      // without adding a second entry; refreshing preserves the current view.
      syncPortfolioRoute(event.data.path);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [router, resolvedPath]);

  return (
    <main className="portfolio-template-host" aria-label="Portfolio">
      <iframe ref={frameRef} className="portfolio-template-frame" src={source} title="Portfolio — Selected and Index" onLoad={() => {
        frameRef.current?.focus();
        // Cached frames may send their initial route before our effect runs.
        syncPortfolioRoute(frameRef.current?.contentWindow?.location.hash.slice(1) || "/");
      }} />
      {failed && <div className="portfolio-template-error" role="alert">
        <p>The gallery could not start. Please try reloading it.</p>
        <button type="button" onClick={() => window.location.reload()}>Reload gallery</button>
        <Link href="/">Return to the study</Link>
      </div>}
    </main>
  );
}
