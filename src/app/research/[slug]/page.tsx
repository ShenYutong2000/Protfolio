import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResearchPixelPage } from "@/components/projects/ProjectPixelPage";
import type { Project } from "@/data/content";
import { getResearchItem, research } from "@/data/content";

type ResearchPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return research.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: ResearchPageProps): Promise<Metadata> {
  const item = getResearchItem((await params).slug);
  return item
    ? { title: item.title, description: item.summary }
    : { title: "Research not found" };
}

export default async function ResearchDetailPage({
  params,
}: ResearchPageProps) {
  const item = getResearchItem((await params).slug);

  if (!item) {
    notFound();
  }

  const itemIndex = research.findIndex((entry) => entry.slug === item.slug);
  const nextItem = research[(itemIndex + 1) % research.length];
  const toPixelEntry = (entry: typeof item, index: number): Project => ({
    slug: entry.slug,
    index: String(index + 1).padStart(2, "0"),
    title: entry.title,
    summary: entry.summary,
    meta: entry.venue,
    year: entry.year,
    duration: entry.status,
    role: entry.collaborators,
    tags: entry.keywords,
    challenge: entry.question,
    approach: entry.method,
    outcome: entry.result,
    links: entry.links,
    caseStudy: entry.visuals
      ? {
          overview: { image: entry.visuals.hero },
          challenge: { image: entry.visuals.question },
          approach: { image: entry.visuals.method },
          outcome: { image: entry.visuals.finding },
        }
      : undefined,
  });

  return (
    <ResearchPixelPage
      project={toPixelEntry(item, itemIndex)}
      nextProject={toPixelEntry(nextItem, (itemIndex + 1) % research.length)}
      entryType={item.type}
    />
  );
}
