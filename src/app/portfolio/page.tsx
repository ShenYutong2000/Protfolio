import { PortfolioTemplate } from "@/components/portfolio/PortfolioTemplate";

export default async function PortfolioPage({ searchParams }: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const initialPath = view === "index" ? "/index" : "/";
  return <PortfolioTemplate initialPath={initialPath} />;
}
