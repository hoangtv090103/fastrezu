import { createClient } from "@/lib/supabase-server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faCalendar,
  faLink,
} from "@fortawesome/free-solid-svg-icons";
import JobAnalysisSection from "@/components/jobs/JobAnalysisSection";
import CrawlJDButton from "@/components/jobs/CrawlJDButton";
import JobDetailEditButton from "@/components/jobs/JobDetailEditButton";
import TailorResumeButton from "@/components/jobs/TailorResumeButton";
import type { TailoredResumeData } from "@/components/cv/TailoredCVPreview";
import BackToJobsLink from "@/components/jobs/BackToJobsLink";

// ── Status config ────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  saved: { label: "Đã lưu", bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  optimized: { label: "Đã tối ưu", bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  applied: { label: "Đã nộp", bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  interviewing: { label: "Phỏng vấn", bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  offer: { label: "Offer", bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  rejected: { label: "Từ chối", bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Fetch job (RLS ensures ownership)
  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, company_name, status, job_url, created_at, raw_jd_text")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!job) notFound();

  // Fetch existing analysis (may not exist yet)
  const { data: analysis } = await supabase
    .from("job_analyses")
    .select("keywords_required, match_score, gap_analysis")
    .eq("job_id", id)
    .maybeSingle();

  // Fetch existing tailored resume (may not exist yet)
  const { data: resume } = await supabase
    .from("resumes")
    .select("id, content_snapshot, created_at")
    .eq("job_id", id)
    .maybeSingle();

  const status = job.status ?? "saved";
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.saved;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ── Back navigation ── */}
        <BackToJobsLink />

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faBuilding} className="w-3.5 h-3.5 text-gray-400" />
                {job.company_name}
              </span>
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faCalendar} className="w-3.5 h-3.5 text-gray-400" />
                {formatDate(job.created_at)}
              </span>
              {job.job_url && (
                <a
                  href={job.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-blue-600 hover:underline"
                >
                  <FontAwesomeIcon icon={faLink} className="w-3.5 h-3.5" />
                  Xem job gốc
                </a>
              )}
            </div>
          </div>

          <JobDetailEditButton job={job} />
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left: JD text (3/5) */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700">
                  Mô tả công việc (JD)
                </h2>
                {job.raw_jd_text && job.job_url && (
                  <CrawlJDButton jobId={job.id} variant="ghost" />
                )}
              </div>
              {job.raw_jd_text ? (
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {job.raw_jd_text}
                </p>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                  <p className="text-sm text-gray-400 mb-3">
                    Chưa có mô tả công việc.
                  </p>
                  {job.job_url ? (
                    <CrawlJDButton jobId={job.id} variant="primary" />
                  ) : (
                    <JobDetailEditButton
                      job={job}
                      variant="link"
                      label="Thêm JD hoặc URL"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: AI analysis + Tailor Resume (2/5) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-6 space-y-6">
              <JobAnalysisSection
                jobId={job.id}
                hasJd={!!job.raw_jd_text}
                initialAnalysis={
                  analysis
                    ? {
                        keywords_required: analysis.keywords_required ?? [],
                        match_score: analysis.match_score ?? 0,
                        gap_analysis: analysis.gap_analysis ?? "",
                      }
                    : null
                }
              />

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* Tailor Resume section */}
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  ✨ May đo CV
                </h2>
                <TailorResumeButton
                  jobId={job.id}
                  hasJd={!!job.raw_jd_text}
                  initialResume={
                    resume
                      ? {
                          id: resume.id,
                          content_snapshot: resume.content_snapshot as TailoredResumeData | null,
                          created_at: resume.created_at,
                        }
                      : null
                  }
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
