import AiControlPanel from "@/components/admin/AiControlPanel";

export default async function BuilderAiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AiControlPanel restaurantId={Number(id)} />;
}
