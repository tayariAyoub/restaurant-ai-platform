import VisualBuilder from "@/components/admin/VisualBuilder";

export default async function BuilderRestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VisualBuilder restaurantId={Number(id)} />;
}
