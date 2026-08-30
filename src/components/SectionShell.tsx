import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type SectionShellProps = {
  number: string;
  eyebrow: string;
  title: string;
  introduction: string;
  children: React.ReactNode;
};

export function SectionShell({
  number,
  eyebrow,
  title,
  introduction,
  children,
}: SectionShellProps) {
  return (
    <main className="section-page">
      <div className="section-topline">
        <Link href="/" className="back-link">
          <ArrowLeft aria-hidden="true" size={16} />
          Return to the study
        </Link>
        <span>Archive / {number}</span>
      </div>

      <header className="section-intro">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{introduction}</p>
      </header>

      <div className="section-content">{children}</div>
    </main>
  );
}
