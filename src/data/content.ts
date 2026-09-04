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

export const siteProfile = {
  name: "Your Name",
  initials: "YN",
  role: "Researcher, designer & developer",
  location: "Your City, Country",
  email: "hello@yourname.com",
  availability: "Open to opportunities",
  introduction:
    "I work at the intersection of research, technology, and thoughtful design—turning complex questions into useful, human-centered experiences.",
  biography: [
    "I am a multidisciplinary practitioner interested in how technology can help people understand information, make decisions, and express ideas.",
    "My work combines careful research with visual thinking and hands-on prototyping. I enjoy moving between questions, systems, and details to create outcomes that are both useful and memorable.",
  ],
  interests: ["Human-centered AI", "Data stories", "Creative technology"],
  socialLinks: [
    { label: "Email", href: "mailto:hello@yourname.com" },
    { label: "GitHub", href: "https://github.com/" },
    { label: "LinkedIn", href: "https://www.linkedin.com/" },
  ],
  resumeHref: "/Kathleen-Resume.pdf",
  resumeDownloadName: "Kathleen-Resume.pdf",
};

export const navigation = [
  { href: "/projects", label: "Projects" },
  { href: "/teaching", label: "Teaching" },
  { href: "/research", label: "Research" },
  { href: "/experience", label: "Experience" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/image-to-3d", label: "Image → 3D" },
];

export const projects = [
  {
    slug: "intelligent-research-assistant",
    index: "01",
    title: "Intelligent Research Assistant",
    summary:
      "A workspace that helps researchers organize literature, surface connections, and turn notes into clear insights.",
    meta: "Product design · Full-stack development",
    year: "2026",
    duration: "12 weeks",
    role: "Product designer & full-stack developer",
    tags: ["Next.js", "Python", "AI"],
    challenge:
      "Researchers often collect more material than they can meaningfully synthesize. The challenge was to support exploration without replacing the researcher’s judgment.",
    approach:
      "I mapped the literature-review workflow, prototyped the information architecture, and built a focused workspace for collecting sources, connecting notes, and reviewing AI-assisted suggestions.",
    outcome:
      "The prototype established a clear end-to-end workflow and created a reusable foundation for testing retrieval quality, transparency, and researcher control.",
    links: [
      { label: "Live demo", href: "#" },
      { label: "Source code", href: "#" },
    ],
  },
  {
    slug: "community-data-atlas",
    index: "02",
    title: "Community Data Atlas",
    summary:
      "An accessible data story that makes complex local indicators easier to explore and understand.",
    meta: "Data visualization · Front-end development",
    year: "2025",
    duration: "8 weeks",
    role: "Data designer & front-end developer",
    tags: ["React", "D3.js", "Data"],
    challenge:
      "Important community indicators were available, but fragmented datasets and technical language made them difficult for non-specialists to use.",
    approach:
      "I organized the indicators around everyday questions, created accessible visual patterns, and tested responsive interactions across desktop and mobile layouts.",
    outcome:
      "The resulting concept demonstrated how layered explanation and focused comparisons can turn raw indicators into an understandable public narrative.",
    links: [{ label: "Case study", href: "#" }],
  },
  {
    slug: "creative-archive",
    index: "03",
    title: "Creative Archive",
    summary:
      "A playful digital archive for collecting visual experiments, process notes, and finished work.",
    meta: "Creative coding · Interaction design",
    year: "2025",
    duration: "Ongoing",
    role: "Designer & creative developer",
    tags: ["WebGL", "Design", "Motion"],
    challenge:
      "Traditional portfolio grids rarely communicate the relationships between experiments, process notes, and finished work.",
    approach:
      "I explored spatial navigation, object-based interaction, and a flexible metadata system that allows work to be connected by theme, medium, and time.",
    outcome:
      "The archive became an evolving creative system rather than a fixed gallery, making room for unfinished thinking as well as polished outcomes.",
    links: [{ label: "View prototype", href: "#" }],
  },
] satisfies Project[];

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
    details:
      "GPA: 3.71/4.00 · Relevant coursework: Natural Language Processing; Reasoning about Computation; Economics and Computing; Innovating Across Technology, Business, and Marketplaces; Foundations of Psychological Thought.",
    focus: ["Computer science", "Natural language processing", "Computing & economics"],
  },
];

