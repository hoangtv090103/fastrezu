import { createServiceClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AdminAiUsagePage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const params = await searchParams;
  const days = Math.min(parseInt(params.days ?? "7"), 30);
  const since = new Date();
  since.setDate(since.getDate() - days);

  // Fetch directly using service client instead of API for server component
  const service = createServiceClient();

  const { data: logs } = await service
    .from("ai_usage_logs")
    .select("user_id, feature, created_at")
    .gte("created_at", since.toISOString());

  const userIds = [...new Set(logs?.map((l) => l.user_id) ?? [])];

  const { data: profiles } =
    userIds.length > 0
      ? await service
          .from("user_profiles")
          .select("id, email, subscription_tier")
          .in("id", userIds)
      : { data: [] };

  const profileMap: Record<
    string,
    { email: string | null; subscription_tier: string | null }
  > = {};
  profiles?.forEach((p) => {
    profileMap[p.id] = {
      email: p.email,
      subscription_tier: p.subscription_tier,
    };
  });

  // Aggregate: user_id × feature → count
  const agg: Record<string, Record<string, number>> = {};
  logs?.forEach((l) => {
    if (!agg[l.user_id]) agg[l.user_id] = {};
    agg[l.user_id][l.feature] = (agg[l.user_id][l.feature] ?? 0) + 1;
  });

  const rows = Object.entries(agg)
    .map(([userId, features]) => ({
      user_id: userId,
      email: profileMap[userId]?.email ?? null,
      subscription_tier: profileMap[userId]?.subscription_tier ?? "free",
      features,
      total: Object.values(features).reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => b.total - a.total);

  // Get all unique features for table headers
  const allFeatures = Array.from(
    new Set(logs?.map((l) => l.feature) ?? []),
  ).sort();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Usage Monitor</h1>
        <div className="flex gap-2">
          {[1, 7, 30].map((d) => (
            <a
              key={d}
              href={`/admin/ai-usage?days=${d}`}
              className={`px-3 py-1 text-sm rounded ${days === d ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
            >
              {d} ngày
            </a>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 tabular-nums">
          <thead className="bg-gray-50 uppercase text-xs font-semibold text-gray-500">
            <tr>
              <th className="px-6 py-3 text-left">Người dùng</th>
              <th className="px-6 py-3 text-left">Gói cước</th>
              <th className="px-6 py-3 text-right">Tổng cộng</th>
              {allFeatures.map((f) => (
                <th key={f} className="px-6 py-3 text-right">
                  {f}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((row) => {
              // Highlight rule: free tier and > 8 total calls
              const isHighFreeUsage =
                row.subscription_tier === "free" && row.total > 8;

              return (
                <tr
                  key={row.user_id}
                  className={isHighFreeUsage ? "bg-orange-50" : ""}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {row.email ?? row.user_id.substring(0, 8) + "..."}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        row.subscription_tier === "pro_pass"
                          ? "bg-purple-100 text-purple-800"
                          : row.subscription_tier === "sprint_pass"
                            ? "bg-green-100 text-green-800"
                            : row.subscription_tier === "beta_free"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {row.subscription_tier}
                    </span>
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${isHighFreeUsage ? "text-orange-600" : "text-gray-900"}`}
                  >
                    {row.total}
                  </td>
                  {allFeatures.map((f) => (
                    <td
                      key={f}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right"
                    >
                      {row.features[f] || "-"}
                    </td>
                  ))}
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={allFeatures.length + 3}
                  className="px-6 py-10 text-center text-sm text-gray-500"
                >
                  Không có dữ liệu trong {days} ngày qua.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
