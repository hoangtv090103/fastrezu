import { CVData, CVLanguage } from "@/contexts/CVEditorContext";

export type SuggestionType = 'add_keyword' | 'improve_section' | 'add_quantification';
export type SuggestionPriority = 'high' | 'medium' | 'low';
export type TargetSection = 'experience' | 'skills' | 'summary' | 'projects';

export interface Suggestion {
  id: string;
  type: SuggestionType;
  keyword?: string;
  targetSection: TargetSection;
  targetIndex?: number;
  priority: SuggestionPriority;
  title: string;
  description: string;
  exampleText?: string;
  actionLabel: string;
  estimatedImpact: number; // Score increase estimate
}

interface JDAnalysis {
  keywords: string[];
  analysis: {
    required_skills?: string[];
    nice_to_have_skills?: string[];
    ats_keywords?: string[];
    [key: string]: unknown;
  };
}

/**
 * Determines the priority of a keyword based on JD analysis
 */
function getKeywordPriority(
  keyword: string,
  jdAnalysis: JDAnalysis
): SuggestionPriority {
  const requiredSkills = jdAnalysis.analysis?.required_skills || [];
  const niceToHaveSkills = jdAnalysis.analysis?.nice_to_have_skills || [];
  const atsKeywords = jdAnalysis.analysis?.ats_keywords || [];

  // High priority: required skills
  if (requiredSkills.some(skill => 
    skill.toLowerCase().includes(keyword.toLowerCase()) || 
    keyword.toLowerCase().includes(skill.toLowerCase())
  )) {
    return 'high';
  }

  // Medium priority: nice-to-have skills or frequently mentioned in ATS keywords
  if (niceToHaveSkills.some(skill => 
    skill.toLowerCase().includes(keyword.toLowerCase()) || 
    keyword.toLowerCase().includes(skill.toLowerCase())
  )) {
    return 'medium';
  }

  // Check frequency in ATS keywords (if mentioned multiple times, it's important)
  const keywordFrequency = atsKeywords.filter(k => 
    k.toLowerCase() === keyword.toLowerCase()
  ).length;
  
  if (keywordFrequency > 1) {
    return 'medium';
  }

  return 'low';
}

/**
 * Determines the best section to add a keyword based on CV structure and keyword type
 */
function determineBestSection(
  keyword: string,
  cvData: CVData,
  _jdAnalysis: JDAnalysis
): { section: TargetSection; index?: number } {
  const keywordLower = keyword.toLowerCase();
  
  // Technical skills and tools should go to skills section
  const technicalIndicators = ['javascript', 'python', 'react', 'node', 'sql', 'aws', 'docker', 'git', 'api', 'framework', 'library', 'database'];
  if (technicalIndicators.some(indicator => keywordLower.includes(indicator))) {
    return { section: 'skills' };
  }

  // Soft skills and general qualifications should go to summary
  const summaryIndicators = ['leadership', 'communication', 'team', 'management', 'strategic', 'analytical'];
  if (summaryIndicators.some(indicator => keywordLower.includes(indicator))) {
    return { section: 'summary' };
  }

  // Project-related keywords
  const projectIndicators = ['project', 'built', 'created', 'developed', 'launched'];
  if (projectIndicators.some(indicator => keywordLower.includes(indicator))) {
    const projects = cvData.sections.projects as Record<string, unknown>[];
    if (projects && Array.isArray(projects) && projects.length > 0) {
      return { section: 'projects', index: 0 };
    }
  }

  // Default to experience section (most common place for keywords)
  const experience = cvData.sections.experience as Record<string, unknown>[];
  if (experience && Array.isArray(experience) && experience.length > 0) {
    // Suggest adding to the most recent experience
    return { section: 'experience', index: 0 };
  }

  // Fallback to skills if no experience
  return { section: 'skills' };
}

/**
 * Generates suggestion text (always in Vietnamese for UI consistency)
 */
function generateSuggestionText(
  keyword: string,
  targetSection: TargetSection,
  _priority: SuggestionPriority,
  _language: CVLanguage
): { title: string; description: string; actionLabel: string } {
  // Always use Vietnamese for suggestions in the Review step
  const texts = {
    experience: {
      title: `Thêm "${keyword}" vào Kinh nghiệm`,
      description: `Từ khóa "${keyword}" là yêu cầu quan trọng trong JD. Hãy thêm nó vào phần kinh nghiệm làm việc của bạn để tăng điểm ATS.`,
      actionLabel: 'Đi đến Kinh nghiệm'
    },
    skills: {
      title: `Thêm "${keyword}" vào Kỹ năng`,
      description: `Kỹ năng "${keyword}" được nhắc đến trong JD. Thêm nó vào danh sách kỹ năng của bạn.`,
      actionLabel: 'Đi đến Kỹ năng'
    },
    summary: {
      title: `Nhắc đến "${keyword}" trong Tóm tắt`,
      description: `Tích hợp "${keyword}" vào phần tóm tắt chuyên môn để làm nổi bật năng lực của bạn.`,
      actionLabel: 'Đi đến Tóm tắt'
    },
    projects: {
      title: `Thêm "${keyword}" vào Dự án`,
      description: `Mô tả cách bạn đã sử dụng "${keyword}" trong các dự án của mình.`,
      actionLabel: 'Đi đến Dự án'
    }
  };

  return texts[targetSection];
}

/**
 * Calculates estimated score impact based on priority and current score
 */
function calculateEstimatedImpact(
  priority: SuggestionPriority,
  currentScore: number
): number {
  // Higher impact when current score is lower
  const baseImpact = {
    high: 8,
    medium: 5,
    low: 3
  };

  const impact = baseImpact[priority];
  
  // Diminishing returns for higher scores
  if (currentScore >= 80) {
    return Math.round(impact * 0.5);
  } else if (currentScore >= 60) {
    return Math.round(impact * 0.75);
  }
  
  return impact;
}

/**
 * Generates 3-5 prioritized suggestions for missing keywords
 */
export function generateSuggestions(
  missingKeywords: string[],
  cvData: CVData,
  jdAnalysis: JDAnalysis
): Suggestion[] {
  if (!missingKeywords || missingKeywords.length === 0) {
    return [];
  }

  const language = cvData.language || 'vi';
  const currentScore = cvData.ats_score || 0;

  // Create suggestions for each missing keyword
  const allSuggestions: Suggestion[] = missingKeywords.map((keyword, index) => {
    const priority = getKeywordPriority(keyword, jdAnalysis);
    const { section, index: targetIndex } = determineBestSection(keyword, cvData, jdAnalysis);
    const { title, description, actionLabel } = generateSuggestionText(keyword, section, priority, language);
    const estimatedImpact = calculateEstimatedImpact(priority, currentScore);

    return {
      id: `suggestion-${index}`,
      type: 'add_keyword',
      keyword,
      targetSection: section,
      targetIndex,
      priority,
      title,
      description,
      actionLabel,
      estimatedImpact
    };
  });

  // Sort by priority (high > medium > low) and estimated impact
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  allSuggestions.sort((a, b) => {
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.estimatedImpact - a.estimatedImpact;
  });

  // Return top 3-5 suggestions
  const maxSuggestions = Math.min(5, allSuggestions.length);
  return allSuggestions.slice(0, maxSuggestions);
}

/**
 * Gets the step index for a given section (for navigation)
 */
export function getSectionStepIndex(section: TargetSection): number {
  const stepMap: Record<TargetSection, number> = {
    summary: 2,
    experience: 3,
    projects: 6,
    skills: 7
  };
  
  return stepMap[section] || 0;
}
