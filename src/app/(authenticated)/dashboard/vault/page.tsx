import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import VaultContent from "@/components/vault/VaultContent";

export const metadata = {
  title: "The Vault - FastRezu",
  description: "Nhập liệu hồ sơ sự nghiệp của bạn một lần, dùng mãi mãi.",
};

export default async function VaultPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch tất cả sections của user
  const { data: sections } = await supabase
    .from("master_profiles")
    .select("section_type, content")
    .eq("user_id", user.id);

  // Reshape: array → map { section_type: content }
  const sectionMap = (sections ?? []).reduce<Record<string, unknown>>(
    (acc, row) => {
      acc[row.section_type] = row.content;
      return acc;
    },
    {},
  );

  return (
    <VaultContent
      initialData={{
        personal: sectionMap["personal"] as never,
        summary: sectionMap["summary"] as never,
        experience: sectionMap["experience"] as never,
        education: sectionMap["education"] as never,
        skills: sectionMap["skills"] as never,
        projects: sectionMap["projects"] as never,
      }}
    />
  );
}
