import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import {
  type CVSectionType,
  type CVSectionInsert,
  type ATSuggestionUpdate,
} from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { cvId, suggestionId } = await request.json();

    if (!cvId || !suggestionId) {
      return NextResponse.json(
        { error: "cvId and suggestionId are required" },
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify CV ownership
    const { data: cv, error: cvError } = await supabase
      .from("cvs")
      .select("id, user_id")
      .eq("id", cvId)
      .single();

    if (cvError || !cv) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    const cvData = cv as { user_id: string };
    if (cvData.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get suggestion
    const { data: suggestion, error: suggestionError } = await supabase
      .from("ats_suggestions")
      .select("*")
      .eq("cv_id", cvId)
      .eq("suggestion_id", suggestionId)
      .eq("is_active", true)
      .single();

    if (suggestionError) {
      console.error("Error fetching suggestion:", suggestionError);
      console.error("Query params:", { cvId, suggestionId });

      // Check if suggestion exists but is not active
      const { data: inactiveSuggestion } = await supabase
        .from("ats_suggestions")
        .select("*")
        .eq("cv_id", cvId)
        .eq("suggestion_id", suggestionId)
        .single();

      if (inactiveSuggestion) {
        const inactive = inactiveSuggestion as {
          is_active: boolean;
          is_applied: boolean;
        };
        return NextResponse.json(
          {
            error: `Suggestion is not active (is_active: ${inactive.is_active}, is_applied: ${inactive.is_applied})`,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Suggestion not found or not active" },
        { status: 404 }
      );
    }

    if (!suggestion || typeof suggestion !== "object") {
      return NextResponse.json(
        { error: "Suggestion not found" },
        { status: 404 }
      );
    }

    const suggestionData = suggestion as {
      id: string;
      suggestion_id: string;
      target_section: string;
      target_index: number | null;
      is_applied: boolean;
      suggested_content: unknown;
      [key: string]: unknown;
    };

    if (suggestionData.is_applied) {
      return NextResponse.json(
        { error: "Suggestion already applied" },
        { status: 400 }
      );
    }

    // Normalize target_section function
    const normalizeTargetSection = (section: string): CVSectionType | null => {
      // Convert camelCase to snake_case
      const normalized = section
        .replace(/([A-Z])/g, "_$1")
        .toLowerCase()
        .replace(/^_/, ""); // Remove leading underscore

        const allowedSections = new Set([
          "personal_info",
          "summary",
          "experience",
          "education",
          "projects",
          "skills",
          "certifications",
          "ats_analysis",
        ] as const satisfies readonly CVSectionType[]);

        // Type guard: if it's in the set, it's a valid CVSectionType
      if (allowedSections.has(normalized as CVSectionType))
        return normalized as CVSectionType;
      if (allowedSections.has(section as CVSectionType))
        return section as CVSectionType;

      return null;
    };

    // Normalize and validate target_section
    const normalizedSection = normalizeTargetSection(
      suggestionData.target_section
    );
    if (!normalizedSection) {
      console.error("Invalid target_section:", suggestionData.target_section);
      return NextResponse.json(
        {
          error: `Invalid target_section: ${suggestionData.target_section}`,
        },
        { status: 400 }
      );
    }

    // Update suggestion with normalized section
    const validatedSuggestion = {
      ...suggestionData,
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
      console.error("Error fetching section:", sectionError);
      return NextResponse.json(
        { error: "Failed to fetch section" },
        { status: 500 }
      );
    }

    const sectionData = section as { data: unknown } | null;

    // Apply suggestion
    let updatedData: unknown;

    if (
      validatedSuggestion.target_index !== null &&
      validatedSuggestion.target_index !== undefined
    ) {
      // Array section: replace element at target_index
      const currentData = (sectionData?.data as unknown[]) || [];
      const newData = [...currentData];
      newData[validatedSuggestion.target_index] =
        validatedSuggestion.suggested_content;
      updatedData = newData;
    } else {
      // Replace entire section
      updatedData = validatedSuggestion.suggested_content;
    }

    console.log("Updating section:", {
      cv_id: cvId,
      section_type: validatedSuggestion.target_section,
      target_index: validatedSuggestion.target_index,
      hasSection: !!sectionData,
    });

    // Update cv_sections
    const sectionToUpsert: CVSectionInsert = {
      cv_id: cvId,
      section_type: validatedSuggestion.target_section,
      data: updatedData as Record<string, unknown>,
      order_index: getSectionOrder(validatedSuggestion.target_section),
    };
    const { error: updateError } = await supabase.from("cv_sections")
      // @ts-expect-error - Supabase createServerClient types not fully inferred from Database generic
      .upsert(sectionToUpsert, {
        onConflict: "cv_id,section_type",
      });

    if (updateError) {
      console.error("Error updating section:", updateError);
      return NextResponse.json(
        { error: "Failed to update section" },
        { status: 500 }
      );
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
      .eq("id", suggestionData.id);

    if (markError) {
      console.error("Error marking suggestion as applied:", markError);
      // Don't fail the request, suggestion is already applied
    }

    return NextResponse.json({
      success: true,
      updatedSection: {
        section_type: validatedSuggestion.target_section,
        data: updatedData,
      },
    });
  } catch (error) {
    console.error("Error in apply-suggestion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getSectionOrder(sectionType: string): number {
  const orderMap: Record<string, number> = {
    personal_info: 0,
    summary: 1,
    experience: 2,
    education: 3,
    projects: 4,
    skills: 5,
    certifications: 6,
  };
  return orderMap[sectionType] || 99;
}
