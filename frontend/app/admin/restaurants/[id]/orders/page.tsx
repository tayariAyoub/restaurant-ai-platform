import OrdersDashboard from "@/components/admin/OrdersDashboard";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <OrdersDashboard id={Number(id)} />; }
