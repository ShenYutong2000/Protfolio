import { Mail, MapPin } from "lucide-react";
import { SectionShell } from "@/components/SectionShell";
import { siteProfile } from "@/data/content";

export const metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <SectionShell
      number="01"
      eyebrow="The portrait on the wall"
      title={`Hello, I’m ${siteProfile.name}.`}
      introduction={siteProfile.introduction}
    >
      <div className="about-grid">
        <div className="portrait-card" aria-label="Portrait placeholder">
          <span>{siteProfile.initials}</span>
          <p>Add your portrait here</p>
        </div>

        <div className="about-story">
          <p className="lead">{siteProfile.role}</p>
          {siteProfile.biography.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          <div className="detail-list">
            <p>
              <MapPin aria-hidden="true" size={17} />
              Based in {siteProfile.location}
            </p>
            <p>
              <Mail aria-hidden="true" size={17} />
              {siteProfile.email}
            </p>
          </div>

          <ul className="tag-list" aria-label="Current interests">
            {siteProfile.interests.map((interest) => (
              <li key={interest}>{interest}</li>
            ))}
          </ul>

          <div className="button-row">
            <a className="primary-button" href={`mailto:${siteProfile.email}`}>
              Contact me
            </a>
            <a className="text-button" href="/resume.pdf">
              Download résumé ↗
            </a>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
