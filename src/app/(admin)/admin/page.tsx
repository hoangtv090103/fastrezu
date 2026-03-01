import { Suspense } from "react";
import { createClient, createServiceClient } from "@/lib/supabase-server";
import { requirePermission } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

const TIERS = ["free", "sprint_pass", "pro_pass", "beta_free"] as const;

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();
  await requirePermission(service, user.id, "metrics", "read");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <Suspense
        fallback={
          <div className="animate-pulse space-y-8">
            <div className="h-24 bg-gray-200 rounded-lg w-full"></div>
            <div className="h-24 bg-gray-200 rounded-lg w-48"></div>
            <div className="h-48 bg-gray-200 rounded-lg w-full"></div>
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  const service = createServiceClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day30ago = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // User counts by tier using optimized exact counts
  const byTier: Record<string, number> = {};
  await Promise.all(
    TIERS.map(async (t) => {
      let query = service
        .from("user_profiles")
        .select("id", { count: "exact", head: true })
        .eq("active", true);

      if (t === "free") {
        query = query.or("subscription_tier.eq.free,subscription_tier.is.null");
      } else {
        query = query.eq("subscription_tier", t);
      }

      const { count } = await query;
      byTier[t] = count ?? 0;
    }),
  );

  const { count: suspendedCount } = await service
    .from("user_profiles")
    .select("id", { count: "exact", head: true })
    .eq("active", false);

  // AI calls today
  const { count: callsToday } = await service
    .from("ai_usage_logs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", today.toISOString());

  // Top features (last 30 days) - limit to 5000 to save memory
  const { data: featureLogs } = await service
    .from("ai_usage_logs")
    .select("feature")
    .gte("created_at", day30ago)
    .limit(5000);

  const featureCounts: Record<string, number> = {};
  featureLogs?.forEach((row) => {
    featureCounts[row.feature] = (featureCounts[row.feature] ?? 0) + 1;
  });
  const topFeatures = Object.entries(featureCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <>
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Người dùng theo gói
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TIERS.map((tier) => (
            <div
              key={tier}
              className="bg-white rounded-lg p-4 shadow-sm border"
            >
              <p className="text-xs text-gray-500 uppercase">
                {tier.replace("_", " ")}
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {byTier[tier] ?? 0}
              </p>
            </div>
          ))}
          <div className="bg-red-50 rounded-lg p-4 shadow-sm border border-red-200">
            <p className="text-xs text-red-500 uppercase">Suspended</p>
            <p className="text-3xl font-bold text-red-700 mt-1">
              {suspendedCount}
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          AI Calls
        </h2>
        <div className="bg-white rounded-lg p-4 shadow-sm border inline-block">
          <p className="text-4xl font-bold text-blue-600">{callsToday ?? 0}</p>
          <p className="text-sm text-gray-500 mt-1">hôm nay</p>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Top features (30 ngày)
        </h2>
        <div className="bg-white rounded-lg shadow-sm border divide-y">
          {topFeatures.map(([feature, count]) => (
            <div
              key={feature}
              className="flex justify-between items-center px-4 py-3"
            >
              <span className="text-sm text-gray-700 font-mono">{feature}</span>
              <span className="text-sm font-semibold text-gray-900">
                {count} calls
              </span>
            </div>
          ))}
          {topFeatures.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-400">Chưa có dữ liệu</p>
          )}
        </div>
      </section>
    </>
  );
}
