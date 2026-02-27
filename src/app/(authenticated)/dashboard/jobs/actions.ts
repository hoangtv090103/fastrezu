"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export interface NewJobCard {
  id: string;
  title: string;
  company_name: string;
  status: string | null;
  created_at: string | null;
  job_url: string | null;
}

export async function addJob(data: {
  title: string;
  company_name: string;
  job_url?: string;
  raw_jd_text?: string;
}): Promise<{ success: true; job: NewJobCard } | { success: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { success: false, error: "Unauthorized" };

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      user_id: user.id,
      title: data.title.trim(),
      company_name: data.company_name.trim(),
      job_url: data.job_url?.trim() || null,
      raw_jd_text: data.raw_jd_text?.trim() || null,
      status: "saved",
    })
    .select("id, title, company_name, status, created_at, job_url")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/jobs");
  return { success: true, job: job as NewJobCard };
}

export async function updateJobStatus(
  id: string,
  status: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("jobs")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/jobs");
  return { success: true };
}
