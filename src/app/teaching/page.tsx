import { BookOpen } from "lucide-react";
import { SectionShell } from "@/components/SectionShell";
import { education } from "@/data/experience";

export const metadata = {
  title: "Teaching",
};

export default function TeachingPage() {
  return (
    <SectionShell
      number="03"
      eyebrow="The books on the shelf"
      title="Teaching, in progress."
      introduction="The courses, studios, and questions that have shaped how I teach and learn alongside others."
    >
      <div className="timeline">
        {education.map((item) => (
          <article className="timeline-entry" key={item.period}>
            <div className="timeline-mark">
              <BookOpen aria-hidden="true" />
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
        <h2>Courses & studios</h2>
        <p>
          Add workshops, guest lectures, teaching assistantships, or studio
          courses that strengthen your teaching story.
        </p>
      </aside>
    </SectionShell>
  );
}
