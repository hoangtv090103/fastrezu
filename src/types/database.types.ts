export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ats_suggestions: {
        Row: {
          applied_at: string | null
          created_at: string | null
          cv_id: string
          id: string
          is_active: boolean
          is_applied: boolean
          keyword: string | null
          original_content: Json | null
          priority: string | null
          suggested_content: Json | null
          suggestion_id: string
          suggestion_text: string
          suggestion_type: string
          target_index: number | null
          target_section: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string | null
          cv_id: string
          id?: string
          is_active?: boolean
          is_applied?: boolean
          keyword?: string | null
          original_content?: Json | null
          priority?: string | null
          suggested_content?: Json | null
          suggestion_id: string
          suggestion_text: string
          suggestion_type: string
          target_index?: number | null
          target_section: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string | null
          cv_id?: string
          id?: string
          is_active?: boolean
          is_applied?: boolean
          keyword?: string | null
          original_content?: Json | null
          priority?: string | null
          suggested_content?: Json | null
          suggestion_id?: string
          suggestion_text?: string
          suggestion_type?: string
          target_index?: number | null
          target_section?: string
        }
        Relationships: [
          {
            foreignKeyName: "ats_suggestions_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: false
            referencedRelation: "cvs"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_sections: {
        Row: {
          created_at: string | null
          cv_id: string
          data: Json
          id: string
          order_index: number
          section_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cv_id: string
          data?: Json
          id?: string
          order_index?: number
          section_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cv_id?: string
          data?: Json
          id?: string
          order_index?: number
          section_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cv_sections_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: false
            referencedRelation: "cvs"
            referencedColumns: ["id"]
          },
        ]
      }
      cvs: {
        Row: {
          ats_score: number | null
          created_at: string | null
          font_family: string | null
          id: string
          is_active: boolean | null
          language: string | null
          primary_color: string | null
          template_id: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ats_score?: number | null
          created_at?: string | null
          font_family?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          primary_color?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ats_score?: number | null
          created_at?: string | null
          font_family?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          primary_color?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cvs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string | null
          feedback_type: string
          id: string
          message: string
          metadata: Json | null
          priority: string | null
          status: string | null
          subject: string
          updated_at: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          feedback_type: string
          id?: string
          message: string
          metadata?: Json | null
          priority?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          feedback_type?: string
          id?: string
          message?: string
          metadata?: Json | null
          priority?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      feedback_attachments: {
        Row: {
          created_at: string | null
          feedback_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          original_name: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          feedback_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          original_name: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          feedback_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          original_name?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_attachments_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      jd_analyses: {
        Row: {
          analysis_result: Json | null
          created_at: string | null
          cv_id: string
          id: string
          jd_text: string
          keywords_extracted: string[] | null
          mode: string | null
          shadow_job_title: string | null
          shadow_level: string | null
        }
        Insert: {
          analysis_result?: Json | null
          created_at?: string | null
          cv_id: string
          id?: string
          jd_text: string
          keywords_extracted?: string[] | null
          mode?: string | null
          shadow_job_title?: string | null
          shadow_level?: string | null
        }
        Update: {
          analysis_result?: Json | null
          created_at?: string | null
          cv_id?: string
          id?: string
          jd_text?: string
          keywords_extracted?: string[] | null
          mode?: string | null
          shadow_job_title?: string | null
          shadow_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jd_analyses_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: false
            referencedRelation: "cvs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_analyses: {
        Row: {
          created_at: string | null
          gap_analysis: string | null
          id: string
          job_id: string
          keywords_required: string[] | null
          match_score: number | null
        }
        Insert: {
          created_at?: string | null
          gap_analysis?: string | null
          id?: string
          job_id: string
          keywords_required?: string[] | null
          match_score?: number | null
        }
        Update: {
          created_at?: string | null
          gap_analysis?: string | null
          id?: string
          job_id?: string
          keywords_required?: string[] | null
          match_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_analyses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          company_name: string
          created_at: string | null
          id: string
          job_url: string | null
          raw_jd_text: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string | null
          id?: string
          job_url?: string | null
          raw_jd_text?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string | null
          id?: string
          job_url?: string | null
          raw_jd_text?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      master_profiles: {
        Row: {
          content: Json | null
          created_at: string | null
          id: string
          section_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          id?: string
          section_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          id?: string
          section_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          credits: number | null
          email: string
          full_name: string | null
          id: string
          subscription_tier: string | null
        }
        Insert: {
          created_at?: string | null
          credits?: number | null
          email: string
          full_name?: string | null
          id: string
          subscription_tier?: string | null
        }
        Update: {
          created_at?: string | null
          credits?: number | null
          email?: string
          full_name?: string | null
          id?: string
          subscription_tier?: string | null
        }
        Relationships: []
      }
      resumes: {
        Row: {
          ats_score_final: number | null
          content_snapshot: Json | null
          created_at: string | null
          id: string
          job_id: string
        }
        Insert: {
          ats_score_final?: number | null
          content_snapshot?: Json | null
          created_at?: string | null
          id?: string
          job_id: string
        }
        Update: {
          ats_score_final?: number | null
          content_snapshot?: Json | null
          created_at?: string | null
          id?: string
          job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_scan_history: {
        Row: {
          id: string
          user_id: string
          file_name: string
          file_storage_path: string | null
          overall_score: number | null
          ats_score: number | null
          design_score: number | null
          evaluation: Json
          extracted_profile: Json
          scanned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_name: string
          file_storage_path?: string | null
          overall_score?: number | null
          ats_score?: number | null
          design_score?: number | null
          evaluation: Json
          extracted_profile: Json
          scanned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_name?: string
          file_storage_path?: string | null
          overall_score?: number | null
          ats_score?: number | null
          design_score?: number | null
          evaluation?: Json
          extracted_profile?: Json
          scanned_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cv_scan_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_settings: {
        Row: {
          created_at: string | null
          enabled_sections: Json | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enabled_sections?: Json | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enabled_sections?: Json | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
