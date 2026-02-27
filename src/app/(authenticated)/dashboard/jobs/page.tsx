import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import KanbanBoard from "@/components/jobs/KanbanBoard";

export default async function JobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, company_name, status, created_at, job_url, raw_jd_text")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return <KanbanBoard initialJobs={jobs ?? []} />;
}
