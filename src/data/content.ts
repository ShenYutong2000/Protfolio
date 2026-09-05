type ProjectPanelKey = "overview" | "challenge" | "approach" | "outcome";

type ProjectPanelConfig = {
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
  { href: "/teaching", label: "Teaching" },
  { href: "/?view=research", label: "Research" },
  { href: "/?view=computer", label: "Project" },
  { href: "/portfolio", label: "Portfolio" },
];

export const projects = [
  {
    slug: "physics-error-bank",
    index: "01",
    title: "Physics Error Bank",
    summary:
      "A smart review system that helps physics students turn mistakes into targeted practice while giving teachers clear insight into class-wide learning gaps.",
    meta: "Educational technology · Full-stack development",
    year: "2025",
    duration: "Ongoing",
    role: "Product designer & full-stack developer",
    tags: ["Next.js", "PostgreSQL", "Prisma", "Vercel"],
    challenge:
      "Traditional review often means rereading notes or solving random problems. Students can repeat the same types of mistakes, while teachers lack clear data about which concepts their class finds difficult.",
    approach:
      "Students log the problem, error type, physics topic, incorrect approach, and correct solution. The system uses that error bank to generate targeted practice papers, while a teacher dashboard surfaces class-wide patterns and theme mastery.",
    outcome:
      "Physics Error Bank creates a feedback loop between student practice and teacher insight. Built as a production-ready Next.js application with PostgreSQL and Prisma, it supports a more personalized and responsive approach to physics education.",
    links: [],
    caseStudy: {
      overview: {
        image: "/assets/projects/physics-error-bank-overview.png",
      },
      challenge: {
        eyebrow: "Student Practice",
        heading: "Make mistakes useful",
        image: "/assets/projects/physics-error-bank-papers.png",
      },
      approach: {
        eyebrow: "Error Library",
        heading: "Turn wrong answers into a study system",
        image: "/assets/projects/physics-error-bank-library.png",
      },
      outcome: {
        eyebrow: "Teacher Insight",
        heading: "Connect practice with instruction",
        image: "/assets/projects/physics-error-bank-teacher-stats.png",
      },
    },
  },
  {
    slug: "automatic-content-translation-model",
    index: "02",
    title: "Automatic Content Translation Model",
    summary:
      "This project leverages large language models (LLMs) to automate the translation of coding workshop content for the educational NGO, Nuevo Foundation. The tool supports eight languages and makes foundational tech education accessible to a global student body.",
    meta: "AI · Educational technology",
    year: "2023",
    duration: "Sept. - Oct. 2023",
    role: "Main contributor",
    tags: ["C#", "Python", "HTML", "CSS"],
    challenge:
      "I made this project during the 2023 Microsoft Hackathon, when Microsoft first announced its cooperation with OpenAI. I wanted to explore how effective use of large language models could make educational resources more accessible to a global audience.",
    approach:
      "The work combined user research, collaborative prototyping, and technical iteration. The script reads Markdown files or folders, uses the Azure AI Inference SDK with a supported GitHub Models LLM to translate the content, and saves the translated files in a separate directory.",
    outcome:
      "This was my first experience systematically implementing AI to solve a real-world problem. It showed me the power of combining cutting-edge technology with a clear user need; working with engineers and translators also reinforced the importance of iterative feedback. At IDM, I want to build on this with more user-friendly digital product design and broader language support.",
    links: [],
    caseStudy: {
      overview: {
        image: "/assets/projects/automatic-content-translation-overview.png",
      },
      challenge: {
        eyebrow: "Inspiration",
        heading: "Make learning travel farther",
        image: "/assets/projects/automatic-content-translation-inspiration.png",
      },
      approach: {
        eyebrow: "Research & Outcome",
        heading: "Translate from source to new files",
        image: "/assets/projects/automatic-content-translation-approach.png",
      },
      outcome: {
        eyebrow: "Evaluation & Learning",
        heading: "Build around a clear user need",
        image: "/assets/projects/automatic-content-translation-outcome.jpg",
      },
    },
  },
  {
    slug: "ai-animator",
    index: "03",
    title: "AI Animator",
    summary:
      "A product design concept for a generative AI plugin that helps 2D animators create draft animations while preserving artistic originality.",
    meta: "Product design · Generative AI",
    year: "2022",
    duration: "Sept. - Dec. 2022",
    role: "Main contributor",
    tags: ["Figma", "Procreate", "Python", "Market research"],
    challenge:
      "As animation enthusiasts, my partner and I identified critical inefficiencies in the 2D animation industry through coursework and personal interest. We wanted to design an AI tool that acts as an aid, not a replacement.",
    approach:
      "The workflow imports existing work as .XFL files for style reference, takes object and action prompts, and lets animators configure duration, frame rate, and canvas size. It then generates multiple draft animations that can be selected, varied, and exported for refinement.",
    outcome:
      "This was my first deep dive into a structured product design process, from market research and interviews with student animators to MVP feature prioritization. I learned to translate user pain points into a concrete, feature-rich design.",
    links: [],
    caseStudy: {
      overview: {
        image: "/assets/projects/ai-animator-overview.png",
      },
      challenge: {
        eyebrow: "Process",
        heading: "Design AI as an aid",
        image: "/assets/projects/ai-animator-process.png",
      },
      approach: {
        eyebrow: "Workflow",
        heading: "From source files to draft motion",
        image: "/assets/projects/ai-animator-import.png",
      },
      outcome: {
        eyebrow: "Evaluation & Learning",
        heading: "Turn animator pain points into features",
        image: "/assets/projects/ai-animator-prompt.png",
      },
    },
  },
  {
    slug: "aaccnj-job-board",
    index: "04",
    title: "AACCNJ Job Board",
    summary:
      "A job board built for the African American Chamber of Commerce of New Jersey, connecting its members with partner companies through an existing website.",
    meta: "Human-centered design · Full-stack development",
    year: "2022",
    duration: "Jan. - April 2022",
    role: "Main contributor",
    tags: ["Python", "Java", "SQL", "HTML", "CSS"],
    challenge:
      "Through active communication, we discovered that AACCNJ did not want a standalone platform. They needed an integrated tool for three user types: companies posting jobs, administrators approving listings, and job-seekers searching and applying.",
    approach:
      "We planned systematically, challenged assumptions through user feedback, and designed for cultural inclusivity. The job board supports searchable listings, location filtering, company submissions, administrative approval, and a workflow that fits the existing AACCNJ website.",
    outcome:
      "This project was a masterclass in human-centered design. I learned that even logical assumptions must be validated with users, and that good design is defined by how well it serves a specific audience's context.",
    links: [],
    caseStudy: {
      overview: {
        image: "/assets/projects/aaccnj-job-board-overview.png",
      },
      challenge: {
        eyebrow: "Process",
        heading: "Start with the people, not the platform",
        image: "/assets/projects/aaccnj-job-board-search.png",
      },
      approach: {
        eyebrow: "Implementation",
        heading: "Build inside the existing workflow",
        image: "/assets/projects/aaccnj-job-board-repository.png",
      },
      outcome: {
        eyebrow: "Evaluation & Learning",
        heading: "Validate assumptions with users",
        image: "/assets/projects/aaccnj-job-board-filtering.jpg",
      },
    },
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
    slug: "personality-detection-model",
    type: "Project",
    year: "2021",
    title: "Personality Detection Model",
    venue: "University Junior Project",
    status: "Completed",
    collaborators: "Main contributor",
    summary:
      "A machine learning study investigating the correlation between Big Five personality traits and language on social media. I collected questionnaire responses and real user posts, trained a model to predict personality from text, and used the results to explore how recognizable personality patterns appear in global literature. The project connected psychological measurement, Chinese-language NLP, and interpretive analysis in one end-to-end research workflow.",
    question:
      "Can we build a reliable model to predict personality based on social media text? The project began with the observation that many peers use social media as a personal diary, leaving behind a record of everyday language, opinions, and habits. This raised a broader question: can those linguistic traces provide meaningful signals about the Big Five dimensions of openness, conscientiousness, extraversion, agreeableness, and neuroticism without reducing a person to a single label?",
    method:
      "I collected BFI-2 questionnaire responses from 150 participants and paired each response with up to 50 recent Weibo posts. After scoring and labeling the five OCEAN traits, I cleaned the Chinese text with pyhanlp.harvesttext and tokenized it with Jieba. I then framed each trait as a binary classification task, compared five classifiers and six baseline models, and fine-tuned a Chinese BERT model with Hugging Face and scikit-learn workflows. Weekly feedback from my professor and peers helped refine the data pipeline, model comparison, and testing scope.",
    result:
      "The project produced a functional personality-prediction tool and a set of visual analyses covering label distributions, word counts, and model performance. I also used the predictions to examine literary characters such as Mr. Darcy and Elizabeth Bennet, testing how a data-driven lens might complement close reading. The evaluation showed a useful starting point for personality inference while revealing important next steps: broader and more balanced data, stronger validation, clearer communication of uncertainty, and a more engaging app-based presentation.",
    keywords: ["Personality detection", "Big Five / OCEAN", "Social media NLP", "Machine learning", "Chinese BERT"],
    links: [],
    visuals: {
      hero: "/assets/research/personality-detection-workflow.jpg",
      question: "/assets/research/personality-detection-data-collection.png",
      method: "/assets/research/personality-detection-models.png",
      finding: "/assets/research/personality-detection-finding.png",
    },
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
    slug: "watercolor-architecture",
    title: "Watercolor Architecture",
    category: "Design",
    year: "Undated",
    tone: "blue",
    summary:
      "A watercolor series studying Chinese gates, red courtyards, layered roofs, and the color relationships that make architectural spaces feel lived in.",
    context:
      "The series began with close observation of traditional architecture. I focused on thresholds, rooflines, painted surfaces, and small shifts of color rather than treating each building as a neutral document.",
    process:
      "I worked from observed scenes and built each image through layered washes, ink-like marks, and concentrated color accents. Repeating architectural details became a way to study rhythm, depth, and framing.",
    tools: ["Watercolor", "Ink", "Observational drawing"],
  },
  {
    slug: "architectural-line-studies",
    title: "Architectural Line Studies",
    category: "Design",
    year: "Undated",
    tone: "mint",
    summary:
      "A collection of pen-and-ink drawings exploring campus buildings, Gothic churches, sculpture, and the visual structure of places passed through.",
    context:
      "These drawings use architecture as a subject for attention and memory. The work moves between a campus building, Gothic facades, sculptural forms, and travel-related scenes.",
    process:
      "I sketched directly from reference, building forms with contour, cross-hatching, repeated windows, and directional lines. The loose marks preserve the decisions and corrections made while looking.",
    tools: ["Pen and ink", "Sketchbook", "Architectural observation"],
  },
  {
    slug: "whale-watching",
    title: "Whale Watching",
    category: "Design",
    year: "Undated",
    tone: "yellow",
    summary:
      "A digital painting pairing a blue coastal landscape with a small whale, documented alongside the studio setup where the painting was made.",
    context:
      "The piece studies scale and distance: a broad landscape establishes a calm field while the whale creates a small point of movement and attention.",
    process:
      "I developed the image through broad digital color fields, layered water and land shapes, and a carefully placed subject. The accompanying studio photograph keeps the finished image connected to the physical act of making.",
    tools: ["Digital painting", "Color studies", "Studio documentation"],
  },
  {
    slug: "calligraphy-practice",
    title: "Calligraphy Practice",
    category: "Design",
    year: "Undated",
    tone: "coral",
    summary:
      "A practice-led collection of Chinese calligraphy, from repeated character studies to red New Year couplets arranged across the studio floor.",
    context:
      "The work treats writing as both language and movement. Repetition makes spacing, pressure, and the changing weight of each stroke visible.",
    process:
      "I moved between gray practice sheets and saturated red couplets, comparing rhythm, balance, and composition across different formats. The process values variation and gradual control over uniformity.",
    tools: ["Chinese calligraphy", "Brush and ink", "Composition"],
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
