"use client";

// Re-export TailoredResumeData from the canonical location for backwards compatibility
export type { TailoredResumeData } from "./templates/shared/types";

import React from "react";
import type { TailoredResumeData } from "./templates/shared/types";
import type { TemplateId, ColorTheme } from "./templates/shared/types";

// Static imports for all preview templates (no lazy loading needed — client-side only)
import ClassicPreview from "./templates/classic/ClassicPreview";
import ModernPreview from "./templates/modern/ModernPreview";
import ExecutivePreview from "./templates/executive/ExecutivePreview";
import CreativePreview from "./templates/creative/CreativePreview";
import MinimalPreview from "./templates/minimal/MinimalPreview";

interface TailoredCVPreviewProps {
  data: TailoredResumeData;
  language?: "vi" | "en";
  templateId?: TemplateId;
  colorTheme?: ColorTheme;
}

export default function TailoredCVPreview({
  data,
  language = "vi",
  templateId = "classic",
  colorTheme = "blue",
}: TailoredCVPreviewProps) {
  const sharedProps = { data, language, colorTheme };

  switch (templateId) {
    case "modern":    return <ModernPreview    {...sharedProps} />;
    case "executive": return <ExecutivePreview {...sharedProps} />;
    case "creative":  return <CreativePreview  {...sharedProps} />;
    case "minimal":   return <MinimalPreview   {...sharedProps} />;
    default:          return <ClassicPreview   {...sharedProps} />;
  }
}
