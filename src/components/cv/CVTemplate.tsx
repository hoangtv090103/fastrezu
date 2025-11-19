"use client";

import { CVData } from "@/contexts/CVEditorContext";
import { parseMarkdown } from "@/lib/markdown";

interface CVTemplateProps {
  cvData: CVData;
}

// Translation object for CV template labels
const getTemplateLabels = (language: "vi" | "en") => {
  const labels = {
    vi: {
      fullName: "Họ và tên",
      professionalSummary: "Tóm tắt nghề nghiệp",
      workExperience: "Kinh nghiệm làm việc",
      education: "Học vấn",
      projects: "Dự án",
      skills: "Kỹ năng",
      certifications: "Chứng chỉ",
      jobTitle: "Chức vụ",
      timePeriod: "Thời gian",
      company: "Tên công ty",
      location: "Địa điểm",
      degree: "Bằng cấp",
      graduationDate: "Năm tốt nghiệp",
      school: "Tên trường",
      fieldOfStudy: "Chuyên ngành",
      projectName: "Tên dự án",
      viewProject: "Xem dự án",
      technologies: "Công nghệ",
      technicalSkills: "Kỹ năng chuyên môn",
      softSkills: "Kỹ năng mềm",
      certificationName: "Tên chứng chỉ",
      issueDate: "Ngày cấp",
      issuingOrganization: "Tổ chức cấp",
    },
    en: {
      fullName: "Full Name",
      professionalSummary: "Professional Summary",
      workExperience: "Work Experience",
      education: "Education",
      projects: "Projects",
      skills: "Skills",
      certifications: "Certifications",
      jobTitle: "Job Title",
      timePeriod: "Time Period",
      company: "Company",
      location: "Location",
      degree: "Degree",
      graduationDate: "Graduation Date",
      school: "School",
      fieldOfStudy: "Field of Study",
      projectName: "Project Name",
      viewProject: "View Project",
      technologies: "Technologies",
      technicalSkills: "Technical Skills",
      softSkills: "Soft Skills",
      certificationName: "Certification Name",
      issueDate: "Issue Date",
      issuingOrganization: "Issuing Organization",
    },
  };

  return labels[language];
};

