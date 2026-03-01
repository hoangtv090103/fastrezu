import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DashboardContent from "@/components/dashboard/DashboardContent";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's CVs with sections data
  const { data: cvs, error } = await supabase
    .from("cvs")
    .select(
      `
      *,
      cv_sections (
        section_type,
        data,
        order_index
      )
    `,
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching CVs:", error);
  }

  // @ts-expect-error - Supabase joined query type does not strictly match CV type
  return <DashboardContent cvs={cvs || []} />;
}
