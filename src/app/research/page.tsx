import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionShell } from "@/components/SectionShell";
import { research } from "@/data/content";

export const metadata = {
  title: "Research",
};

export default function ResearchPage() {
  return (
    <SectionShell
      number="04"
      eyebrow="The files in the drawer"
      title="Questions worth following."
      introduction="Research papers, ongoing inquiries, and collaborative studies focused on making a meaningful contribution."
    >
      <div className="research-index">
        {research.map((item, index) => (
          <article className="research-card" key={item.title}>
            <div className="research-number">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div>
              <p className="card-meta">
                {item.type} · {item.year}
              </p>
              <h2>{item.title}</h2>
              <h3>{item.venue}</h3>
              <p>{item.summary}</p>
              <div className="button-row">
                <Link className="text-button" href={`/research/${item.slug}`}>
                  Read abstract <ArrowUpRight aria-hidden="true" size={15} />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
