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

  const jobList = jobs ?? [];

  // Fetch which jobs already have a tailored resume
  const { data: resumeRows } = await supabase
    .from("resumes")
    .select("job_id")
    .in("job_id", jobList.map((j) => j.id));

  const resumeJobIds = new Set(resumeRows?.map((r) => r.job_id) ?? []);
  const enrichedJobs = jobList.map((j) => ({
    ...j,
    has_resume: resumeJobIds.has(j.id),
  }));

  return <KanbanBoard initialJobs={enrichedJobs} />;
}
