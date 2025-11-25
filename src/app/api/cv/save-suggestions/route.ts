import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { type ATSuggestionInsert } from "@/types";
import { cvIdSchema, validateSchema } from "@/lib/validation-schemas";
import { z } from "zod";

// Schema specific for this endpoint's suggestion format
const saveSuggestionsInternalSchema = z.object({
  cvId: cvIdSchema,
  suggestions: z.array(z.object({
    suggestion_text: z.string(),
    suggestion_type: z.string(),
    target_section: z.string(),
    target_index: z.number().nullable().optional(),
    keyword: z.string().nullable().optional(),
    priority: z.enum(['high', 'medium', 'low']),
    original_content: z.unknown(),
    suggested_content: z.unknown(),
  })),
});



export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate with Zod
    const validation = validateSchema(saveSuggestionsInternalSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.firstError, details: validation.errors },
        { status: 400 }
      );
    }
    
    const { cvId, suggestions } = validation.data;

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
      .map((suggestion, index: number) => {
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
          suggested_content: suggestion.suggested_content,
          is_active: true,
          is_applied: false,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    // Insert suggestions
    const { error: insertError } = await supabase
      .from("ats_suggestions")
      // @ts-expect-error - Supabase createServerClient types not fully inferred from Database generic
      .upsert(suggestionsToInsert as ATSuggestionInsert[], {
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
