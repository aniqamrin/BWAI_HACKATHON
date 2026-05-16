import DashboardLayout from "@/components/layout/DashboardLayout";

export default function GraphLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-lg shimmer" />
        <div className="flex gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-6 w-24 rounded-full shimmer" />)}
        </div>
        <div className="rounded-2xl shimmer" style={{ height: "calc(100vh - 280px)", minHeight: 500 }} />
      </div>
    </DashboardLayout>
  );
}
