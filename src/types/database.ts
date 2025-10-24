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
          id: string;
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
            | "certifications";
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
            | "certifications";
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
