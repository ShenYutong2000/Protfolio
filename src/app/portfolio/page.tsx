import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionShell } from "@/components/SectionShell";
import { portfolioItems } from "@/data/content";

export const metadata = {
  title: "Portfolio",
};

export default function PortfolioPage() {
  return (
    <SectionShell
      number="06"
      eyebrow="The camera beside the chair"
      title="Creative collection."
      introduction="Visual work, photographs, writing, and experiments collected from inside and outside my professional practice."
    >
      <div className="filter-row" aria-label="Portfolio filters">
        <button className="active">All</button>
        <button>Design</button>
        <button>Photography</button>
        <button>Video</button>
        <button>Writing</button>
      </div>

      <div className="portfolio-grid">
        {portfolioItems.map((item, index) => (
          <article
            className={`portfolio-card portfolio-${item.tone}`}
            key={item.title}
          >
            <div className="portfolio-placeholder">
              <span>{String(index + 1).padStart(2, "0")}</span>
            </div>
            <div className="portfolio-caption">
              <div>
                <h2>{item.title}</h2>
                <p>
                  {item.category} · {item.year}
                </p>
              </div>
              <Link
                className="circle-button"
                href={`/portfolio/${item.slug}`}
                aria-label={`Open ${item.title}`}
              >
                <ArrowUpRight aria-hidden="true" size={19} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
