import type { PortfolioItem } from "./types";

export const portfolioItems = [
  {
    slug: "watercolor-architecture",
    title: "Watercolor Architecture",
    category: "Design",
    year: "Undated",
    tone: "blue",
    summary: "A watercolor series studying Chinese gates, red courtyards, layered roofs, and the color relationships that make architectural spaces feel lived in.",
    context: "The series began with close observation of traditional architecture. I focused on thresholds, rooflines, painted surfaces, and small shifts of color rather than treating each building as a neutral document.",
    process: "I worked from observed scenes and built each image through layered washes, ink-like marks, and concentrated color accents. Repeating architectural details became a way to study rhythm, depth, and framing.",
    tools: ["Watercolor", "Ink", "Observational drawing"],
  },
  {
    slug: "architectural-line-studies",
    title: "Architectural Line Studies",
    category: "Design",
    year: "Undated",
    tone: "mint",
    summary: "A collection of pen-and-ink drawings exploring campus buildings, Gothic churches, sculpture, and the visual structure of places passed through.",
    context: "These drawings use architecture as a subject for attention and memory. The work moves between a campus building, Gothic facades, sculptural forms, and travel-related scenes.",
    process: "I sketched directly from reference, building forms with contour, cross-hatching, repeated windows, and directional lines. The loose marks preserve the decisions and corrections made while looking.",
    tools: ["Pen and ink", "Sketchbook", "Architectural observation"],
  },
  {
    slug: "whale-watching",
    title: "Whale Watching",
    category: "Design",
    year: "Undated",
    tone: "yellow",
    summary: "A digital painting pairing a blue coastal landscape with a small whale, documented alongside the studio setup where the painting was made.",
    context: "The piece studies scale and distance: a broad landscape establishes a calm field while the whale creates a small point of movement and attention.",
    process: "I developed the image through broad digital color fields, layered water and land shapes, and a carefully placed subject. The accompanying studio photograph keeps the finished image connected to the physical act of making.",
    tools: ["Digital painting", "Color studies", "Studio documentation"],
  },
  {
    slug: "calligraphy-practice",
    title: "Calligraphy Practice",
    category: "Design",
    year: "Undated",
    tone: "coral",
    summary: "A practice-led collection of Chinese calligraphy, from repeated character studies to red New Year couplets arranged across the studio floor.",
    context: "The work treats writing as both language and movement. Repetition makes spacing, pressure, and the changing weight of each stroke visible.",
    process: "I moved between gray practice sheets and saturated red couplets, comparing rhythm, balance, and composition across different formats. The process values variation and gradual control over uniformity.",
    tools: ["Chinese calligraphy", "Brush and ink", "Composition"],
  },
] satisfies PortfolioItem[];

export function getPortfolioItem(slug: string) {
  return portfolioItems.find((item) => item.slug === slug);
}