export default function CVTemplate({ cvData }: CVTemplateProps) {
  const labels = getTemplateLabels(cvData.language);

  // Safely access sections with fallbacks
  const sections = cvData.sections || {};
  const personalInfo =
    (sections.personal_info as Record<string, unknown>) || {};
  const summary = (sections.summary as Record<string, unknown>) || {};
  const experience =
    (sections.experience as unknown as Record<string, unknown>[]) || [];
  const education =
    (sections.education as unknown as Record<string, unknown>[]) || [];
  const projects =
    (sections.projects as unknown as Record<string, unknown>[]) || [];
  const skills = (sections.skills as Record<string, unknown>) || {};
  const certifications =
    (sections.certifications as unknown as Record<string, unknown>[]) || [];

  // Helper function to safely get string values
  const getString = (obj: Record<string, unknown>, key: string): string => {
    const value = obj[key];
    return typeof value === "string" ? value : "";
  };

  // Helper to safely render unknown values
  const renderValue = (value: unknown): React.ReactNode => {
    if (typeof value === "string" || typeof value === "number") {
      return value;
    }
    return null;
  };

  const formatMonthDisplay = (value: unknown): string => {
    if (typeof value !== "string") return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    // Match YYYY-MM or YYYY-MM-DD
    const match = trimmed.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
    if (match) {
      const [, year, month] = match;
      return `${year}/${month}`;
    }
    return trimmed;
  };

  return (
    <div
      className="cv-template bg-white text-gray-900 max-w-4xl mx-auto shadow-lg"
      style={{
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: "11pt",
        lineHeight: "1.5",
        padding: "1rem",
      }}
    >
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8 border-b-2 border-blue-600 pb-4 sm:pb-6">
        <h1
          className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 text-gray-900"
          style={{
            fontSize: "20pt",
            fontWeight: "700",
            letterSpacing: "-0.5px",
          }}
        >
          {getString(personalInfo, "full_name") || labels.fullName}
        </h1>
        <div className="text-xs sm:text-sm text-gray-600 space-y-1">
          <div className="flex justify-center items-center gap-2 sm:gap-4 flex-wrap">
            {getString(personalInfo, "email") && (
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
                {getString(personalInfo, "email")}
              </span>
            )}
            {getString(personalInfo, "phone") && (
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
                {getString(personalInfo, "phone")}
              </span>
            )}
            {getString(personalInfo, "location") && (
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
                {getString(personalInfo, "location")}
              </span>
            )}
          </div>
          <div className="flex justify-center items-center gap-2 sm:gap-4 flex-wrap">
            {getString(personalInfo, "linkedin") && (
              <span className="text-blue-600 hover:text-blue-800 transition-colors">
                LinkedIn: {getString(personalInfo, "linkedin")}
              </span>
            )}
            {getString(personalInfo, "portfolio") && (
              <span className="text-blue-600 hover:text-blue-800 transition-colors">
                Portfolio: {getString(personalInfo, "portfolio")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Professional Summary */}
      {getString(summary, "content") && (
        <div className="mb-8">
          <h2
            className="text-lg font-bold mb-4 text-blue-600 uppercase tracking-wide"
            style={{
              fontSize: "14pt",
              fontWeight: "700",
              borderBottom: "2px solid #2563eb",
              paddingBottom: "4px",
              letterSpacing: "1px",
            }}
          >
            {labels.professionalSummary}
          </h2>
          <div
            className="text-sm leading-relaxed"
            style={{
              fontSize: "11pt",
              lineHeight: "1.6",
              color: "#374151",
            }}
          >
            {parseMarkdown(getString(summary, "content"))}
          </div>
        </div>
      )}

      {/* Work Experience */}
      {experience.length > 0 && (
        <div className="mb-8">
          <h2
            className="text-lg font-bold mb-6 text-blue-600 uppercase tracking-wide"
            style={{
              fontSize: "14pt",
              fontWeight: "700",
              borderBottom: "2px solid #2563eb",
              paddingBottom: "4px",
              letterSpacing: "1px",
            }}
          >
            {labels.workExperience}
          </h2>
          {experience.map((exp: Record<string, unknown>, index: number) => (
            <div
              key={index}
              className="mb-6 pb-4 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex justify-between items-start mb-2">
                <h3
                  className="font-bold text-gray-900"
                  style={{ fontSize: "12pt", fontWeight: "700" }}
                >
                  {renderValue(exp.job_title)},{" "}
                  {renderValue(exp.company) || labels.company}
                </h3>
                <span
                  className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded"
                  style={{ fontSize: "10pt" }}
                >
                  {(() => {
                    const startDate = formatMonthDisplay(exp.start_date);
                    const endDate = formatMonthDisplay(exp.end_date);
                    return startDate && endDate
                      ? `${startDate} - ${endDate}`
                      : startDate || endDate || "";
                  })()}
                </span>
              </div>
              {renderValue(exp.location) && (
                <p
                  className="text-sm text-gray-500 mb-3"
                  style={{ fontSize: "10pt" }}
                >
                  {renderValue(exp.location)}
                </p>
              )}
              {Array.isArray(exp.achievements) &&
                exp.achievements.length > 0 && (
                  <ul className="space-y-2" style={{ fontSize: "10pt" }}>
                    {exp.achievements.map(
                      (achievement: string, achIndex: number) => (
                        <li key={achIndex} className="flex items-start">
                          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 shrink-0"></span>
                          <span className="text-gray-700 leading-relaxed">
                            {parseMarkdown(achievement)}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-8">
          <h2
            className="text-lg font-bold mb-6 text-blue-600 uppercase tracking-wide"
            style={{
              fontSize: "14pt",
              fontWeight: "700",
              borderBottom: "2px solid #2563eb",
              paddingBottom: "4px",
              letterSpacing: "1px",
            }}
          >
            {labels.education}
          </h2>
          {education.map((edu: Record<string, unknown>, index: number) => (
            <div
              key={index}
              className="mb-4 pb-3 border-b border-gray-100 last:border-b-0"
            >
              <p
                className="font-bold text-blue-600 mb-2"
                style={{ fontSize: "11pt", fontWeight: "600" }}
              >
                {renderValue(edu.school) || labels.school}
              </p>
              <div className="flex justify-between items-start mb-2">
                <h3
                  className="font-semibold text-gray-900"
                  style={{ fontSize: "12pt", fontWeight: "700" }}
                >
                  {renderValue(edu.degree)}
                </h3>
                <span
                  className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded"
                  style={{ fontSize: "10pt" }}
                >
                  {formatMonthDisplay(edu.graduation_date) ||
                    labels.graduationDate}
                </span>
              </div>
              {(renderValue(edu.field_of_study) || renderValue(edu.gpa)) && (
                <ul className="space-y-1 mt-2" style={{ fontSize: "10pt" }}>
                  {renderValue(edu.field_of_study) && (
                    <li className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 shrink-0"></span>
                      <span className="text-gray-700">
                        {labels.fieldOfStudy}: {renderValue(edu.field_of_study)}
                      </span>
                    </li>
                  )}
                  {renderValue(edu.gpa) && (
                    <li className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 shrink-0"></span>
                      <span className="text-gray-700">
                        GPA: {renderValue(edu.gpa)}
                      </span>
                    </li>
                  )}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mb-8">
          <h2
            className="text-lg font-bold mb-6 text-blue-600 uppercase tracking-wide"
            style={{
              fontSize: "14pt",
              fontWeight: "700",
              borderBottom: "2px solid #2563eb",
              paddingBottom: "4px",
              letterSpacing: "1px",
            }}
          >
            {labels.projects}
          </h2>
          {projects.map((project: Record<string, unknown>, index: number) => (
            <div key={index} className="mb-4">
              <div className="flex justify-between items-start mb-1">
                <h3
                  className="font-bold"
                  style={{ fontSize: "11pt", fontWeight: "bold" }}
                >
                  {renderValue(project.name) || labels.projectName}
                </h3>
                {renderValue(project.link) && (
                  <a
                    href={String(project.link)}
                    className="text-sm text-blue-600"
                    style={{ fontSize: "10pt" }}
                  >
                    {labels.viewProject}
                  </a>
                )}
              </div>
              <ul className="space-y-2 mt-2" style={{ fontSize: "10pt" }}>
                {renderValue(project.description) && (
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 shrink-0"></span>
                    <span className="text-gray-700 leading-relaxed">
                      {parseMarkdown(String(renderValue(project.description)))}
                    </span>
                  </li>
                )}
                {renderValue(project.technologies) && (
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 shrink-0"></span>
                    <span className="text-gray-700 leading-relaxed">
                      {labels.technologies}: {renderValue(project.technologies)}
                    </span>
                  </li>
                )}
                {Array.isArray(project.achievements) &&
                  project.achievements.map(
                    (achievement: string, achIndex: number) => (
                      <li key={achIndex} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 shrink-0"></span>
                        <span className="text-gray-700 leading-relaxed">
                          {parseMarkdown(achievement)}
                        </span>
                      </li>
                    )
                  )}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {((Array.isArray(skills.technical) && skills.technical.length > 0) ||
        (Array.isArray(skills.soft) && skills.soft.length > 0)) && (
        <div className="mb-8">
          <h2
            className="text-lg font-bold mb-6 text-blue-600 uppercase tracking-wide"
            style={{
              fontSize: "14pt",
              fontWeight: "700",
              borderBottom: "2px solid #2563eb",
              paddingBottom: "4px",
              letterSpacing: "1px",
            }}
          >
            {labels.skills}
          </h2>
          {Array.isArray(skills.technical) && skills.technical.length > 0 && (
            <div className="mb-3">
              <h3
                className="font-medium mb-1"
                style={{ fontSize: "11pt", fontWeight: "600" }}
              >
                {labels.technicalSkills}:
              </h3>
              <p className="text-sm" style={{ fontSize: "10pt" }}>
                {(skills.technical as string[]).join(", ")}
              </p>
            </div>
          )}
          {Array.isArray(skills.soft) && skills.soft.length > 0 && (
            <div>
              <h3
                className="font-medium mb-1"
                style={{ fontSize: "11pt", fontWeight: "600" }}
              >
                {labels.softSkills}:
              </h3>
              <p className="text-sm" style={{ fontSize: "10pt" }}>
                {(skills.soft as string[]).join(", ")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div className="mb-8">
          <h2
            className="text-lg font-bold mb-6 text-blue-600 uppercase tracking-wide"
            style={{
              fontSize: "14pt",
              fontWeight: "700",
              borderBottom: "2px solid #2563eb",
              paddingBottom: "4px",
              letterSpacing: "1px",
            }}
          >
            {labels.certifications}
          </h2>
          {certifications.map(
            (cert: Record<string, unknown>, index: number) => (
              <div key={index} className="mb-3">
                <div className="flex justify-between items-start mb-1">
                  <h3
                    className="font-bold"
                    style={{ fontSize: "11pt", fontWeight: "bold" }}
                  >
                    {renderValue(cert.name) || labels.certificationName}
                  </h3>
                  <span
                    className="text-sm text-gray-600"
                    style={{ fontSize: "10pt" }}
                  >
                    {formatMonthDisplay(cert.date) || labels.issueDate}
                  </span>
                </div>
                <p
                  className="font-medium"
                  style={{ fontSize: "11pt", fontWeight: "600" }}
                >
                  {renderValue(cert.issuing_organization) ||
                    labels.issuingOrganization}
                </p>
                {renderValue(cert.credential_id) && (
                  <p
                    className="text-sm text-gray-600"
                    style={{ fontSize: "10pt" }}
                  >
                    ID: {renderValue(cert.credential_id)}
                  </p>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
