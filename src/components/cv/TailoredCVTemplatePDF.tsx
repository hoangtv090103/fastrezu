"use client";

// TailoredCVTemplatePDF — thin router to the correct PDF template.
// Loaded lazily by TailorResumeButton via dynamic import.

import React from "react";
import type { TailoredResumeData } from "./templates/shared/types";
import type { TemplateId, ColorTheme } from "./templates/shared/types";

import ClassicPDF    from "./templates/classic/ClassicPDF";
import ModernPDF     from "./templates/modern/ModernPDF";
import ExecutivePDF  from "./templates/executive/ExecutivePDF";
import CreativePDF   from "./templates/creative/CreativePDF";
import MinimalPDF    from "./templates/minimal/MinimalPDF";

interface TailoredCVTemplatePDFProps {
  data: TailoredResumeData;
  language?: "vi" | "en";
  templateId?: TemplateId;
  colorTheme?: ColorTheme;
}

export default function TailoredCVTemplatePDF({
  data,
  language = "vi",
  templateId = "classic",
  colorTheme = "blue",
}: TailoredCVTemplatePDFProps) {
  const sharedProps = { data, language, colorTheme };

  switch (templateId) {
    case "modern":    return <ModernPDF    {...sharedProps} />;
    case "executive": return <ExecutivePDF {...sharedProps} />;
    case "creative":  return <CreativePDF  {...sharedProps} />;
    case "minimal":   return <MinimalPDF   {...sharedProps} />;
    default:          return <ClassicPDF   {...sharedProps} />;
  }
}
