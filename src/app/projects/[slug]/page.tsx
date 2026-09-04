import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KindProjectPage } from "@/components/projects/KindProjectPage";
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

  const projectIndex = projects.findIndex((item) => item.slug === project.slug);
  const nextProject = projects[(projectIndex + 1) % projects.length] ?? projects[0];
  return <KindProjectPage project={project} nextProject={nextProject} />;
}
