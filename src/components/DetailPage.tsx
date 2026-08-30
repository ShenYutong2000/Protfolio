import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

type DetailSection = {
  label: string;
  title: string;
  body: string;
};

type DetailPageProps = {
  backHref: string;
  backLabel: string;
  type: string;
  year: string;
  title: string;
  summary: string;
  facts: { label: string; value: string }[];
  tags: string[];
  sections: DetailSection[];
  links?: { label: string; href: string }[];
  tone?: string;
};

export function DetailPage({
  backHref,
  backLabel,
  type,
  year,
  title,
  summary,
  facts,
  tags,
  sections,
  links = [],
  tone = "blue",
}: DetailPageProps) {
  return (
    <main className="detail-page">
      <div className="section-topline">
        <Link href={backHref} className="back-link">
          <ArrowLeft aria-hidden="true" size={16} />
          {backLabel}
        </Link>
        <span>
          {type} / {year}
        </span>
      </div>

      <header className="detail-hero">
        <p className="eyebrow">{type}</p>
        <h1>{title}</h1>
        <p>{summary}</p>
      </header>

      <div className={`detail-visual detail-${tone}`} aria-hidden="true">
        <span>{year}</span>
        <i />
        <i />
        <i />
      </div>

      <dl className="fact-grid">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>

      <div className="detail-body">
        <aside>
          <p className="eyebrow">Index</p>
          <ul>
            {sections.map((section, index) => (
              <li key={section.label}>
                {String(index + 1).padStart(2, "0")} {section.label}
              </li>
            ))}
          </ul>
        </aside>

        <div className="detail-sections">
          {sections.map((section, index) => (
            <section key={section.label}>
              <p className="card-meta">
                {String(index + 1).padStart(2, "0")} / {section.label}
              </p>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </div>

      <footer className="detail-footer">
        <ul className="tag-list" aria-label="Related skills and topics">
          {tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        {links.length > 0 && (
          <div className="button-row">
            {links.map((link) => (
              <a className="primary-button" href={link.href} key={link.label}>
                {link.label}
                <ArrowUpRight aria-hidden="true" size={14} />
              </a>
            ))}
          </div>
        )}
      </footer>
    </main>
  );
}
