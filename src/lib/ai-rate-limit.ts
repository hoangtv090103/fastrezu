import type { SupabaseClient } from "@supabase/supabase-js";

// Tiers that bypass daily limit entirely (unlimited usage)
const UNLIMITED_TIERS = new Set(["sprint_pass", "pro_pass", "beta_free"]);

/**
 * Check if the user is within their daily AI usage limit and record the call.
 *
 * - Unlimited tiers (sprint_pass, pro_pass, beta_free): always allowed, logged for analytics.
 * - Free tier: limit is read from the `ai_rate_limit_config` table (admin-configurable).
 *   Rolling 24-hour window. Returns { allowed: false } if limit exceeded.
 *
 * @param supabase   Authenticated Supabase client
 * @param userId     auth.users id of the current user
 * @param feature    Feature name (e.g. "tailor-resume"). Used for per-feature overrides.
 * @param subscriptionTier  Value from user_profiles.subscription_tier
 */
export async function checkAndRecordAIUsage(
  supabase: SupabaseClient,
  userId: string,
  feature: string,
  subscriptionTier?: string | null,
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const tier = subscriptionTier ?? "free";

  // Unlimited tiers — log for analytics but never block
  if (UNLIMITED_TIERS.has(tier)) {
    const { error } = await supabase
      .from("ai_usage_logs")
      .insert({ user_id: userId, feature });
    if (error) console.error("Error logging AI usage for unlimited tier:", error);
    return { allowed: true, used: 0, limit: -1 };
  }

  // Fetch limit from admin-configurable table.
  // A feature-specific row wins over the 'default' fallback row.
  const { data: configs } = await supabase
    .from("ai_rate_limit_config")
    .select("feature, daily_limit")
    .eq("tier", tier)
    .in("feature", [feature, "default"]);

  const specific = configs?.find((c) => c.feature === feature);
  const fallback = configs?.find((c) => c.feature === "default");
  const limit: number = (specific ?? fallback)?.daily_limit ?? 10;

  // If config says unlimited (-1), allow without counting
  if (limit === -1) {
    const { error } = await supabase
      .from("ai_usage_logs")
      .insert({ user_id: userId, feature });
    if (error) console.error("Error logging AI usage for unlimited limit:", error);
    return { allowed: true, used: 0, limit: -1 };
  }

  // Count usage in the rolling 24-hour window
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Record this call first to mitigate race condition
  const { data: insertedLog, error: insertError } = await supabase
    .from("ai_usage_logs")
    .insert({ user_id: userId, feature })
    .select("id")
    .single();

  if (insertError) {
    console.error("Error logging AI usage for rate limit check:", insertError);
  }

  const { count } = await supabase
    .from("ai_usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature", feature)
    .gte("created_at", since);

  const used = count ?? 0;
  if (used > limit) {
    // Best effort rollback to prevent spam from permanently locking the user's limit higher than allowed
    if (insertedLog?.id) {
      supabase.from("ai_usage_logs").delete().eq("id", insertedLog.id).then();
    }
    return { allowed: false, used: limit, limit };
  }

  return { allowed: true, used, limit };
}

/**
 * Standard 429 response when rate limit is exceeded.
 */
export function rateLimitExceededResponse(used: number, limit: number) {
  return Response.json(
    {
      error: `Bạn đã dùng ${used}/${limit} lượt AI hôm nay. Giới hạn sẽ được làm mới sau 24 giờ.`,
    },
    { status: 429 },
  );
}
