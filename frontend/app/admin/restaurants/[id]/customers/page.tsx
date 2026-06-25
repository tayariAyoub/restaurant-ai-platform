import CustomersDashboard from "@/components/admin/CustomersDashboard";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomersDashboard id={Number(id)} />;
}
