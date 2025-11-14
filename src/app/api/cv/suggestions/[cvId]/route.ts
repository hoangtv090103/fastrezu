import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { cvIdSchema, validateSchema } from "@/lib/validation-schemas";
import { translateTexts } from "@/lib/translate";
import { ATSuggestion } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cvId: string }> }
) {
  try {
    const { cvId } = await params;
    const uiLangParam = request.nextUrl.searchParams.get('ui');
    const uiLang = uiLangParam === 'en' ? 'en' : uiLangParam === 'vi' ? 'vi' : null;
    
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
    let validSuggestions = (suggestions || [])
      .map((suggestion: ATSuggestion) => {
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

    // If a UI language is specified, translate suggestion_text to that language for display
    if (uiLang && validSuggestions.length > 0) {
      try {
        const texts = validSuggestions.map((s) => String(s.suggestion_text || ''));
        const translated = await translateTexts(texts, uiLang, 'auto');
        validSuggestions = validSuggestions.map((s, idx) => ({
          ...s,
          suggestion_text: translated[idx] || s.suggestion_text,
        }));
      } catch (e) {
        console.error('Failed to translate suggestion_texts for UI:', e);
        // Continue returning original texts if translation fails
      }
    }

    return NextResponse.json({ suggestions: validSuggestions });
  } catch (error) {
    console.error("Error in suggestions GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
