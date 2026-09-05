import type { Metadata } from "next";
import "../styles/section.css";
import "../styles/portfolio.css";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "An interactive photographic portfolio with Selected and Index views.",
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
