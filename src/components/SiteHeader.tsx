import Link from "next/link";
import { Download } from "lucide-react";
import { navigation, siteProfile } from "@/data/profile";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="Return to the study">
        {siteProfile.name}
        <span>Interactive portfolio</span>
      </Link>

      <nav className="main-nav" aria-label="Primary navigation">
        {navigation.map((item) => (
          item.href.startsWith("/?view=") ? (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ) : (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          )
        ))}
      </nav>

      <a
        className="resume-link"
        href={siteProfile.resumeHref}
        download={siteProfile.resumeDownloadName}
      >
        Resume
        <Download aria-hidden="true" size={14} strokeWidth={1.8} />
      </a>
    </header>
  );
}
