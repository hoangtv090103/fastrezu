/**
 * Tooltip content configuration for educational tooltips
 * Supports both Vietnamese (vi) and English (en) languages
 */

export type Language = 'vi' | 'en';

export interface TooltipContent {
  title: string;
  content: string;
}

export interface TooltipContentMap {
  jd_analysis_importance: TooltipContent;
  ats_score_meaning: TooltipContent;
  ai_experience_benefits: TooltipContent;
  language_selection: TooltipContent;
}

/**
 * Tooltip content in Vietnamese and English
 */
export const TOOLTIP_CONTENT: Record<Language, TooltipContentMap> = {
  vi: {
    jd_analysis_importance: {
      title: 'Tại sao phân tích JD quan trọng?',
      content:
        'ATS (Applicant Tracking System) là phần mềm mà nhà tuyển dụng sử dụng để quét và lọc CV tự động. Hệ thống này tìm kiếm các từ khóa từ mô tả công việc (JD) trong CV của bạn. Phân tích JD giúp xác định những từ khóa quan trọng này để tối ưu hóa CV của bạn và tăng cơ hội vượt qua vòng lọc tự động.',
    },
    ats_score_meaning: {
      title: 'Điểm ATS có nghĩa gì?',
      content:
        'Điểm ATS (0-100) đánh giá mức độ phù hợp của CV với yêu cầu công việc dựa trên các từ khóa và kỹ năng được tìm thấy. Điểm trên 80 cho thấy CV của bạn có cơ hội cao vượt qua vòng lọc tự động. Điểm thấp hơn có nghĩa là bạn cần thêm các từ khóa còn thiếu vào CV.',
    },
    ai_experience_benefits: {
      title: 'Tại sao nên dùng AI viết kinh nghiệm?',
      content:
        'AI giúp bạn viết các điểm kinh nghiệm theo chuẩn chuyên nghiệp với động từ hành động mạnh mẽ và số liệu cụ thể. Những thành tựu được lượng hóa (ví dụ: "Tăng doanh số 30%") giúp CV nổi bật hơn và dễ vượt qua ATS. AI cũng đảm bảo ngôn ngữ nhất quán và chuyên nghiệp.',
    },
    language_selection: {
      title: 'Chọn ngôn ngữ cho CV',
      content:
        'Ngôn ngữ bạn chọn sẽ được sử dụng cho toàn bộ nội dung AI tạo ra (tóm tắt, kinh nghiệm, gợi ý) và nhãn trong CV. Hãy chọn ngôn ngữ phù hợp với công việc bạn ứng tuyển. Bạn có thể thay đổi ngôn ngữ sau, nhưng nội dung đã tạo sẽ không tự động dịch.',
    },
  },
  en: {
    jd_analysis_importance: {
      title: 'Why is JD analysis important?',
      content:
        'ATS (Applicant Tracking System) is software that employers use to automatically scan and filter resumes. This system searches for keywords from the job description (JD) in your CV. JD analysis helps identify these important keywords to optimize your CV and increase your chances of passing the automated screening.',
    },
    ats_score_meaning: {
      title: 'What does the ATS score mean?',
      content:
        'The ATS score (0-100) evaluates how well your CV matches the job requirements based on keywords and skills found. A score above 80 indicates your CV has a high chance of passing automated screening. A lower score means you need to add missing keywords to your CV.',
    },
    ai_experience_benefits: {
      title: 'Why use AI to write experience?',
      content:
        'AI helps you write experience bullet points following professional standards with strong action verbs and specific metrics. Quantified achievements (e.g., "Increased sales by 30%") make your CV stand out and pass ATS more easily. AI also ensures consistent and professional language.',
    },
    language_selection: {
      title: 'Choose language for your CV',
      content:
        'The language you select will be used for all AI-generated content (summary, experience, suggestions) and labels in your CV. Choose the language that matches the job you\'re applying for. You can change the language later, but existing content won\'t be automatically translated.',
    },
  },
};

/**
 * Get tooltip content for a specific key and language
 */
export function getTooltipContent(
  key: keyof TooltipContentMap,
  language: Language = 'vi'
): TooltipContent {
  return TOOLTIP_CONTENT[language][key];
}

/**
 * Get all tooltip content for a specific language
 */
export function getAllTooltipContent(language: Language = 'vi'): TooltipContentMap {
  return TOOLTIP_CONTENT[language];
}
