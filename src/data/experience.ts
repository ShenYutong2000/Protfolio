import type { EducationItem, ExperienceEntry } from "./types";

export const education = [
  {
    period: "August 2026 — Present",
    institution: "Harvard University",
    location: "Cambridge, MA",
    degree: "Ed.M, Learning Design, Innovation, and Technology",
    summary: "Ed.M. in Learning Design, Innovation, and Technology.",
    details: "Cambridge, MA.",
    focus: ["Learning design", "Innovation", "Technology"],
  },
  {
    period: "September 2019 — May 2023",
    institution: "Princeton University",
    location: "Princeton, NJ",
    degree: "BSE, Computer Science",
    summary: "BSE in Computer Science.",
    details: "GPA: 3.71/4.00 · Relevant coursework: Natural Language Processing; Reasoning about Computation; Economics and Computing; Innovating Across Technology, Business, and Marketplaces; Foundations of Psychological Thought.",
    focus: ["Computer science", "Natural language processing", "Computing & economics"],
  },
] satisfies EducationItem[];

const workExperience: ExperienceEntry[] = [
  {
    kind: "work",
    period: "July 2025 — Present",
    role: "STEM Teaching Fellow",
    company: "United World College · Changshu, China",
    achievements: [
      "Designed and implemented a novel physics curriculum grounded in Conceptual-Based Inquiry, strengthening the school's IB Diploma preparatory program for 150+ Grade-10 students.",
      "Partnered with the school principal and board to apply predictive AI analytics to student performance data, translating insights into personalized learning strategies and data-informed instructional improvements.",
      "Mentored 20+ students in physics and computer science through hands-on supervision of a physics experiment club, cultivating academic excellence and research interest.",
    ],
    tools: ["Physics curriculum", "Predictive AI", "Student mentoring"],
  },
  {
    kind: "work",
    period: "July 2023 — June 2025",
    role: "Software Engineer — Azure Monitoring",
    company: "Microsoft · Redmond, WA",
    achievements: [
      "Engineered KeplerWorkspace, an AI-powered automation tool that proactively resolves Azure customer incidents through guided troubleshooting, reducing on-call workload and accelerating live-site remediation for 200+ global Azure Monitoring engineers.",
    ],
    tools: ["AI automation", "Azure Monitoring", "Incident response"],
  },
];

const educationExperience: ExperienceEntry[] = education.map((item) => ({
  kind: "education",
  period: item.period,
  role: item.degree,
  company: `${item.institution} · ${item.location}`,
  achievements: [item.summary, item.details],
  tools: item.focus,
}));

export const experience = [
  educationExperience[0],
  ...workExperience,
  educationExperience[1],
] satisfies ExperienceEntry[];
