import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import type { CVEvaluationResult } from "@/app/api/ai/evaluate-cv/route";
import type { ExtractedProfile } from "@/app/api/ai/extract-profile-from-cv/route";

// ── Shared type (re-exported so panel/page can import it) ─────────────────────

export interface ScanHistoryItem {
  id: string;
  file_name: string;
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
      .select("id, file_name, overall_score, ats_score, design_score, scanned_at")
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = (await request.json()) as {
      file_name: string;
      evaluation: CVEvaluationResult;
      extracted_profile: ExtractedProfile;
    };

    const { file_name, evaluation, extracted_profile } = body;

    if (!file_name || !evaluation || !extracted_profile) {
      return NextResponse.json(
        { error: "file_name, evaluation, and extracted_profile are required" },
        { status: 400 },
      );
    }

    const insertRow = {
      user_id: user.id,
      file_name,
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

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err) {
    console.error("[scan-history POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
