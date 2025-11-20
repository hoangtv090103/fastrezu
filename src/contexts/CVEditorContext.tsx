"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import { createClient } from "@/lib/supabase-client";
import { apiPut } from "@/lib/api-client";

// Types
export type CVLanguage = "vi" | "en";

export interface CVData {
  id: string;
  title: string;
  ats_score: number;
  language: CVLanguage;
  sections: {
    [key: string]: Record<string, unknown> | Record<string, unknown>[];
  };
  jd_analysis?: {
    keywords: string[];
    analysis: Record<string, unknown>;
    mode?: "real" | "shadow";
  };
  ats_analysis?: {
    keyword_match: number;
    formatting: number;
    completeness: number;
    relevance: number;
    matched_keywords: string[];
    missing_keywords: string[];
    suggestions: string[];
  };
}

export interface CVEditorState {
  currentStep: number;
  cvData: CVData | null;
  isLoading: boolean;
  isSaving: boolean;
  saveStatus: "saved" | "saving" | "error";
  error: string | null;
  selectedLanguage: CVLanguage | null;
  isDirty: boolean;
}

type CVEditorAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_CV_DATA"; payload: CVData }
  | {
      type: "UPDATE_SECTION";
      payload: {
        sectionType: string;
        data: Record<string, unknown> | Record<string, unknown>[];
      };
    }
  | { type: "SET_CURRENT_STEP"; payload: number }
  | { type: "SET_SAVE_STATUS"; payload: "saved" | "saving" | "error" }
  | { type: "SET_ERROR"; payload: string | null }
  | {
      type: "SET_JD_ANALYSIS";
      payload: {
        keywords: string[];
        analysis: Record<string, unknown>;
        mode?: "real" | "shadow";
      };
    }
  | { type: "SET_LANGUAGE"; payload: CVLanguage }
  | { type: "UPDATE_CV_DATA"; payload: CVData }
  | { type: "UPDATE_TITLE"; payload: string };

const initialState: CVEditorState = {
  currentStep: 0,
  cvData: null,
  isLoading: true,
  isSaving: false,
  saveStatus: "saved",
  error: null,
  selectedLanguage: null,
  isDirty: false,
};

function cvEditorReducer(
  state: CVEditorState,
  action: CVEditorAction
): CVEditorState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_CV_DATA":
      return {
        ...state,
        cvData: action.payload,
        isLoading: false,
        isDirty: false,
      };
    case "UPDATE_SECTION":
      if (!state.cvData) return state;
      return {
        ...state,
        cvData: {
          ...state.cvData,
          sections: {
            ...state.cvData.sections,
            [action.payload.sectionType]: action.payload.data,
          },
        },
        isDirty: true,
      };
    case "SET_CURRENT_STEP":
      return { ...state, currentStep: action.payload };
    case "SET_SAVE_STATUS":
      return {
        ...state,
        saveStatus: action.payload,
        isSaving: action.payload === "saving",
        // Nếu đã lưu thành công, reset dirty về false
        isDirty: action.payload === "saved" ? false : state.isDirty,
      };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_JD_ANALYSIS":
      if (!state.cvData) return state;
      return {
        ...state,
        cvData: {
          ...state.cvData,
          jd_analysis: action.payload,
        },
        isDirty: true,
      };
    case "SET_LANGUAGE":
      return { ...state, selectedLanguage: action.payload, isDirty: true };
    case "UPDATE_CV_DATA":
      return { ...state, cvData: action.payload, isDirty: true };
    case "UPDATE_TITLE":
      if (!state.cvData) return state;
      return {
        ...state,
        cvData: {
          ...state.cvData,
          title: action.payload,
        },
        isDirty: true,
      };
    default:
      return state;
  }
}

interface CVEditorContextType {
  state: CVEditorState;
  updateSection: (
    sectionType: string,
    data: Record<string, unknown> | Record<string, unknown>[]
  ) => void;
  setCurrentStep: (step: number) => void;
  setJDAnalysis: (
    keywords: string[],
    analysis: Record<string, unknown>,
    mode?: "real" | "shadow"
  ) => void;
  setLanguage: (language: CVLanguage) => void;
  updateCVData: (cvData: CVData) => void;
  updateTitle: (title: string) => void;
  saveCV: () => Promise<void>;
  saveNow: () => Promise<void>;
}

const CVEditorContext = createContext<CVEditorContextType | undefined>(
  undefined
);

