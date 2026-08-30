import { GraduationCap } from "lucide-react";
import { SectionShell } from "@/components/SectionShell";
import { education } from "@/data/content";

export const metadata = {
  title: "Education",
};

export default function EducationPage() {
  return (
    <SectionShell
      number="03"
      eyebrow="The books on the shelf"
      title="Learning, in progress."
      introduction="The formal education, communities, and questions that have shaped how I approach my work."
    >
      <div className="timeline">
        {education.map((item) => (
          <article className="timeline-entry" key={item.period}>
            <div className="timeline-mark">
              <GraduationCap aria-hidden="true" />
            </div>
            <p className="timeline-period">{item.period}</p>
            <div>
              <h2>{item.institution}</h2>
              <h3>{item.degree}</h3>
              <p>{item.details}</p>
            </div>
          </article>
        ))}
      </div>

      <aside className="note-card">
        <p className="eyebrow">On the shelf</p>
        <h2>Honors & certificates</h2>
        <p>
          Add scholarships, certifications, exchange programs, or academic
          awards that strengthen your story.
        </p>
      </aside>
    </SectionShell>
  );
}
