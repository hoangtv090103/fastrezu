"use client";

import { CVData } from "@/contexts/CVEditorContext";

interface CVTemplateProps {
  cvData: CVData;
}

export default function CVTemplate({ cvData }: CVTemplateProps) {
  const personalInfo = (cvData.sections.personal_info as Record<string, unknown>) || {};
  const summary = (cvData.sections.summary as Record<string, unknown>) || {};
  const experience = (cvData.sections.experience as unknown as Record<string, unknown>[]) || [];
  const education = (cvData.sections.education as unknown as Record<string, unknown>[]) || [];
  const projects = (cvData.sections.projects as unknown as Record<string, unknown>[]) || [];
  const skills = (cvData.sections.skills as Record<string, unknown>) || {};
  const certifications = (cvData.sections.certifications as unknown as Record<string, unknown>[]) || [];

  // Helper function to safely get string values
  const getString = (obj: Record<string, unknown>, key: string): string => {
    const value = obj[key];
    return typeof value === 'string' ? value : '';
  };

  // Helper to safely render unknown values
  const renderValue = (value: unknown): React.ReactNode => {
    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }
    return null;
  };

  return (
    <div className="cv-template p-8 text-gray-900" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt', lineHeight: '1.4' }}>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2" style={{ fontSize: '18pt', fontWeight: 'bold' }}>
          {getString(personalInfo, 'full_name') || "Họ và tên"}
        </h1>
        <div className="text-sm text-gray-600">
          {getString(personalInfo, 'email') && <span>{getString(personalInfo, 'email')}</span>}
          {getString(personalInfo, 'phone') && <span> • {getString(personalInfo, 'phone')}</span>}
          {getString(personalInfo, 'location') && <span> • {getString(personalInfo, 'location')}</span>}
        </div>
        <div className="text-sm text-gray-600 mt-1">
          {getString(personalInfo, 'linkedin') && <span>LinkedIn: {getString(personalInfo, 'linkedin')}</span>}
          {getString(personalInfo, 'portfolio') && <span> • Portfolio: {getString(personalInfo, 'portfolio')}</span>}
        </div>
      </div>

      {/* Professional Summary */}
      {getString(summary, 'content') && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2 uppercase" style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid #333', paddingBottom: '2px' }}>
            Tóm tắt nghề nghiệp
          </h2>
          <p className="text-sm" style={{ fontSize: '11pt' }}>
            {getString(summary, 'content')}
          </p>
        </div>
      )}

      {/* Work Experience */}
      {experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 uppercase" style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid #333', paddingBottom: '2px' }}>
            Kinh nghiệm làm việc
          </h2>
          {experience.map((exp: Record<string, unknown>, index: number) => (
            <div key={index} className="mb-4">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold" style={{ fontSize: '11pt', fontWeight: 'bold' }}>
                  {renderValue(exp.job_title) || "Chức vụ"}
                </h3>
                <span className="text-sm text-gray-600" style={{ fontSize: '10pt' }}>
                  {exp.start_date && exp.end_date ? `${renderValue(exp.start_date)} - ${renderValue(exp.end_date)}` : "Thời gian"}
                </span>
              </div>
              <div className="flex justify-between items-start mb-2">
                <p className="font-medium" style={{ fontSize: '11pt', fontWeight: '600' }}>
                  {renderValue(exp.company) || "Tên công ty"}
                </p>
                <span className="text-sm text-gray-600" style={{ fontSize: '10pt' }}>
                  {renderValue(exp.location) || "Địa điểm"}
                </span>
              </div>
              {Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                <ul className="list-disc list-inside text-sm ml-4" style={{ fontSize: '10pt' }}>
                  {exp.achievements.map((achievement: string, achIndex: number) => (
                    <li key={achIndex} className="mb-1">
                      {achievement}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 uppercase" style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid #333', paddingBottom: '2px' }}>
            Học vấn
          </h2>
          {education.map((edu: Record<string, unknown>, index: number) => (
            <div key={index} className="mb-3">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold" style={{ fontSize: '11pt', fontWeight: 'bold' }}>
                  {renderValue(edu.degree) || "Bằng cấp"}
                </h3>
                <span className="text-sm text-gray-600" style={{ fontSize: '10pt' }}>
                  {renderValue(edu.graduation_date) || "Năm tốt nghiệp"}
                </span>
              </div>
              <p className="font-medium" style={{ fontSize: '11pt', fontWeight: '600' }}>
                {renderValue(edu.school) || "Tên trường"}
              </p>
              {renderValue(edu.field_of_study) && (
                <p className="text-sm text-gray-600" style={{ fontSize: '10pt' }}>
                  Chuyên ngành: {renderValue(edu.field_of_study)}
                </p>
              )}
              {renderValue(edu.gpa) && (
                <p className="text-sm text-gray-600" style={{ fontSize: '10pt' }}>
                  GPA: {renderValue(edu.gpa)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 uppercase" style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid #333', paddingBottom: '2px' }}>
            Dự án
          </h2>
          {projects.map((project: Record<string, unknown>, index: number) => (
            <div key={index} className="mb-4">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold" style={{ fontSize: '11pt', fontWeight: 'bold' }}>
                  {renderValue(project.name) || "Tên dự án"}
                </h3>
                {renderValue(project.link) && (
                  <a href={String(project.link)} className="text-sm text-blue-600" style={{ fontSize: '10pt' }}>
                    Xem dự án
                  </a>
                )}
              </div>
              {renderValue(project.description) && (
                <p className="text-sm mb-2" style={{ fontSize: '10pt' }}>
                  {renderValue(project.description)}
                </p>
              )}
              {renderValue(project.technologies) && (
                <p className="text-sm text-gray-600" style={{ fontSize: '10pt' }}>
                  Công nghệ: {renderValue(project.technologies)}
                </p>
              )}
              {Array.isArray(project.achievements) && project.achievements.length > 0 && (
                <ul className="list-disc list-inside text-sm ml-4 mt-2" style={{ fontSize: '10pt' }}>
                  {project.achievements.map((achievement: string, achIndex: number) => (
                    <li key={achIndex} className="mb-1">
                      {achievement}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {((Array.isArray(skills.technical) && skills.technical.length > 0) || (Array.isArray(skills.soft) && skills.soft.length > 0)) && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 uppercase" style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid #333', paddingBottom: '2px' }}>
            Kỹ năng
          </h2>
          {Array.isArray(skills.technical) && skills.technical.length > 0 && (
            <div className="mb-3">
              <h3 className="font-medium mb-1" style={{ fontSize: '11pt', fontWeight: '600' }}>
                Kỹ năng kỹ thuật:
              </h3>
              <p className="text-sm" style={{ fontSize: '10pt' }}>
                {(skills.technical as string[]).join(", ")}
              </p>
            </div>
          )}
          {Array.isArray(skills.soft) && skills.soft.length > 0 && (
            <div>
              <h3 className="font-medium mb-1" style={{ fontSize: '11pt', fontWeight: '600' }}>
                Kỹ năng mềm:
              </h3>
              <p className="text-sm" style={{ fontSize: '10pt' }}>
                {(skills.soft as string[]).join(", ")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 uppercase" style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid #333', paddingBottom: '2px' }}>
            Chứng chỉ
          </h2>
          {certifications.map((cert: Record<string, unknown>, index: number) => (
            <div key={index} className="mb-3">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold" style={{ fontSize: '11pt', fontWeight: 'bold' }}>
                  {renderValue(cert.name) || "Tên chứng chỉ"}
                </h3>
                <span className="text-sm text-gray-600" style={{ fontSize: '10pt' }}>
                  {renderValue(cert.date) || "Ngày cấp"}
                </span>
              </div>
              <p className="font-medium" style={{ fontSize: '11pt', fontWeight: '600' }}>
                {renderValue(cert.issuing_organization) || "Tổ chức cấp"}
              </p>
              {renderValue(cert.credential_id) && (
                <p className="text-sm text-gray-600" style={{ fontSize: '10pt' }}>
                  ID: {renderValue(cert.credential_id)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
