import { createClient } from "@/lib/supabase-server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faClockRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import type { CVEvaluationResult } from "@/app/api/ai/evaluate-cv/route";
import type { ExtractedProfile } from "@/app/api/ai/extract-profile-from-cv/route";
import EvaluationResultsView from "@/components/scanner/EvaluationResultsView";
import VaultImportPanel from "@/components/scanner/VaultImportPanel";
import ScanFileViewer from "@/components/scanner/ScanFileViewer";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return {
    title: `Scan Detail ${id.slice(0, 8)} - FastRezu`,
  };
}

export default async function ScanHistoryDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch this specific scan record (RLS ensures user can only see their own)
  const { data: scan, error } = await supabase
    .from("cv_scan_history")
    .select("id, file_name, file_storage_path, scanned_at, evaluation, extracted_profile")
    .eq("id", id)
    .single();

  if (error || !scan) notFound();

  const evaluation = scan.evaluation as unknown as CVEvaluationResult;
  const extractedProfile = scan.extracted_profile as unknown as ExtractedProfile;
  const fileStoragePath = scan.file_storage_path as string | null;

  const scannedAt = new Date(scan.scanned_at as string).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Generate signed URL for the CV file (1 hour expiry)
  let signedFileUrl: string | null = null;
  if (fileStoragePath) {
    const { data: urlData } = await supabase.storage
      .from("cv-scan-files")
      .createSignedUrl(fileStoragePath, 3600);
    signedFileUrl = urlData?.signedUrl ?? null;
  }

  // Fetch existing vault data so VaultImportPanel can mark duplicates
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

  const { data: vaultSettings } = await supabase
    .from("vault_settings")
    .select("enabled_sections")
    .eq("user_id", user.id)
    .maybeSingle();

  const existingEnabledSections = Array.isArray(vaultSettings?.enabled_sections)
    ? (vaultSettings.enabled_sections as string[])
    : [];

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/dashboard/scanner"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faClockRotateLeft} className="w-5 h-5 text-indigo-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {scan.file_name as string}
            </h1>
          </div>
        </div>
        <p className="text-gray-500 text-sm ml-9">{scannedAt}</p>
      </div>

      {/* CV file viewer — shown only if a file was saved */}
      {fileStoragePath && (
        <ScanFileViewer
          signedUrl={signedFileUrl}
          fileName={scan.file_name as string}
          fileStoragePath={fileStoragePath}
        />
      )}

      {/* Evaluation results — re-uses the exact same component as live scan */}
      <EvaluationResultsView evaluation={evaluation} />

      {/* Vault import panel — re-uses the exact same component; user can import again */}
      <VaultImportPanel
        extractedProfile={extractedProfile}
        existingVaultSections={existingVaultSections}
        existingEnabledSections={existingEnabledSections}
      />
    </div>
  );
}
