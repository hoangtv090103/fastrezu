import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import ScannerContent from "@/components/scanner/ScannerContent";

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

  // Fetch existing vault sections so VaultImportPanel knows which are already filled
  const { data: sections } = await supabase
    .from("master_profiles")
    .select("section_type, content")
    .eq("user_id", user.id);

  const existingVaultSections = (sections ?? []).reduce<Record<string, unknown>>(
    (acc, row) => {
      acc[row.section_type] = row.content;
      return acc;
    },
    {},
  );

  // Fetch enabled optional sections for vault_settings so we know what to enable after import
  const { data: vaultSettings } = await supabase
    .from("vault_settings")
    .select("enabled_sections")
    .eq("user_id", user.id)
    .maybeSingle();

  const existingEnabledSections = Array.isArray(vaultSettings?.enabled_sections)
    ? (vaultSettings.enabled_sections as string[])
    : [];

  return (
    <ScannerContent
      existingVaultSections={existingVaultSections}
      existingEnabledSections={existingEnabledSections}
    />
  );
}
