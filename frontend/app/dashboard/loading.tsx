import DashboardLayout from "@/components/layout/DashboardLayout";

export default function DashboardLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="h-8 w-64 rounded-lg shimmer" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-xl shimmer" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-64 rounded-xl shimmer" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => <div key={i} className="h-48 rounded-xl shimmer" />)}
        </div>
      </div>
    </DashboardLayout>
  );
}
