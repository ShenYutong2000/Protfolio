import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailPage } from "@/components/DetailPage";
import { getPortfolioItem, portfolioItems } from "@/data/content";

type PortfolioPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return portfolioItems.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: PortfolioPageProps): Promise<Metadata> {
  const item = getPortfolioItem((await params).slug);
  return item
    ? { title: item.title, description: item.summary }
    : { title: "Work not found" };
}

export default async function PortfolioDetailPage({
  params,
}: PortfolioPageProps) {
  const item = getPortfolioItem((await params).slug);

  if (!item) {
    notFound();
  }

  return (
    <DetailPage
      backHref="/portfolio"
      backLabel="Creative collection"
      type={item.category}
      year={item.year}
      title={item.title}
      summary={item.summary}
      facts={[
        { label: "Category", value: item.category },
        { label: "Year", value: item.year },
        { label: "Contribution", value: "Concept, process & final work" },
      ]}
      tags={item.tools}
      sections={[
        {
          label: "Context",
          title: "Where the work began",
          body: item.context,
        },
        {
          label: "Process",
          title: "How the idea took shape",
          body: item.process,
        },
        {
          label: "Reflection",
          title: "What I carried forward",
          body: "Use this section to reflect on what changed during the process, what you learned, and what you would explore next.",
        },
      ]}
      tone={item.tone}
    />
  );
}
