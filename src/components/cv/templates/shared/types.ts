// ── Template System — Shared Types ───────────────────────────────────────────

export type TemplateId = "classic" | "modern" | "executive" | "creative" | "minimal";
export type ColorTheme = "blue" | "slate" | "emerald" | "rose";

export interface ColorValues {
  primary: string;   // e.g. #2563eb
  light: string;     // e.g. #eff6ff — tinted background
  dark: string;      // e.g. #1d4ed8 — darker for hover/contrast
  text: string;      // text on primary bg (always white)
}

export const COLOR_THEMES: Record<ColorTheme, ColorValues> = {
  blue:    { primary: "#2563eb", light: "#eff6ff", dark: "#1d4ed8", text: "#ffffff" },
  slate:   { primary: "#475569", light: "#f1f5f9", dark: "#334155", text: "#ffffff" },
  emerald: { primary: "#059669", light: "#ecfdf5", dark: "#047857", text: "#ffffff" },
  rose:    { primary: "#e11d48", light: "#fff1f2", dark: "#be123c", text: "#ffffff" },
};

// ── Resume Data (canonical shape produced by AI) ──────────────────────────────

export interface TailoredResumeData {
  personal: {
    full_name: string;
    email: string;
    phone: string;
    linkedin?: string | null;
    github?: string | null;
    website?: string | null;
    address?: string | null;
    photo_url?: string | null;
  };
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    start_date: string;
    end_date: string;
    description: string; // bullet points separated by \n, each starting with •
  }>;
  education: Array<{
    degree: string;
    institution: string;
    start_date?: string | null;
    end_date?: string | null;
    gpa?: string | null;
  }>;
  skills: {
    technical: string[];
    soft: string[];
  };
  projects?: Array<{
    name: string;
    role?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    technologies?: string[];
    link?: string | null;
    description: string;
  }>;
  certifications?: Array<{
    name: string;
    organization: string;
    issue_date?: string | null;
    expiry_date?: string | null;
    credential_url?: string | null;
  }>;
  tailoring_notes?: {
    keywords_integrated: string[];
    sections_prioritized: string[];
    estimated_match_score: number;
  };
}

// ── Section Labels (bilingual) ────────────────────────────────────────────────

export const SECTION_LABELS = {
  vi: {
    summary: "Tóm tắt nghề nghiệp",
    experience: "Kinh nghiệm làm việc",
    education: "Học vấn",
    skills: "Kỹ năng",
    technicalSkills: "Kỹ năng chuyên môn",
    softSkills: "Kỹ năng mềm",
    projects: "Dự án",
    certifications: "Chứng chỉ",
    gpa: "GPA",
    viewProject: "Xem dự án",
    present: "Hiện tại",
  },
  en: {
    summary: "Professional Summary",
    experience: "Work Experience",
    education: "Education",
    skills: "Skills",
    technicalSkills: "Technical Skills",
    softSkills: "Soft Skills",
    projects: "Projects",
    certifications: "Certifications",
    gpa: "GPA",
    viewProject: "View project",
    present: "Present",
  },
} as const;

// ── Template Props ─────────────────────────────────────────────────────────────

export interface TemplateProps {
  data: TailoredResumeData;
  language?: "vi" | "en";
  colorTheme?: ColorTheme;
}
