export type ProjectPanelKey = "overview" | "challenge" | "approach" | "outcome";

export type ProjectPanelConfig = {
  eyebrow?: string;
  heading?: string;
  image?: string;
};

export type Project = {
  slug: string;
  index: string;
  title: string;
  summary: string;
  meta: string;
  year: string;
  duration: string;
  role: string;
  tags: string[];
  challenge: string;
  approach: string;
  outcome: string;
  links: { label: string; href: string }[];
  caseStudy?: Partial<Record<ProjectPanelKey, ProjectPanelConfig>>;
};

export type ResearchItem = {
  slug: string;
  type: "Paper" | "Project" | "Patent";
  year: string;
  title: string;
  venue: string;
  status: string;
  collaborators: string;
  summary: string;
  question: string;
  method: string;
  result: string;
  keywords: string[];
  links: { label: string; href: string }[];
  visuals?: {
    hero?: string;
    question?: string;
    method?: string;
    finding?: string;
  };
};

export type PortfolioItem = {
  slug: string;
  title: string;
  category: "Design" | "Photography" | "Video" | "Writing";
  year: string;
  tone: "blue" | "mint" | "yellow" | "coral";
  summary: string;
  context: string;
  process: string;
  tools: string[];
};

export type EducationItem = {
  period: string;
  institution: string;
  location: string;
  degree: string;
  summary: string;
  details: string;
  focus: string[];
};

export type ExperienceEntry = {
  kind: "work" | "education";
  period: string;
  role: string;
  company: string;
  achievements: string[];
  tools: string[];
};