export function CVEditorProvider({
  children,
  cvId,
  userId,
}: {
  children: React.ReactNode;
  cvId: string;
  userId?: string;
}) {
  const [state, dispatch] = useReducer(cvEditorReducer, initialState);
  const supabase = createClient();

  // Ref để giữ timeout ID, giúp clear dễ dàng hơn
  const autoSaveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Load CV data
  useEffect(() => {
    let mounted = true;

    const loadCVData = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });

        // Use userId from server-side if available, otherwise check client-side
        let user;
        if (userId) {
          user = { id: userId };
        } else {
          const {
            data: { user: clientUser },
            error: authError,
          } = await supabase.auth.getUser();
          if (authError) {
            console.error("Auth error:", authError);
            if (mounted) {
              dispatch({ type: "SET_ERROR", payload: "Authentication error" });
            }
            return;
          }
          user = clientUser;
        }

        if (!user) {
          // User not authenticated, redirect will be handled by middleware
          if (mounted) {
            dispatch({ type: "SET_ERROR", payload: "User not authenticated" });
          }
          return;
        }

        // Get CV basic info
        const { data: cv, error: cvError } = await supabase
          .from("cvs")
          .select("*")
          .eq("id", cvId)
          .eq("user_id", user.id) // Ensure user owns this CV
          .maybeSingle();

        if (cvError) {
          console.error("CV query error:", cvError);
          throw new Error(`CV query failed: ${cvError.message}`);
        }

        if (!cv) {
          // Redirect to dashboard if CV not found
          if (typeof window !== "undefined") {
            window.location.href = "/dashboard";
          }
          throw new Error(
            "CV not found or you do not have permission to access it"
          );
        }

        // Get CV sections
        const { data: sections, error: sectionsError } = await supabase
          .from("cv_sections")
          .select("*")
          .eq("cv_id", cvId)
          .order("order_index");

        if (sectionsError) {
          console.error("CV sections query error:", sectionsError);
          throw new Error(
            `Failed to load CV sections: ${sectionsError.message}`
          );
        }

        // Get JD analysis if exists (use maybeSingle to avoid error if no data)
        const { data: jdAnalysis, error: jdError } = await supabase
          .from("jd_analyses")
          .select("*")
          .eq("cv_id", cvId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (jdError) {
          console.error("JD analysis query error:", jdError);
          // Don't throw error for JD analysis, it's optional
        }

        // Transform sections into object
        const sectionsData: { [key: string]: Record<string, unknown> } = {};
        sections?.forEach(
          (section: {
            section_type: string;
            data: Record<string, unknown>;
          }) => {
            sectionsData[section.section_type] = section.data;
          }
        );

        // If no sections exist, create default empty sections
        if (!sections || sections.length === 0) {
          const defaultSections = {
            personal_info: {},
            summary: {},
            experience: [],
            education: [],
            projects: [],
            skills: [],
            certifications: [],
          };

          // Create default sections in database
          for (const [sectionType, data] of Object.entries(defaultSections)) {
            const { error: insertError } = await supabase
              .from("cv_sections")
              .insert({
                cv_id: cvId,
                section_type: sectionType,
                data: data,
                order_index: getSectionOrder(sectionType),
              });

            if (insertError) {
              console.error(
                `Error creating default section ${sectionType}:`,
                insertError
              );
            }
          }

          // Use default sections
          Object.assign(sectionsData, defaultSections);
        }

        const cvData: CVData = {
          id: cv.id,
          title: cv.title,
          ats_score: cv.ats_score,
          language: (cv.language as CVLanguage) || "vi", // Default to Vietnamese for existing CVs
          sections: sectionsData,
          jd_analysis: jdAnalysis
            ? {
                keywords: jdAnalysis.keywords_extracted,
                analysis: jdAnalysis.analysis_result,
                mode: jdAnalysis.mode as "real" | "shadow",
              }
            : undefined,
          ats_analysis: sectionsData.ats_analysis as CVData["ats_analysis"],
        };

        if (mounted) {
          dispatch({ type: "SET_CV_DATA", payload: cvData });
          // Set the language in state as well
          dispatch({ type: "SET_LANGUAGE", payload: cvData.language });
        }
      } catch (error) {
        console.error("Error loading CV data:", error);
        if (mounted) {
          dispatch({ type: "SET_ERROR", payload: "Failed to load CV data" });
        }
      }
    };

    loadCVData();

    return () => {
      mounted = false;
    };
  }, [cvId, supabase, userId]);

  // Auto-save functionality
  const saveCV = useCallback(async () => {
    if (!state.cvData) return;

    try {
      dispatch({ type: "SET_SAVE_STATUS", payload: "saving" });

      // Check authentication first
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) {
        console.error("Authentication error during save:", authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Update CV basic info
      const { error: cvError } = await supabase
        .from("cvs")
        .update({
          title: state.cvData.title,
          ats_score: state.cvData.ats_score,
          language: state.cvData.language,
          updated_at: new Date().toISOString(),
        })
        .eq("id", cvId)
        .eq("user_id", user.id); // Ensure user owns this CV

      if (cvError) {
        console.error("CV update error:", cvError);
        throw new Error(`Failed to update CV: ${cvError.message}`);
      }

      // Update sections
      for (const [sectionType, data] of Object.entries(state.cvData.sections)) {
        const { error: sectionError } = await supabase
          .from("cv_sections")
          .upsert(
            {
              cv_id: cvId,
              section_type: sectionType,
              data: data,
              order_index: getSectionOrder(sectionType),
            },
            {
              onConflict: "cv_id,section_type",
            }
          );

        if (sectionError) {
          console.error(`Section ${sectionType} update error:`, sectionError);
          throw new Error(
            `Failed to update section ${sectionType}: ${sectionError.message}`
          );
        }
      }

      // Save ATS analysis if it exists
      if (state.cvData.ats_analysis) {
        const { error: atsError } = await supabase.from("cv_sections").upsert(
          {
            cv_id: cvId,
            section_type: "ats_analysis",
            data: state.cvData.ats_analysis,
            order_index: getSectionOrder("ats_analysis"),
          },
          {
            onConflict: "cv_id,section_type",
          }
        );

        if (atsError) {
          console.error("ATS analysis update error:", atsError);
          throw new Error(`Failed to update ATS analysis: ${atsError.message}`);
        }
      }

      dispatch({ type: "SET_SAVE_STATUS", payload: "saved" });
    } catch (error) {
      console.error("Error saving CV:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        error: error,
      });
      dispatch({ type: "SET_SAVE_STATUS", payload: "error" });
    }
  }, [state.cvData, cvId, supabase]);

  // Auto-save with debouncing
  useEffect(() => {
    // Chỉ kích hoạt auto-save nếu dirty và không đang loading
    if (!state.isDirty || state.isLoading || !state.cvData) return;

    // Clear timeout cũ nếu có (debounce)
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set timeout mới - đợi 2s sau lần thay đổi cuối cùng
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveCV();
    }, 2000);

    // Cleanup khi unmount hoặc dependency đổi
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [state.cvData, state.isDirty, state.isLoading, saveCV]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.isSaving || state.isDirty) {
        // Kích hoạt cảnh báo của trình duyệt
        e.preventDefault();
        e.returnValue = ""; // Chrome yêu cầu cái này
      }
    };

    // Chỉ gắn event listener nếu cần thiết
    if (state.isSaving || state.isDirty) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [state.isSaving, state.isDirty]);

  const updateSection = (
    sectionType: string,
    data: Record<string, unknown> | Record<string, unknown>[]
  ) => {
    dispatch({ type: "UPDATE_SECTION", payload: { sectionType, data } });
  };

  const setCurrentStep = (step: number) => {
    dispatch({ type: "SET_CURRENT_STEP", payload: step });
  };

  const setJDAnalysis = (
    keywords: string[],
    analysis: Record<string, unknown>,
    mode: "real" | "shadow" = "real"
  ) => {
    dispatch({
      type: "SET_JD_ANALYSIS",
      payload: { keywords, analysis, mode },
    });
  };

  const setLanguage = (language: CVLanguage) => {
    dispatch({ type: "SET_LANGUAGE", payload: language });
    // Also update the CV data if it exists
    if (state.cvData) {
      const updatedCVData = { ...state.cvData, language };
      dispatch({ type: "SET_CV_DATA", payload: updatedCVData });
    }
  };

  const updateCVData = (cvData: CVData) => {
    dispatch({ type: "UPDATE_CV_DATA", payload: cvData });
  };

  const updateTitle = useCallback(
    async (title: string) => {
      if (!state.cvData || !cvId) return;

      try {
        dispatch({ type: "UPDATE_TITLE", payload: title });

        // Check authentication
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
          throw new Error("User not authenticated");
        }

        // Update CV title via API
        const { cv: updatedCv } = await apiPut<{
          cv: { title: string; ats_score: number };
        }>(`/api/cv/${cvId}/update`, { title: title.trim() }, undefined, "vi");

        // Update the full CV data in state
        if (state.cvData) {
          const updatedCVData = {
            ...state.cvData,
            title: updatedCv.title,
            ats_score: updatedCv.ats_score,
          };
          dispatch({ type: "SET_CV_DATA", payload: updatedCVData });
        }
      } catch (error) {
        console.error("Error updating CV title:", error);

        // Revert the optimistic update on error
        if (state.cvData) {
          dispatch({ type: "SET_CV_DATA", payload: state.cvData });
        }

        // You might want to show a toast notification here
        throw error;
      }
    },
    [state.cvData, cvId, supabase]
  );

  // Hàm lưu ngay lập tức mà không đợi debounce
  const saveNow = useCallback(async () => {
    // Nếu có timeout đang chờ, clear nó đi để tránh lưu 2 lần
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
    // Gọi lưu ngay lập tức
    return await saveCV();
  }, [saveCV]);

  return (
    <CVEditorContext.Provider
      value={{
        state,
        updateSection,
        setCurrentStep,
        setJDAnalysis,
        setLanguage,
        updateCVData,
        updateTitle,
        saveCV,
        saveNow,
      }}
    >
      {children}
    </CVEditorContext.Provider>
  );
}

export function useCVEditor() {
  const context = useContext(CVEditorContext);
  if (context === undefined) {
    throw new Error("useCVEditor must be used within a CVEditorProvider");
  }
  return context;
}

// Helper function to get section order
function getSectionOrder(sectionType: string): number {
  const orderMap: { [key: string]: number } = {
    personal_info: 0,
    summary: 1,
    experience: 2,
    education: 3,
    projects: 4,
    skills: 5,
    certifications: 6,
    ats_analysis: 7,
  };
  return orderMap[sectionType] || 0;
}
