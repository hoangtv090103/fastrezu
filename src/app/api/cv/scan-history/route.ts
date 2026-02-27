import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import type { CVEvaluationResult } from "@/app/api/ai/evaluate-cv/route";
import type { ExtractedProfile } from "@/app/api/ai/extract-profile-from-cv/route";

const SCAN_FILES_BUCKET = "cv-scan-files";

// ── Shared type (re-exported so panel/page can import it) ─────────────────────

export interface ScanHistoryItem {
  id: string;
  file_name: string;
  file_storage_path: string | null;
  overall_score: number | null;
  ats_score: number | null;
  design_score: number | null;
  scanned_at: string;
}

export interface ScanHistoryDetail extends ScanHistoryItem {
  evaluation: CVEvaluationResult;
  extracted_profile: ExtractedProfile;
}

// ── GET /api/cv/scan-history — list (20 most recent) ─────────────────────────

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("cv_scan_history")
      .select("id, file_name, file_storage_path, overall_score, ats_score, design_score, scanned_at")
      .eq("user_id", user.id)
      .order("scanned_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json(data ?? [], { status: 200 });
  } catch (err) {
    console.error("[scan-history GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── POST /api/cv/scan-history — save a new scan ───────────────────────────────
// Accepts multipart/form-data with:
//   file            – the original CV file (optional)
//   evaluation      – JSON string of CVEvaluationResult
//   extracted_profile – JSON string of ExtractedProfile

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    type FormDataGet = { get: (key: string) => string | File | null };
    const formData = (await request.formData()) as unknown as FormDataGet;
    const file = formData.get("file") as File | null;
    const evaluationRaw = formData.get("evaluation") as string | null;
    const extractedProfileRaw = formData.get("extracted_profile") as string | null;

    if (!evaluationRaw || !extractedProfileRaw) {
      return NextResponse.json(
        { error: "evaluation and extracted_profile are required" },
        { status: 400 },
      );
    }

    const evaluation = JSON.parse(evaluationRaw) as CVEvaluationResult;
    const extracted_profile = JSON.parse(extractedProfileRaw) as ExtractedProfile;
    const file_name = ((formData.get("file_name") as string | null) ?? file?.name ?? "CV");

    // Upload file to Supabase Storage (best-effort — failure does not block save)
    let file_storage_path: string | null = null;
    if (file && file.size > 0) {
      const ext = file.name.split(".").pop() ?? "pdf";
      const storagePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(SCAN_FILES_BUCKET)
        .upload(storagePath, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        console.warn("[scan-history] file upload failed (non-fatal):", uploadError.message);
      } else {
        file_storage_path = storagePath;
      }
    }

    const insertRow = {
      user_id: user.id,
      file_name,
      file_storage_path,
      overall_score: evaluation.overall_score ?? null,
      ats_score: evaluation.ats_score ?? null,
      design_score: evaluation.design_score ?? null,
      evaluation: evaluation as unknown as import("@/types/database.types").Json,
      extracted_profile: extracted_profile as unknown as import("@/types/database.types").Json,
    };

    const { data, error } = await supabase
      .from("cv_scan_history")
      .insert(insertRow)
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ id: data.id, file_storage_path }, { status: 201 });
  } catch (err) {
    console.error("[scan-history POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
