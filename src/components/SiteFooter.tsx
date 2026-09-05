import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { navigation, siteProfile } from "@/data/profile";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <p className="eyebrow">A note from the desk</p>
        <h2>Have a question or an idea worth exploring?</h2>
        <a className="primary-button" href={`mailto:${siteProfile.email}`}>
          Start a conversation
          <ArrowUpRight aria-hidden="true" size={14} />
        </a>
      </div>

      <div className="footer-links">
        <nav aria-label="Footer navigation">
          {navigation.map((item) => (
            item.href.startsWith("/?view=") ? (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ) : (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            )
          ))}
        </nav>
        <nav aria-label="Social links">
          {siteProfile.socialLinks.map((item) => (
            <a href={item.href} key={item.label}>
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      <p className="footer-note">
        © {new Date().getFullYear()} {siteProfile.name}. Built with curiosity.
      </p>
    </footer>
  );
}
