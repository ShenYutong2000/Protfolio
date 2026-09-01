import { SectionShell } from "@/components/SectionShell";
import { experience } from "@/data/content";

export const metadata = {
  title: "Experience",
};

export default function ExperiencePage() {
  return (
    <SectionShell
      number="05"
      eyebrow="The briefcase by the desk"
      title="Work with purpose."
      introduction="Professional experiences where I learned, collaborated, and turned ideas into outcomes."
    >
      <div className="experience-list">
        {experience.map((item) => (
          <article className="experience-card" key={item.period}>
            <p className="timeline-period">{item.period}</p>
            <div>
              <h2>{item.role}</h2>
              <h3>{item.company}</h3>
              <ul className="achievement-list">
                {item.achievements.map((achievement) => (
                  <li key={achievement}>{achievement}</li>
                ))}
              </ul>
              <ul className="tag-list" aria-label="Skills and tools">
                {item.tools.map((tool) => (
                  <li key={tool}>{tool}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
