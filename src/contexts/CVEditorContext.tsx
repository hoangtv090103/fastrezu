"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';

// Types
export interface CVData {
  id: string;
  title: string;
  ats_score: number;
  sections: {
    [key: string]: Record<string, unknown> | Record<string, unknown>[];
  };
  jd_analysis?: {
    keywords: string[];
    analysis: Record<string, unknown>;
  };
}

export interface CVEditorState {
  currentStep: number;
  cvData: CVData | null;
  isLoading: boolean;
  isSaving: boolean;
  saveStatus: 'saved' | 'saving' | 'error';
  error: string | null;
}

type CVEditorAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CV_DATA'; payload: CVData }
  | { type: 'UPDATE_SECTION'; payload: { sectionType: string; data: Record<string, unknown> | Record<string, unknown>[] } }
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'SET_SAVE_STATUS'; payload: 'saved' | 'saving' | 'error' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_JD_ANALYSIS'; payload: { keywords: string[]; analysis: Record<string, unknown> } };

const initialState: CVEditorState = {
  currentStep: 0,
  cvData: null,
  isLoading: true,
  isSaving: false,
  saveStatus: 'saved',
  error: null,
};

function cvEditorReducer(state: CVEditorState, action: CVEditorAction): CVEditorState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_CV_DATA':
      return { ...state, cvData: action.payload, isLoading: false };
    case 'UPDATE_SECTION':
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
      };
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_SAVE_STATUS':
      return { ...state, saveStatus: action.payload, isSaving: action.payload === 'saving' };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_JD_ANALYSIS':
      if (!state.cvData) return state;
      return {
        ...state,
        cvData: {
          ...state.cvData,
          jd_analysis: action.payload,
        },
      };
    default:
      return state;
  }
}

interface CVEditorContextType {
  state: CVEditorState;
  updateSection: (sectionType: string, data: Record<string, unknown> | Record<string, unknown>[]) => void;
  setCurrentStep: (step: number) => void;
  setJDAnalysis: (keywords: string[], analysis: Record<string, unknown>) => void;
  saveCV: () => Promise<void>;
}

const CVEditorContext = createContext<CVEditorContextType | undefined>(undefined);

export function CVEditorProvider({ 
  children, 
  cvId 
}: { 
  children: React.ReactNode;
  cvId: string;
}) {
  const [state, dispatch] = useReducer(cvEditorReducer, initialState);
  const supabase = createClient();

  // Load CV data
  useEffect(() => {
    const loadCVData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Get CV basic info
        const { data: cv, error: cvError } = await supabase
          .from('cvs')
          .select('*')
          .eq('id', cvId)
          .single();

        if (cvError) throw cvError;

        // Get CV sections
        const { data: sections, error: sectionsError } = await supabase
          .from('cv_sections')
          .select('*')
          .eq('cv_id', cvId)
          .order('order_index');

        if (sectionsError) throw sectionsError;

        // Get JD analysis if exists
        const { data: jdAnalysis } = await supabase
          .from('jd_analyses')
          .select('*')
          .eq('cv_id', cvId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Transform sections into object
        const sectionsData: { [key: string]: Record<string, unknown> } = {};
        sections?.forEach(section => {
          sectionsData[section.section_type] = section.data;
        });

        const cvData: CVData = {
          id: cv.id,
          title: cv.title,
          ats_score: cv.ats_score,
          sections: sectionsData,
          jd_analysis: jdAnalysis ? {
            keywords: jdAnalysis.keywords_extracted,
            analysis: jdAnalysis.analysis_result,
          } : undefined,
        };

        dispatch({ type: 'SET_CV_DATA', payload: cvData });
      } catch (error) {
        console.error('Error loading CV data:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load CV data' });
      }
    };

    loadCVData();
  }, [cvId, supabase]);

  // Auto-save functionality
  const saveCV = useCallback(async () => {
    if (!state.cvData) return;

    try {
      dispatch({ type: 'SET_SAVE_STATUS', payload: 'saving' });

      // Update CV basic info
      const { error: cvError } = await supabase
        .from('cvs')
        .update({
          title: state.cvData.title,
          ats_score: state.cvData.ats_score,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cvId);

      if (cvError) throw cvError;

      // Update sections
      for (const [sectionType, data] of Object.entries(state.cvData.sections)) {
        const { error: sectionError } = await supabase
          .from('cv_sections')
          .upsert({
            cv_id: cvId,
            section_type: sectionType,
            data: data,
            order_index: getSectionOrder(sectionType),
          });

        if (sectionError) throw sectionError;
      }

      dispatch({ type: 'SET_SAVE_STATUS', payload: 'saved' });
    } catch (error) {
      console.error('Error saving CV:', error);
      dispatch({ type: 'SET_SAVE_STATUS', payload: 'error' });
    }
  }, [state.cvData, cvId, supabase]);

  // Auto-save with debouncing
  useEffect(() => {
    if (!state.cvData || state.isLoading) return;

    const timeoutId = setTimeout(() => {
      saveCV();
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }, [state.cvData, saveCV, state.isLoading]);

  const updateSection = (sectionType: string, data: Record<string, unknown> | Record<string, unknown>[]) => {
    dispatch({ type: 'UPDATE_SECTION', payload: { sectionType, data } });
  };

  const setCurrentStep = (step: number) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: step });
  };

  const setJDAnalysis = (keywords: string[], analysis: Record<string, unknown>) => {
    dispatch({ type: 'SET_JD_ANALYSIS', payload: { keywords, analysis } });
  };

  return (
    <CVEditorContext.Provider
      value={{
        state,
        updateSection,
        setCurrentStep,
        setJDAnalysis,
        saveCV,
      }}
    >
      {children}
    </CVEditorContext.Provider>
  );
}

export function useCVEditor() {
  const context = useContext(CVEditorContext);
  if (context === undefined) {
    throw new Error('useCVEditor must be used within a CVEditorProvider');
  }
  return context;
}

// Helper function to get section order
function getSectionOrder(sectionType: string): number {
  const orderMap: { [key: string]: number } = {
    'personal_info': 0,
    'summary': 1,
    'experience': 2,
    'education': 3,
    'projects': 4,
    'skills': 5,
    'certifications': 6,
  };
  return orderMap[sectionType] || 0;
}
