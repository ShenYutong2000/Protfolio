import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailPage } from "@/components/DetailPage";
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

  return (
    <DetailPage
      backHref="/research"
      backLabel="Research index"
      type={item.type}
      year={item.year}
      title={item.title}
      summary={item.summary}
      facts={[
        { label: "Venue", value: item.venue },
        { label: "Status", value: item.status },
        { label: "With", value: item.collaborators },
      ]}
      tags={item.keywords}
      sections={[
        {
          label: "Question",
          title: "What the research asks",
          body: item.question,
        },
        {
          label: "Method",
          title: "How the question was investigated",
          body: item.method,
        },
        {
          label: "Finding",
          title: "What the work contributes",
          body: item.result,
        },
      ]}
      links={item.links}
      tone="mint"
    />
  );
}
