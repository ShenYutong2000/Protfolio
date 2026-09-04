import { ProjectGallery } from "@/components/projects/ProjectGallery";
import { projects } from "@/data/content";

export const metadata = {
  title: "Projects",
  description: "Selected product, data, and creative technology projects.",
};

export default function ProjectsPage() {
  return <ProjectGallery projects={projects} />;
}
