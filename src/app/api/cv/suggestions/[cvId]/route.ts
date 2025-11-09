import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { cvIdSchema, validateSchema } from "@/lib/validation-schemas";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cvId: string }> }
) {
  try {
    const { cvId } = await params;
    
    // Validate cvId
    const validation = validateSchema(cvIdSchema, cvId);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.firstError, details: validation.errors },
        { status: 400 }
      );
    }
    
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
    const {
      data: cv,
      error: cvError,
    }: { data: { id: string; user_id: string } | null; error: Error | null } =
      await supabase.from("cvs").select("id, user_id").eq("id", cvId).single();

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

    // Get active suggestions
    const { data: suggestions, error: suggestionsError } = await supabase
      .from("ats_suggestions")
      .select("*")
      .eq("cv_id", cvId)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (suggestionsError) {
      console.error("Error fetching suggestions:", suggestionsError);
      return NextResponse.json(
        { error: "Failed to fetch suggestions" },
        { status: 500 }
      );
    }

    // Normalize and filter invalid target_sections
    const normalizeTargetSection = (section: string): string | null => {
      // Convert camelCase to snake_case
      const normalized = section
        .replace(/([A-Z])/g, "_$1")
        .toLowerCase()
        .replace(/^_/, ""); // Remove leading underscore

      const allowedSections = [
        "personal_info",
        "summary",
        "experience",
        "education",
        "projects",
        "skills",
        "certifications",
      ];

      // Check if normalized value is in allowed list
      if (allowedSections.includes(normalized)) return normalized;
      if (allowedSections.includes(section)) return section;

      return null;
    };

    // Filter and normalize suggestions
    const validSuggestions = (suggestions || [])
      .map((suggestion: { target_section: string; [key: string]: unknown }) => {
        const normalizedSection = normalizeTargetSection(suggestion.target_section);
        if (!normalizedSection) {
          console.warn(
            `Filtering out suggestion ${suggestion.suggestion_id || "unknown"}: invalid target_section "${suggestion.target_section}"`
          );
          return null;
        }
        return {
          ...suggestion,
          target_section: normalizedSection,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    return NextResponse.json({ suggestions: validSuggestions });
  } catch (error) {
    console.error("Error in suggestions GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
