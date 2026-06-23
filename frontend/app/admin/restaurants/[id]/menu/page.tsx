import RestaurantEditor from "@/components/admin/RestaurantEditor";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <RestaurantEditor id={Number(id)} mode="menu" />; }
