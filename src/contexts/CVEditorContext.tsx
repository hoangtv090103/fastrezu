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
  cvId,
  userId 
}: { 
  children: React.ReactNode;
  cvId: string;
  userId?: string;
}) {
  const [state, dispatch] = useReducer(cvEditorReducer, initialState);
  const supabase = createClient();

  // Load CV data
  useEffect(() => {
    let mounted = true;
    
    const loadCVData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Use userId from server-side if available, otherwise check client-side
        let user;
        if (userId) {
          user = { id: userId };
        } else {
          const { data: { user: clientUser }, error: authError } = await supabase.auth.getUser();
          if (authError) {
            console.error('Auth error:', authError);
            if (mounted) {
              dispatch({ type: 'SET_ERROR', payload: 'Authentication error' });
            }
            return;
          }
          user = clientUser;
        }
        
        if (!user) {
          // User not authenticated, redirect will be handled by middleware
          if (mounted) {
            dispatch({ type: 'SET_ERROR', payload: 'User not authenticated' });
          }
          return;
        }
        
        // Get CV basic info
        const { data: cv, error: cvError } = await supabase
          .from('cvs')
          .select('*')
          .eq('id', cvId)
          .eq('user_id', user.id) // Ensure user owns this CV
          .maybeSingle();

        if (cvError) {
          console.error('CV query error:', cvError);
          throw new Error(`CV query failed: ${cvError.message}`);
        }

        if (!cv) {
          // Redirect to dashboard if CV not found
          if (typeof window !== 'undefined') {
            window.location.href = '/dashboard';
          }
          throw new Error('CV not found or you do not have permission to access it');
        }

        // Get CV sections
        const { data: sections, error: sectionsError } = await supabase
          .from('cv_sections')
          .select('*')
          .eq('cv_id', cvId)
          .order('order_index');

        if (sectionsError) {
          console.error('CV sections query error:', sectionsError);
          throw new Error(`Failed to load CV sections: ${sectionsError.message}`);
        }

        // Get JD analysis if exists (use maybeSingle to avoid error if no data)
        const { data: jdAnalysis, error: jdError } = await supabase
          .from('jd_analyses')
          .select('*')
          .eq('cv_id', cvId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (jdError) {
          console.error('JD analysis query error:', jdError);
          // Don't throw error for JD analysis, it's optional
        }

        // Transform sections into object
        const sectionsData: { [key: string]: Record<string, unknown> } = {};
        sections?.forEach((section: { section_type: string; data: Record<string, unknown> }) => {
          sectionsData[section.section_type] = section.data;
        });

        // If no sections exist, create default empty sections
        if (!sections || sections.length === 0) {
          const defaultSections = {
            personal_info: {},
            summary: {},
            experience: [],
            education: [],
            projects: [],
            skills: [],
            certifications: []
          };
          
          // Create default sections in database
          for (const [sectionType, data] of Object.entries(defaultSections)) {
            const { error: insertError } = await supabase
              .from('cv_sections')
              .insert({
                cv_id: cvId,
                section_type: sectionType,
                data: data,
                order_index: getSectionOrder(sectionType),
              });
            
            if (insertError) {
              console.error(`Error creating default section ${sectionType}:`, insertError);
            }
          }
          
          // Use default sections
          Object.assign(sectionsData, defaultSections);
        }

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

        if (mounted) {
          dispatch({ type: 'SET_CV_DATA', payload: cvData });
        }
      } catch (error) {
        console.error('Error loading CV data:', error);
        if (mounted) {
          dispatch({ type: 'SET_ERROR', payload: 'Failed to load CV data' });
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
      dispatch({ type: 'SET_SAVE_STATUS', payload: 'saving' });

      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Authentication error during save:', authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Saving CV with data:', { cvId, title: state.cvData.title, sections: Object.keys(state.cvData.sections) });

      // Update CV basic info
      const { error: cvError } = await supabase
        .from('cvs')
        .update({
          title: state.cvData.title,
          ats_score: state.cvData.ats_score,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cvId)
        .eq('user_id', user.id); // Ensure user owns this CV

      if (cvError) {
        console.error('CV update error:', cvError);
        throw new Error(`Failed to update CV: ${cvError.message}`);
      }

      // Update sections
      for (const [sectionType, data] of Object.entries(state.cvData.sections)) {
        const { error: sectionError } = await supabase
          .from('cv_sections')
          .upsert({
            cv_id: cvId,
            section_type: sectionType,
            data: data,
            order_index: getSectionOrder(sectionType),
          }, {
            onConflict: 'cv_id,section_type'
          });

        if (sectionError) {
          console.error(`Section ${sectionType} update error:`, sectionError);
          throw new Error(`Failed to update section ${sectionType}: ${sectionError.message}`);
        }
      }

      console.log('CV saved successfully');
      dispatch({ type: 'SET_SAVE_STATUS', payload: 'saved' });
    } catch (error) {
      console.error('Error saving CV:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
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