export const research = [
  {
    slug: "research-paper-title",
    type: "Paper",
    year: "2026",
    title: "Your Research Paper or Study Title",
    venue: "Journal or Conference · Published / In Review",
    status: "In review",
    collaborators: "Your Name · Collaborator Name",
    summary:
      "Summarize the research question, your method, and the most meaningful result in two concise sentences.",
    question:
      "State the specific problem or knowledge gap that motivated this research and explain why it matters.",
    method:
      "Describe the study design, dataset, participants, analytical method, or technical system in clear language.",
    result:
      "Summarize the central finding, contribution, or implication without overstating what the evidence supports.",
    keywords: ["Research area", "Method", "Application"],
    links: [
      { label: "Read paper", href: "#" },
      { label: "View DOI", href: "#" },
    ],
  },
  {
    slug: "research-project-title",
    type: "Project",
    year: "2025",
    title: "Your Research Project Title",
    venue: "Research Lab · Your Role",
    status: "Ongoing",
    collaborators: "Research Lab · Project Team",
    summary:
      "Explain your contribution, the tools you used, and how the work advanced the larger research goal.",
    question:
      "Explain the practical or theoretical question that the project is designed to investigate.",
    method:
      "Outline your responsibilities, research process, tools, and how you collaborated with the wider team.",
    result:
      "Describe the current output, next experiment, publication goal, or demonstrated impact of the work.",
    keywords: ["Research", "Collaboration", "Analysis"],
    links: [{ label: "Project overview", href: "#" }],
  },
] satisfies ResearchItem[];

type ExperienceEntry = {
  kind: "work" | "education";
  period: string;
  role: string;
  company: string;
  achievements: string[];
  tools: string[];
};

const workExperience = [
  {
    kind: "work" as const,
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
    kind: "work" as const,
    period: "July 2023 — June 2025",
    role: "Software Engineer — Azure Monitoring",
    company: "Microsoft · Redmond, WA",
    achievements: [
      "Engineered KeplerWorkspace, an AI-powered automation tool that proactively resolves Azure customer incidents through guided troubleshooting, reducing on-call workload and accelerating live-site remediation for 200+ global Azure Monitoring engineers.",
    ],
    tools: ["AI automation", "Azure Monitoring", "Incident response"],
  },
];

const educationExperience = education.map((item) => ({
  kind: "education" as const,
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

export const portfolioItems = [
  {
    slug: "visual-study",
    title: "Visual Study 01",
    category: "Design",
    year: "2026",
    tone: "blue",
    summary:
      "A visual system exploring rhythm, hierarchy, and playful ways to organize information.",
    context:
      "Introduce the brief, audience, constraints, and the observation that led you to begin this work.",
    process:
      "Describe sketches, references, iterations, and the decisions that shaped the final visual language.",
    tools: ["Figma", "Illustrator", "Prototyping"],
  },
  {
    slug: "field-notes",
    title: "Field Notes",
    category: "Photography",
    year: "2026",
    tone: "mint",
    summary:
      "An observational photo series about overlooked details, quiet routines, and a sense of place.",
    context:
      "Explain where the series was made and the question or visual theme that connects the photographs.",
    process:
      "Describe how you selected locations, worked with light, and edited the sequence into a coherent story.",
    tools: ["Digital photography", "Lightroom", "Sequencing"],
  },
  {
    slug: "moving-stories",
    title: "Moving Stories",
    category: "Video",
    year: "2025",
    tone: "yellow",
    summary:
      "A short motion experiment combining interviews, typography, and environmental sound.",
    context:
      "Introduce the people, subject, or message behind the piece and the intended viewing context.",
    process:
      "Explain the story structure, filming approach, sound decisions, and key editing experiments.",
    tools: ["Premiere Pro", "After Effects", "Sound"],
  },
  {
    slug: "process-journal",
    title: "Process Journal",
    category: "Writing",
    year: "2025",
    tone: "coral",
    summary:
      "Short essays reflecting on research practice, creative work, and lessons from building in public.",
    context:
      "Describe the purpose of the journal and the themes that recur across the writing.",
    process:
      "Explain how notes become essays and how writing supports your wider research and creative practice.",
    tools: ["Writing", "Editing", "Documentation"],
  },
] satisfies PortfolioItem[];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export function getResearchItem(slug: string) {
  return research.find((item) => item.slug === slug);
}

export function getPortfolioItem(slug: string) {
  return portfolioItems.find((item) => item.slug === slug);
}
