"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
  Font,
} from "@react-pdf/renderer";
import { CVData } from "@/contexts/CVEditorContext";

// Register fonts for better rendering
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAx05IsDqlA.ttf",
      fontWeight: 700,
    },
    {
      src: "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmSU5vAx05IsDqlA.ttf",
      fontWeight: 600,
    },
  ],
});

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 40,
    fontFamily: "Roboto",
    fontSize: 10,
  },
  // Header styles (single column, no image support in this version)
  header: {
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: "#1e3a8a",
  },
  headerName: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1e3a8a",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerInfoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  headerLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: "#1e3a8a",
    width: 60,
  },
  headerValue: {
    fontSize: 9,
    color: "#374151",
    flex: 1,
  },
  // Section styles
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#1e3a8a",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    borderBottomWidth: 1.5,
    borderBottomColor: "#1e3a8a",
    paddingBottom: 4,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.5,
    textAlign: "justify",
  },
  // Experience/Education item styles
  itemContainer: {
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#111827",
    flex: 1,
    marginRight: 10,
  },
  itemDate: {
    fontSize: 9,
    color: "#6b7280",
    fontWeight: 600,
  },
  itemSubtitle: {
    fontSize: 9,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 6,
  },
  itemLocation: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 6,
  },
  // Bullet list styles
  bulletList: {
    marginTop: 4,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  bullet: {
    width: 3,
    height: 3,
    backgroundColor: "#1e3a8a",
    borderRadius: 3,
    marginTop: 5,
    marginRight: 8,
    flexShrink: 0,
  },
  bulletText: {
    fontSize: 9,
    color: "#374151",
    flex: 1,
    lineHeight: 1.5,
  },
  // Education specific
  educationDetail: {
    fontSize: 9,
    color: "#374151",
    marginBottom: 3,
  },
  // Skills styles
  skillsSection: {
    marginBottom: 12,
  },
  skillsLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: "#1e3a8a",
    marginBottom: 4,
  },
  skillsText: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.4,
  },
  // Additional info list
  infoList: {
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: "#1e3a8a",
    marginRight: 4,
  },
  infoText: {
    fontSize: 9,
    color: "#374151",
    flex: 1,
  },
});

interface CVTemplatePDFProps {
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
      relevantCoursework: "Môn học liên quan",
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
      relevantCoursework: "Relevant Coursework",
    },
  };

  return labels[language];
};

// Helper function to clean markdown (basic cleanup for PDF)
const cleanMarkdown = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold markdown
    .replace(/\*(.*?)\*/g, "$1") // Remove italic markdown
    .replace(/__(.*?)__/g, "$1") // Remove bold markdown (underscore)
    .replace(/_(.*?)_/g, "$1") // Remove italic markdown (underscore)
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Remove links but keep text
    .replace(/`(.*?)`/g, "$1") // Remove code blocks
    .replace(/#{1,6}\s/g, ""); // Remove heading markers
};

