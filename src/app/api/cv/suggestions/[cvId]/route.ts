import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { cvIdSchema, validateSchema } from "@/lib/validation-schemas";
import { 
  type CVMinimalResponse, 
  type ATSuggestionsResponse 
} from "@/lib/supabase-schemas";
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

    // Parallelize CV verification and suggestions fetching
    // We start both queries at the same time
    const cvPromise = supabase
      .from("cvs")
      .select("id, user_id, language")
      .eq("id", cvId)
      .single();

    const suggestionsPromise = supabase
      .from("ats_suggestions")
      .select(
        "id, suggestion_id, suggestion_text, suggestion_type, target_section, target_index, priority, is_active, is_applied, created_at"
      )
      .eq("cv_id", cvId)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    const [cvResponse, suggestionsResponse] = await Promise.all([
      cvPromise,
      suggestionsPromise,
    ]) as [CVMinimalResponse, ATSuggestionsResponse];

    const { data: cv, error: cvError } = cvResponse;
    const { data: suggestions, error: suggestionsError } = suggestionsResponse;

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
      .map((suggestion) => {
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
        } as ATSuggestion;
      })
      .filter((s): s is ATSuggestion => s !== null);

    // Process suggestions to handle JSON storage and translation
    const processedSuggestions: ATSuggestion[] = [];
    const suggestionsToTranslate: { index: number; text: string }[] = [];

    for (let i = 0; i < validSuggestions.length; i++) {
      const s = validSuggestions[i];
      let text = s.suggestion_text || "";
      let isJson = false;

      // Try to parse JSON
      try {
        if (text.trim().startsWith("{")) {
          const json = JSON.parse(text);
          if (json && typeof json === "object") {
            isJson = true;
            // If UI language is specified, try to get that language
            // Otherwise fallback to CV language, then 'vi', then first key
            const targetLang = uiLang || cv.language || "vi";
            
            if (json[targetLang]) {
              text = json[targetLang];
            } else if (cv.language && json[cv.language]) {
              text = json[cv.language];
            } else {
              // Fallback to first available value
              const values = Object.values(json);
              if (values.length > 0 && typeof values[0] === "string") {
                text = values[0] as string;
              }
            }
          }
        }
      } catch {
        // Not JSON, continue as string
      }

      // If it was JSON, we have the final text now.
      // If it was NOT JSON (legacy data), we might need to translate it.
      if (isJson) {
        processedSuggestions.push({
          ...s,
          suggestion_text: text,
        });
      } else {
        // Legacy path: check if we need translation
        if (uiLang && uiLang !== cv.language) {
          suggestionsToTranslate.push({ index: i, text });
          // Push placeholder, will update later
          processedSuggestions.push({ ...s });
        } else {
          // No translation needed
          processedSuggestions.push({ ...s });
        }
      }
    }

    // Batch translate legacy items if needed
    if (suggestionsToTranslate.length > 0) {
      try {
        const texts = suggestionsToTranslate.map((item) => item.text);
        const translated = await translateTexts(texts, uiLang as "vi" | "en", "auto");
        
        suggestionsToTranslate.forEach((item, idx) => {
          processedSuggestions[item.index].suggestion_text = translated[idx] || item.text;
        });
      } catch (e) {
        console.error("Failed to translate legacy suggestion_texts:", e);
        // Fallback to original text
        suggestionsToTranslate.forEach((item) => {
          processedSuggestions[item.index].suggestion_text = item.text;
        });
      }
    }

    return NextResponse.json({ suggestions: processedSuggestions });
  } catch (error) {
    console.error("Error in suggestions GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
