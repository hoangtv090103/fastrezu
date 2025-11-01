import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

interface SuggestionInput {
  suggestion_text: string;
  suggestion_type: string;
  target_section: string;
  target_index?: number | null;
  keyword?: string | null;
  priority: "high" | "medium" | "low";
  original_content: unknown;
  applied_content: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const { cvId, suggestions } = await request.json();

    if (!cvId || !Array.isArray(suggestions)) {
      return NextResponse.json(
        { error: "cvId and suggestions array are required" },
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

    const cvData = cv as { user_id: string };
    if (cvData.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Normalize target_section function
    const normalizeTargetSection = (section: string): string | null => {
      // Convert camelCase to snake_case
      const normalized = section
        .replace(/([A-Z])/g, "_$1")
        .toLowerCase()
        .replace(/^_/, ""); // Remove leading underscore

      // Map of valid sections
      const sectionMap: Record<string, string> = {
        personal_info: "personal_info",
        personalinfo: "personal_info",
        summary: "summary",
        experience: "experience",
        education: "education",
        projects: "projects",
        skills: "skills",
        certifications: "certifications",
        // Invalid sections - skip
        languages: null as unknown as string,
      };

      // Check direct match or mapped value
      if (sectionMap[section]) return sectionMap[section];
      if (sectionMap[normalized]) return sectionMap[normalized];

      // Allow if it's already a valid snake_case section
      const validSections = [
        "personal_info",
        "summary",
        "experience",
        "education",
        "projects",
        "skills",
        "certifications",
      ];
      if (validSections.includes(normalized)) return normalized;

      return null; // Invalid section
    };

    // Prepare suggestions for insertion
    const suggestionsToInsert = suggestions
      .map((suggestion: SuggestionInput, index: number) => {
        const normalizedSection = normalizeTargetSection(
          suggestion.target_section
        );

        // Skip invalid sections
        if (!normalizedSection) {
          console.warn(
            `Skipping suggestion ${index}: invalid target_section "${suggestion.target_section}"`
          );
          return null;
        }

        return {
          cv_id: cvId,
          suggestion_id: `suggestion-${index}`,
          suggestion_text: suggestion.suggestion_text,
          suggestion_type: suggestion.suggestion_type,
          target_section: normalizedSection,
          target_index: suggestion.target_index ?? null,
          keyword: suggestion.keyword ?? null,
          priority: suggestion.priority,
          original_content: suggestion.original_content,
          applied_content: suggestion.applied_content,
          is_active: true,
          is_applied: false,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    // Insert suggestions
    const { error: insertError } = await supabase
      .from("ats_suggestions")
      .upsert(suggestionsToInsert as any, {
        onConflict: "cv_id,suggestion_id",
      });

    if (insertError) {
      console.error("Error saving suggestions:", insertError);
      return NextResponse.json(
        { error: "Failed to save suggestions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in save-suggestions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