export default function CVTemplatePDF({ cvData }: CVTemplatePDFProps) {
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

  const formatMonthDisplay = (value: string): string => {
    const trimmed = value?.trim?.() ?? "";
    if (!trimmed) return "";
    // Match YYYY-MM or YYYY-MM-DD
    const match = trimmed.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
    if (match) {
      const [, year, month] = match;
      return `${month}/${year}`;
    }
    return trimmed;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerName}>
            {getString(personalInfo, "full_name") || labels.fullName}
          </Text>
          {getString(personalInfo, "email") && (
            <View style={styles.headerInfoRow}>
              <Text style={styles.headerLabel}>Email:</Text>
              <Text style={styles.headerValue}>
                {getString(personalInfo, "email")}
              </Text>
            </View>
          )}
          {getString(personalInfo, "phone") && (
            <View style={styles.headerInfoRow}>
              <Text style={styles.headerLabel}>Phone:</Text>
              <Text style={styles.headerValue}>
                {getString(personalInfo, "phone")}
              </Text>
            </View>
          )}
          {getString(personalInfo, "location") && (
            <View style={styles.headerInfoRow}>
              <Text style={styles.headerLabel}>Address:</Text>
              <Text style={styles.headerValue}>
                {getString(personalInfo, "location")}
              </Text>
            </View>
          )}
          {getString(personalInfo, "portfolio") && (
            <View style={styles.headerInfoRow}>
              <Text style={styles.headerLabel}>Website:</Text>
              <Text style={styles.headerValue}>
                {getString(personalInfo, "portfolio")}
              </Text>
            </View>
          )}
          {getString(personalInfo, "linkedin") && (
            <View style={styles.headerInfoRow}>
              <Text style={styles.headerLabel}>LinkedIn:</Text>
              <Text style={styles.headerValue}>
                {getString(personalInfo, "linkedin")}
              </Text>
            </View>
          )}
        </View>

        {/* Professional Summary */}
        {getString(summary, "content") && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {labels.professionalSummary}
            </Text>
            <Text style={styles.summaryText}>
              {cleanMarkdown(getString(summary, "content"))}
            </Text>
          </View>
        )}

        {/* Work Experience */}
        {experience.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>{labels.workExperience}</Text>
            {experience.map((exp: Record<string, unknown>, index: number) => (
              <View key={index} style={styles.itemContainer} wrap={false}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>
                    {getString(exp, "job_title")},{" "}
                    {getString(exp, "company") || labels.company}
                  </Text>
                  <Text style={styles.itemDate}>
                    {(() => {
                      const startDate = formatMonthDisplay(
                        getString(exp, "start_date")
                      );
                      const endDate = formatMonthDisplay(
                        getString(exp, "end_date")
                      );
                      return startDate && endDate
                        ? `${startDate} - ${endDate}`
                        : startDate || endDate || "";
                    })()}
                  </Text>
                </View>
                {getString(exp, "location") && (
                  <Text style={styles.itemLocation}>
                    {getString(exp, "location")}
                  </Text>
                )}
                {Array.isArray(exp.achievements) &&
                  exp.achievements.length > 0 && (
                    <View style={styles.bulletList}>
                      {exp.achievements.map(
                        (achievement: string, achIndex: number) => (
                          <View key={achIndex} style={styles.bulletItem}>
                            <View style={styles.bullet} />
                            <Text style={styles.bulletText}>
                              {cleanMarkdown(achievement)}
                            </Text>
                          </View>
                        )
                      )}
                    </View>
                  )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{labels.education}</Text>
            {education.map((edu: Record<string, unknown>, index: number) => (
              <View key={index} style={styles.itemContainer}>
                <Text style={styles.itemSubtitle}>
                  {getString(edu, "school") || labels.school}
                </Text>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>
                    {getString(edu, "degree")}
                  </Text>
                  <Text style={styles.itemDate}>
                    {formatMonthDisplay(getString(edu, "graduation_date"))}
                  </Text>
                </View>
                {getString(edu, "field_of_study") && (
                  <View style={styles.bulletList}>
                    <View style={styles.bulletItem}>
                      <View style={styles.bullet} />
                      <Text style={styles.bulletText}>
                        {labels.fieldOfStudy}:{" "}
                        {getString(edu, "field_of_study")}
                      </Text>
                    </View>
                  </View>
                )}
                {getString(edu, "gpa") && (
                  <View style={styles.bulletList}>
                    <View style={styles.bulletItem}>
                      <View style={styles.bullet} />
                      <Text style={styles.bulletText}>
                        GPA: {getString(edu, "gpa")}
                      </Text>
                    </View>
                  </View>
                )}
                {getString(edu, "relevant_coursework") && (
                  <View style={styles.bulletList}>
                    <View style={styles.bulletItem}>
                      <View style={styles.bullet} />
                      <Text style={styles.bulletText}>
                        <Text style={{ fontWeight: 700 }}>
                          {labels.relevantCoursework}:{" "}
                        </Text>
                        {getString(edu, "relevant_coursework")}
                      </Text>
                    </View>
                  </View>
                )}
                {/* Activities */}
                {((Array.isArray(edu.activities) &&
                  edu.activities.length > 0) ||
                  (typeof edu.activities === "string" && edu.activities)) && (
                  <View style={styles.bulletList}>
                    {Array.isArray(edu.activities) ? (
                      edu.activities.map((activity: string, i: number) =>
                        activity ? (
                          <View key={i} style={styles.bulletItem}>
                            <View style={styles.bullet} />
                            <Text style={styles.bulletText}>{activity}</Text>
                          </View>
                        ) : null
                      )
                    ) : (
                      <View style={styles.bulletItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.bulletText}>
                          {getString(edu, "activities")}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{labels.projects}</Text>
            {projects.map((project: Record<string, unknown>, index: number) => (
              <View key={index} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>
                    {getString(project, "name") || labels.projectName}
                  </Text>
                  {getString(project, "link") && (
                    <Link src={getString(project, "link")}>
                      <Text style={styles.itemDate}>{labels.viewProject}</Text>
                    </Link>
                  )}
                </View>
                <View style={styles.bulletList}>
                  {getString(project, "description") && (
                    <View style={styles.bulletItem}>
                      <View style={styles.bullet} />
                      <Text style={styles.bulletText}>
                        {cleanMarkdown(getString(project, "description"))}
                      </Text>
                    </View>
                  )}
                  {getString(project, "technologies") && (
                    <View style={styles.bulletItem}>
                      <View style={styles.bullet} />
                      <Text style={styles.bulletText}>
                        {labels.technologies}:{" "}
                        {getString(project, "technologies")}
                      </Text>
                    </View>
                  )}
                  {Array.isArray(project.achievements) &&
                    project.achievements.map(
                      (achievement: string, achIndex: number) => (
                        <View key={achIndex} style={styles.bulletItem}>
                          <View style={styles.bullet} />
                          <Text style={styles.bulletText}>
                            {cleanMarkdown(achievement)}
                          </Text>
                        </View>
                      )
                    )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Skills & Additional Information */}
        {((Array.isArray(skills.technical) && skills.technical.length > 0) ||
          (Array.isArray(skills.soft) && skills.soft.length > 0) ||
          certifications.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {certifications.length > 0
                ? "ADDITIONAL INFORMATION"
                : labels.skills}
            </Text>

            {/* Technical Skills */}
            {Array.isArray(skills.technical) && skills.technical.length > 0 && (
              <View style={styles.skillsSection}>
                <Text style={styles.skillsLabel}>
                  {labels.technicalSkills}:
                </Text>
                <Text style={styles.skillsText}>
                  {(skills.technical as string[]).join(", ")}
                </Text>
              </View>
            )}

            {/* Soft Skills */}
            {Array.isArray(skills.soft) && skills.soft.length > 0 && (
              <View style={styles.skillsSection}>
                <Text style={styles.skillsLabel}>{labels.softSkills}:</Text>
                <Text style={styles.skillsText}>
                  {(skills.soft as string[]).join(", ")}
                </Text>
              </View>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <View style={styles.skillsSection}>
                <Text style={styles.skillsLabel}>{labels.certifications}:</Text>
                {certifications.map(
                  (cert: Record<string, unknown>, index: number) => (
                    <Text key={index} style={styles.skillsText}>
                      {getString(cert, "name")} (
                      {getString(cert, "issuing_organization")}),{" "}
                      {formatMonthDisplay(getString(cert, "date")) ||
                        labels.issueDate}
                      {getString(cert, "credential_id") &&
                        `, ID: ${getString(cert, "credential_id")}`}
                      .
                    </Text>
                  )
                )}
              </View>
            )}
          </View>
        )}
      </Page>
    </Document>
  );
}
