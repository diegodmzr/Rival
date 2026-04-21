import { ProjectDetailContent } from "@/components/views/ProjectDetailContent";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return <ProjectDetailContent id={params.id} />;
}
