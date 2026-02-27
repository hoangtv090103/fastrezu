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
import type { TailoredResumeData } from "./TailoredCVPreview";

// Register Roboto font (same as CVTemplatePDF)
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

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 40,
    fontFamily: "Roboto",
    fontSize: 10,
  },
  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
    alignItems: "center",
  },
  headerName: {
    fontSize: 22,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  headerContactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginBottom: 3,
  },
  headerContact: {
    fontSize: 9,
    color: "#6b7280",
  },
  headerLink: {
    fontSize: 9,
    color: "#2563eb",
  },
  // ── Section ─────────────────────────────────────────────────────────────
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#2563eb",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    borderBottomWidth: 1.5,
    borderBottomColor: "#2563eb",
    paddingBottom: 3,
    marginBottom: 10,
  },
  // ── Summary ─────────────────────────────────────────────────────────────
  summaryText: {
    fontSize: 9.5,
    color: "#374151",
    lineHeight: 1.55,
    textAlign: "justify",
  },
  // ── Experience / Education item ──────────────────────────────────────────
  itemContainer: {
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#111827",
    flex: 1,
    marginRight: 10,
  },
  itemCompany: {
    fontSize: 9.5,
    color: "#6b7280",
    fontWeight: 400,
  },
  itemDate: {
    fontSize: 9,
    color: "#9ca3af",
    fontWeight: 400,
    flexShrink: 0,
  },
  itemSubtitle: {
    fontSize: 9,
    color: "#374151",
    marginBottom: 4,
  },
  // ── Bullet list ──────────────────────────────────────────────────────────
  bulletList: {
    marginTop: 3,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 3,
  },
  bullet: {
    width: 3,
    height: 3,
    backgroundColor: "#2563eb",
    borderRadius: 3,
    marginTop: 4,
    marginRight: 7,
    flexShrink: 0,
  },
  bulletText: {
    fontSize: 9,
    color: "#374151",
    flex: 1,
    lineHeight: 1.5,
  },
  // ── Skills ───────────────────────────────────────────────────────────────
  skillRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  skillLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: "#374151",
    marginRight: 6,
    minWidth: 100,
  },
  skillText: {
    fontSize: 9,
    color: "#6b7280",
    flex: 1,
    lineHeight: 1.4,
  },
  // ── Projects ─────────────────────────────────────────────────────────────
  projectTech: {
    fontSize: 8.5,
    color: "#6b7280",
    marginBottom: 3,
  },
  // ── Certifications ────────────────────────────────────────────────────────
  certContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  certName: {
    fontSize: 9.5,
    fontWeight: 700,
    color: "#111827",
  },
  certOrg: {
    fontSize: 9,
    color: "#6b7280",
  },
  certDate: {
    fontSize: 9,
    color: "#9ca3af",
  },
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function dateRange(start?: string | null, end?: string | null): string {
  const s = (start ?? "").trim();
  const e = (end ?? "").trim();
  if (s && e) return `${s} – ${e}`;
  return s || e;
}

function parseBullets(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.replace(/^[•\-]\s*/, "").trim())
    .filter(Boolean);
}

// ── Labels ───────────────────────────────────────────────────────────────────
const LABELS = {
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
  },
};

// ── PDF Document ─────────────────────────────────────────────────────────────

interface TailoredCVTemplatePDFProps {
  data: TailoredResumeData;
  language?: "vi" | "en";
}

