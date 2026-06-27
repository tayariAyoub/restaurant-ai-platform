import MenuBuilder from "@/components/admin/MenuBuilder";

export default async function BuilderMenuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MenuBuilder restaurantId={Number(id)} />;
}
