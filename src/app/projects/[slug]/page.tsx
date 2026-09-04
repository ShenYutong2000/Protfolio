import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailPage } from "@/components/DetailPage";
import { getProject, projects } from "@/data/content";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const project = getProject((await params).slug);
  return project
    ? { title: project.title, description: project.summary }
    : { title: "Project not found" };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const project = getProject((await params).slug);

  if (!project) {
    notFound();
  }

  return (
    <DetailPage
      backHref="/projects"
      backLabel="All projects"
      type="Project case study"
      year={project.year}
      title={project.title}
      summary={project.summary}
      facts={[
        { label: "Role", value: project.role },
        { label: "Duration", value: project.duration },
        { label: "Focus", value: project.meta },
      ]}
      tags={project.tags}
      sections={[
        { label: "Challenge", title: "The question behind the work", body: project.challenge },
        { label: "Approach", title: "From research to a working direction", body: project.approach },
        { label: "Outcome", title: "What the project made possible", body: project.outcome },
      ]}
      links={project.links}
    />
  );
}
