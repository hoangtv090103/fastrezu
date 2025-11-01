export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          subscription_tier: "beta_free" | "premium" | "enterprise";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          subscription_tier?: "beta_free" | "premium" | "enterprise";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          subscription_tier?: "beta_free" | "premium" | "enterprise";
          created_at?: string;
          updated_at?: string;
        };
      };
      cvs: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          is_active: boolean;
          ats_score: number;
          language: "vi" | "en";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          is_active?: boolean;
          ats_score?: number;
          language?: "vi" | "en";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          is_active?: boolean;
          ats_score?: number;
          language?: "vi" | "en";
          created_at?: string;
          updated_at?: string;
        };
      };
      cv_sections: {
        Row: {
          id: string;
          cv_id: string;
          section_type:
            | "personal_info"
            | "summary"
            | "experience"
            | "education"
            | "projects"
            | "skills"
            | "certifications"
            | "ats_analysis";
          order_index: number;
          data: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cv_id: string;
          section_type:
            | "personal_info"
            | "summary"
            | "experience"
            | "education"
            | "projects"
            | "skills"
            | "certifications"
            | "ats_analysis";
          order_index?: number;
          data?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cv_id?: string;
          section_type?:
            | "personal_info"
            | "summary"
            | "experience"
            | "education"
            | "projects"
            | "skills"
            | "certifications";
          order_index?: number;
          data?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
      };
      jd_analyses: {
        Row: {
          id: string;
          cv_id: string;
          jd_text: string;
          keywords_extracted: string[];
          analysis_result: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          cv_id: string;
          jd_text: string;
          keywords_extracted?: string[];
          analysis_result?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          cv_id?: string;
          jd_text?: string;
          keywords_extracted?: string[];
          analysis_result?: Record<string, unknown>;
          created_at?: string;
        };
      };
      subscribers: {
        Row: {
          id: string;
          email: string;
          status: "pending" | "confirmed" | "unsubscribed";
          created_at: string;
          updated_at: string;
          source: string;
          metadata: Record<string, unknown>;
        };
        Insert: {
          id?: string;
          email: string;
          status?: "pending" | "confirmed" | "unsubscribed";
          created_at?: string;
          updated_at?: string;
          source?: string;
          metadata?: Record<string, unknown>;
        };
        Update: {
          id?: string;
          email?: string;
          status?: "pending" | "confirmed" | "unsubscribed";
          created_at?: string;
          updated_at?: string;
          source?: string;
          metadata?: Record<string, unknown>;
        };
      };
      feedback: {
        Row: {
          id: string;
          user_id: string | null;
          user_email: string | null;
          feedback_type:
            | "bug_report"
            | "feature_request"
            | "general_feedback"
            | "praise";
          subject: string;
          message: string;
          priority: "low" | "medium" | "high" | "critical";
          status: "open" | "in_progress" | "resolved" | "closed";
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          user_email?: string | null;
          feedback_type:
            | "bug_report"
            | "feature_request"
            | "general_feedback"
            | "praise";
          subject: string;
          message: string;
          priority?: "low" | "medium" | "high" | "critical";
          status?: "open" | "in_progress" | "resolved" | "closed";
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          user_email?: string | null;
          feedback_type?:
            | "bug_report"
            | "feature_request"
            | "general_feedback"
            | "praise";
          subject?: string;
          message?: string;
          priority?: "low" | "medium" | "high" | "critical";
          status?: "open" | "in_progress" | "resolved" | "closed";
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
      };
      feedback_attachments: {
        Row: {
          id: string;
          feedback_id: string;
          file_name: string;
          file_path: string;
          file_size: number;
          file_type: string;
          original_name: string;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          feedback_id: string;
          file_name: string;
          file_path: string;
          file_size: number;
          file_type: string;
          original_name: string;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          feedback_id?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number;
          file_type?: string;
          original_name?: string;
          uploaded_by?: string | null;
          created_at?: string;
        };
      };
      ats_suggestions: {
        Row: {
          id: string;
          cv_id: string;
          suggestion_id: string;
          suggestion_text: string;
          suggestion_type: string;
          target_section: string;
          target_index: number | null;
          keyword: string | null;
          priority: string;
          original_content: unknown;
          suggested_content: unknown;
          is_active: boolean;
          is_applied: boolean;
          created_at: string;
          applied_at: string | null;
        };
        Insert: {
          id?: string;
          cv_id: string;
          suggestion_id: string;
          suggestion_text: string;
          suggestion_type: string;
          target_section: string;
          target_index?: number | null;
          keyword?: string | null;
          priority?: string;
          original_content?: unknown;
          suggested_content?: unknown;
          is_active?: boolean;
          is_applied?: boolean;
          created_at?: string;
          applied_at?: string | null;
        };
        Update: {
          id?: string;
          cv_id?: string;
          suggestion_id?: string;
          suggestion_text?: string;
          suggestion_type?: string;
          target_section?: string;
          target_index?: number | null;
          keyword?: string | null;
          priority?: string;
          original_content?: unknown;
          suggested_content?: unknown;
          is_active?: boolean;
          is_applied?: boolean;
          created_at?: string;
          applied_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};
