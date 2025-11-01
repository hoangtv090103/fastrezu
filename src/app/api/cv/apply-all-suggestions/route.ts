import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import {
  type ATSuggestion,
  type ATSuggestionUpdate,
  type CVSection,
  type CVSectionType,
  type CVSectionInsert,
} from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { cvId } = await request.json();

    if (!cvId) {
      return NextResponse.json({ error: "cvId is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify CV ownership
    const {
      data: cv,
      error: cvError,
    }: { data: { id: string; user_id: string } | null; error: Error | null } =
      await supabase.from("cvs").select("id, user_id").eq("id", cvId).single();

    if (cvError || !cv) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    if (cv?.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all active and unapplied suggestions
    const {
      data: suggestions,
      error: suggestionsError,
    }: { data: ATSuggestion[] | null; error: Error | null } = await supabase
      .from("ats_suggestions")
      .select("*")
      .eq("cv_id", cvId)
      .eq("is_active", true)
      .eq("is_applied", false)
      .order("created_at", { ascending: true });

    if (suggestionsError) {
      console.error("Error fetching suggestions:", suggestionsError);
      return NextResponse.json(
        { error: "Failed to fetch suggestions" },
        { status: 500 }
      );
    }

    if (!suggestions || suggestions.length === 0) {
      return NextResponse.json({
        success: true,
        appliedCount: 0,
        message: "No suggestions to apply",
      });
    }

    // Apply each suggestion
    const appliedSuggestions: string[] = [];
    const failedSuggestions: string[] = [];

    // Normalize target_section function
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
        "ats_analysis",
      ];

      // Check if normalized value is in allowed list
      if (allowedSections.includes(normalized)) return normalized;
      if (allowedSections.includes(section)) return section;

      return null;
    };

    for (const suggestion of suggestions) {
      try {
        // Normalize and validate target_section
        const normalizedSection = normalizeTargetSection(
          suggestion.target_section
        );
        if (!normalizedSection) {
          console.error("Invalid target_section:", suggestion.target_section);
          failedSuggestions.push(suggestion.suggestion_id);
          continue;
        }

        // Use normalized section
        const validatedSuggestion = {
          ...suggestion,
          target_section: normalizedSection,
        };

        // Get current CV section
        const { data: section, error: sectionError } = await supabase
          .from("cv_sections")
          .select("*")
          .eq("cv_id", cvId)
          .eq("section_type", validatedSuggestion.target_section)
          .single();

        if (sectionError && sectionError.code !== "PGRST116") {
          // PGRST116 = no rows returned
          console.error(
            `Error fetching section ${validatedSuggestion.target_section}:`,
            sectionError
          );
          failedSuggestions.push(suggestion.suggestion_id);
          continue;
        }

        // Apply suggestion
        let updatedData: Record<string, unknown>;
        const sectionData = section as CVSection | null;

        if (
          validatedSuggestion.target_index !== null &&
          validatedSuggestion.target_index !== undefined
        ) {
          // Array section: replace element at target_index
          const currentData = ((sectionData?.data || []) as unknown[]) || [];
          const newData = [...currentData];
          newData[validatedSuggestion.target_index] =
            validatedSuggestion.applied_content;
          // We expect updatedData to be a Record for upsert, but this is an array -> wrap in an object (e.g., { items: [...] }) or assign to a more appropriate type.
          // Here, we wrap the array under a key "items" to ensure type correctness.
          updatedData = { items: newData };
        } else {
          // Make sure section content is an object
          if (
            typeof validatedSuggestion.applied_content === "object" &&
            validatedSuggestion.applied_content !== null &&
            !Array.isArray(validatedSuggestion.applied_content)
          ) {
            updatedData = validatedSuggestion.applied_content as Record<
              string,
              unknown
            >;
          } else {
            // If it's an array or primitive, wrap it similarly
            updatedData = { content: validatedSuggestion.applied_content };
          }
        }

        const sectionToUpsert: CVSectionInsert = {
          cv_id: cvId,
          section_type: validatedSuggestion.target_section as CVSectionType,
          data: updatedData,
          order_index: getSectionOrder(
            validatedSuggestion.target_section as CVSectionType
          ),
        };

        // Update cv_sections
        const upsertQuery = await supabase
          .from("cv_sections")
          // @ts-expect-error - Supabase createServerClient types not fully inferred from Database generic
          .upsert(sectionToUpsert, {
            onConflict: "cv_id,section_type",
          });

        const { error: updateError } = await upsertQuery;

        if (updateError) {
          console.error(
            `Error updating section ${suggestion.target_section}:`,
            updateError
          );
          failedSuggestions.push(suggestion.suggestion_id);
          continue;
        }

        // Mark suggestion as applied
        const updateData: ATSuggestionUpdate = {
          is_applied: true,
          applied_at: new Date().toISOString(),
        };
        const { error: markError } = await supabase
          .from("ats_suggestions")
          // @ts-expect-error - Supabase createServerClient types not fully inferred from Database generic
          .update(updateData)
          .eq("suggestion_id", suggestion.suggestion_id);

        if (markError) {
          console.error(
            `Error marking suggestion ${suggestion.suggestion_id} as applied:`,
            markError
          );
          // Don't fail, suggestion is already applied
        }

        appliedSuggestions.push(suggestion.suggestion_id);
      } catch (error) {
        console.error(
          `Error applying suggestion ${suggestion.suggestion_id}:`,
          error
        );
        failedSuggestions.push(suggestion.suggestion_id);
      }
    }

    return NextResponse.json({
      success: true,
      appliedCount: appliedSuggestions.length,
      appliedSuggestions,
      failedCount: failedSuggestions.length,
      failedSuggestions,
    });
  } catch (error) {
    console.error("Error in apply-all-suggestions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getSectionOrder(sectionType: CVSectionType): number {
  const orderMap: Record<CVSectionType, number> = {
    personal_info: 0,
    summary: 1,
    experience: 2,
    education: 3,
    projects: 4,
    skills: 5,
    certifications: 6,
    ats_analysis: 99,
  };
  return orderMap[sectionType] || 99;
}