export default function TailoredCVTemplatePDF({
  data,
  language = "vi",
}: TailoredCVTemplatePDFProps) {
  const lbl = LABELS[language];
  const {
    personal,
    summary,
    experience,
    education,
    skills,
    projects,
    certifications,
  } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerName}>{personal.full_name}</Text>

          {/* Contact row */}
          <View style={styles.headerContactRow}>
            {personal.email ? (
              <Text style={styles.headerContact}>{personal.email}</Text>
            ) : null}
            {personal.phone ? (
              <Text style={styles.headerContact}>  ·  {personal.phone}</Text>
            ) : null}
            {personal.address ? (
              <Text style={styles.headerContact}>  ·  {personal.address}</Text>
            ) : null}
          </View>

          {/* Links row */}
          {(personal.linkedin || personal.github || personal.website) ? (
            <View style={styles.headerContactRow}>
              {personal.linkedin ? (
                <Text style={styles.headerLink}>
                  LinkedIn: {personal.linkedin}
                </Text>
              ) : null}
              {personal.github ? (
                <Text style={styles.headerLink}>  ·  GitHub: {personal.github}</Text>
              ) : null}
              {personal.website ? (
                <Link src={personal.website} style={styles.headerLink}>
                  {personal.website}
                </Link>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* ── Summary ── */}
        {summary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{lbl.summary}</Text>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        ) : null}

        {/* ── Experience ── */}
        {experience.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{lbl.experience}</Text>
            {experience.map((exp, i) => (
              <View key={i} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>
                      {exp.title}
                      {exp.company ? (
                        <Text style={styles.itemCompany}> — {exp.company}</Text>
                      ) : null}
                    </Text>
                  </View>
                  {dateRange(exp.start_date, exp.end_date) ? (
                    <Text style={styles.itemDate}>
                      {dateRange(exp.start_date, exp.end_date)}
                    </Text>
                  ) : null}
                </View>
                {exp.description ? (
                  <View style={styles.bulletList}>
                    {parseBullets(exp.description).map((line, j) => (
                      <View key={j} style={styles.bulletItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.bulletText}>{line}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* ── Education ── */}
        {education.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{lbl.education}</Text>
            {education.map((edu, i) => (
              <View key={i} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{edu.degree}</Text>
                    {edu.institution ? (
                      <Text style={styles.itemSubtitle}>
                        {edu.institution}
                        {edu.gpa ? `  ·  ${lbl.gpa}: ${edu.gpa}` : ""}
                      </Text>
                    ) : null}
                  </View>
                  {dateRange(edu.start_date, edu.end_date) ? (
                    <Text style={styles.itemDate}>
                      {dateRange(edu.start_date, edu.end_date)}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* ── Skills ── */}
        {(skills.technical.length > 0 || skills.soft.length > 0) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{lbl.skills}</Text>
            {skills.technical.length > 0 ? (
              <View style={styles.skillRow}>
                <Text style={styles.skillLabel}>{lbl.technicalSkills}:</Text>
                <Text style={styles.skillText}>
                  {skills.technical.join("  ·  ")}
                </Text>
              </View>
            ) : null}
            {skills.soft.length > 0 ? (
              <View style={styles.skillRow}>
                <Text style={styles.skillLabel}>{lbl.softSkills}:</Text>
                <Text style={styles.skillText}>
                  {skills.soft.join("  ·  ")}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* ── Projects ── */}
        {projects && projects.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{lbl.projects}</Text>
            {projects.map((proj, i) => (
              <View key={i} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>
                      {proj.name}
                      {proj.role ? (
                        <Text style={styles.itemCompany}>  ·  {proj.role}</Text>
                      ) : null}
                    </Text>
                    {proj.technologies && proj.technologies.length > 0 ? (
                      <Text style={styles.projectTech}>
                        {proj.technologies.join("  ·  ")}
                      </Text>
                    ) : null}
                  </View>
                  {dateRange(proj.start_date, proj.end_date) ? (
                    <Text style={styles.itemDate}>
                      {dateRange(proj.start_date, proj.end_date)}
                    </Text>
                  ) : null}
                </View>
                {proj.link ? (
                  <Link src={proj.link} style={styles.headerLink}>
                    {lbl.viewProject}: {proj.link}
                  </Link>
                ) : null}
                {proj.description ? (
                  <View style={styles.bulletList}>
                    {parseBullets(proj.description).map((line, j) => (
                      <View key={j} style={styles.bulletItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.bulletText}>{line}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* ── Certifications ── */}
        {certifications && certifications.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{lbl.certifications}</Text>
            {certifications.map((cert, i) => (
              <View key={i} style={styles.certContainer}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.certName}>{cert.name}</Text>
                  <Text style={styles.certOrg}>
                    {cert.organization}
                    {cert.issue_date ? `  ·  ${cert.issue_date}` : ""}
                  </Text>
                  {cert.credential_url ? (
                    <Link src={cert.credential_url} style={styles.headerLink}>
                      {lbl.viewProject}
                    </Link>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}

      </Page>
    </Document>
  );
}
