import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import ScannerContent from "@/components/scanner/ScannerContent";
import type { ScanHistoryItem } from "@/app/api/cv/scan-history/route";

export const metadata = {
  title: "The Scanner - FastRezu",
  description: "Upload CV của bạn để AI đánh giá chất lượng và trích xuất dữ liệu vào The Vault.",
};

export default async function ScannerPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Run all DB fetches in parallel
  const [sectionsResult, vaultSettingsResult, historyResult] = await Promise.all([
    supabase
      .from("master_profiles")
      .select("section_type, content")
      .eq("user_id", user.id),
    supabase
      .from("vault_settings")
      .select("enabled_sections")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("cv_scan_history")
      .select("id, file_name, overall_score, ats_score, design_score, scanned_at")
      .eq("user_id", user.id)
      .order("scanned_at", { ascending: false })
      .limit(20),
  ]);

  const existingVaultSections = (sectionsResult.data ?? []).reduce<Record<string, unknown>>(
    (acc, row) => {
      acc[row.section_type] = row.content;
      return acc;
    },
    {},
  );

  const existingEnabledSections = Array.isArray(
    vaultSettingsResult.data?.enabled_sections,
  )
    ? (vaultSettingsResult.data.enabled_sections as string[])
    : [];

  const initialHistory = (historyResult.data ?? []) as unknown as ScanHistoryItem[];

  return (
    <ScannerContent
      existingVaultSections={existingVaultSections}
      existingEnabledSections={existingEnabledSections}
      initialHistory={initialHistory}
    />
  );
}
