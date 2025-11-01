import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cvId: string }> }
) {
  try {
    const { cvId } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify CV ownership
    const { data: cv, error: cvError } = await supabase
      .from("cvs")
      .select("id, user_id")
      .eq("id", cvId)
      .single();

    if (cvError || !cv) {
      return NextResponse.json(
        { error: "CV not found" },
        { status: 404 }
      );
    }

    if (cv.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Deactivate all active suggestions for this CV
    const { error: updateError } = await supabase
      .from("ats_suggestions")
      .update({ is_active: false })
      .eq("cv_id", cvId)
      .eq("is_active", true);

    if (updateError) {
      console.error("Error deactivating suggestions:", updateError);
      return NextResponse.json(
        { error: "Failed to deactivate suggestions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in deactivate-suggestions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
