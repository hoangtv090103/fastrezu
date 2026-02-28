"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet, Link, Font } from "@react-pdf/renderer";
import {
  TailoredResumeData,
  ColorTheme,
  COLOR_THEMES,
  SECTION_LABELS,
} from "../shared/types";
import { dateRange, parseBullets } from "../shared/utils";

Font.register({
  family: "Roboto",
  fonts: [
    { src: "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmSU5vAx05IsDqlA.ttf", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAx05IsDqlA.ttf", fontWeight: 700 },
  ],
});

interface Props {
  data: TailoredResumeData;
  language?: "vi" | "en";
  colorTheme?: ColorTheme;
}

export default function ClassicPDF({ data, language = "vi", colorTheme = "blue" }: Props) {
  const c = COLOR_THEMES[colorTheme];
  const lbl = SECTION_LABELS[language];
  const { personal, summary, experience, education, skills, projects, certifications } = data;

  const styles = StyleSheet.create({
    page: { fontFamily: "Roboto", fontSize: 10, backgroundColor: "#fff", padding: "36pt 44pt" },
    // Header
    header: { alignItems: "center", borderBottomWidth: 2.5, borderBottomColor: c.primary, paddingBottom: 12, marginBottom: 6 },
    name: { fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 6 },
    contactRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
    contactText: { fontSize: 9, color: "#6b7280" },
    linkText: { fontSize: 9, color: c.primary },
    // Section
    section: { marginBottom: 14 },
    sectionTitle: { fontSize: 10, fontWeight: 700, color: c.primary, textTransform: "uppercase", letterSpacing: 0.8, borderBottomWidth: 1.5, borderBottomColor: c.primary, paddingBottom: 3, marginBottom: 8, marginTop: 12 },
    // Item
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    itemTitle: { fontSize: 10, fontWeight: 700, color: "#111827" },
    itemSub: { fontSize: 9.5, color: "#6b7280" },
    dateText: { fontSize: 9, color: "#9ca3af", flexShrink: 0 },
    // Summary
    summaryText: { fontSize: 9.5, color: "#374151", lineHeight: 1.6 },
    // Bullet
    bulletList: { marginTop: 4 },
    bulletItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 3 },
    bullet: { width: 4, height: 4, backgroundColor: c.primary, borderRadius: 4, marginTop: 3.5, marginRight: 6, flexShrink: 0 },
    bulletText: { fontSize: 9, color: "#374151", flex: 1, lineHeight: 1.5 },
    // Skills
    skillRow: { flexDirection: "row", marginBottom: 4 },
    skillLabel: { fontSize: 9, fontWeight: 700, color: "#374151", marginRight: 5, minWidth: 95 },
    skillValue: { fontSize: 9, color: "#6b7280", flex: 1 },
    // Project/Cert
    techText: { fontSize: 8.5, color: "#6b7280", marginBottom: 3 },
    certOrg: { fontSize: 9, color: "#6b7280" },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{personal.full_name}</Text>
          <View style={styles.contactRow}>
            {personal.email ? <Text style={styles.contactText}>{personal.email}</Text> : null}
            {personal.phone ? <Text style={styles.contactText}>  ·  {personal.phone}</Text> : null}
            {personal.address ? <Text style={styles.contactText}>  ·  {personal.address}</Text> : null}
          </View>
          {(personal.linkedin || personal.github || personal.website) ? (
            <View style={styles.contactRow}>
              {personal.linkedin ? <Text style={styles.linkText}>LinkedIn: {personal.linkedin}</Text> : null}
              {personal.github ? <Text style={styles.linkText}>  ·  GitHub: {personal.github}</Text> : null}
              {personal.website ? <Link src={personal.website} style={styles.linkText}>{personal.website}</Link> : null}
            </View>
          ) : null}
        </View>

        {/* Summary */}
        {summary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{lbl.summary}</Text>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        ) : null}

        {/* Experience */}
        {experience.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{lbl.experience}</Text>
            {experience.map((exp, i) => (
              <View key={i} style={{ marginBottom: 10 }}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" }}>
                      <Text style={styles.itemTitle}>{exp.title}</Text>
                      {exp.company ? <Text style={styles.itemSub}> — {exp.company}</Text> : null}
                    </View>
                  </View>
                  {dateRange(exp.start_date, exp.end_date) ? <Text style={styles.dateText}>{dateRange(exp.start_date, exp.end_date)}</Text> : null}
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

        {/* Education */}
        {education.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{lbl.education}</Text>
            {education.map((edu, i) => (
              <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 7 }}>
                <View style={{ flex: 1, flexDirection: "column" }}>
                  <Text style={{ fontSize: 10, fontWeight: 700, color: "#111827" }}>{edu.degree}</Text>
                  {edu.institution ? (
                    <Text style={{ fontSize: 9.5, color: "#6b7280", marginTop: 1 }}>
                      {edu.institution}{edu.gpa ? `  ·  ${lbl.gpa}: ${edu.gpa}` : ""}
                    </Text>
                  ) : null}
                </View>
                {dateRange(edu.start_date, edu.end_date) ? <Text style={styles.dateText}>{dateRange(edu.start_date, edu.end_date)}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* Skills */}
        {(skills.technical.length > 0 || skills.soft.length > 0) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{lbl.skills}</Text>
            {skills.technical.length > 0 ? (
              <View style={styles.skillRow}>
                <Text style={styles.skillLabel}>{lbl.technicalSkills}:</Text>
                <Text style={styles.skillValue}>{skills.technical.join("  ·  ")}</Text>
              </View>
            ) : null}
            {skills.soft.length > 0 ? (
              <View style={styles.skillRow}>
                <Text style={styles.skillLabel}>{lbl.softSkills}:</Text>
                <Text style={styles.skillValue}>{skills.soft.join("  ·  ")}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Projects */}
        {projects && projects.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{lbl.projects}</Text>
            {projects.map((proj, i) => (
              <View key={i} style={{ marginBottom: 10 }}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" }}>
                      <Text style={styles.itemTitle}>{proj.name}</Text>
                      {proj.role ? <Text style={styles.itemSub}>  ·  {proj.role}</Text> : null}
                    </View>
                    {proj.technologies && proj.technologies.length > 0 ? <Text style={styles.techText}>{proj.technologies.join("  ·  ")}</Text> : null}
                  </View>
                  {dateRange(proj.start_date, proj.end_date) ? <Text style={styles.dateText}>{dateRange(proj.start_date, proj.end_date)}</Text> : null}
                </View>
                {proj.link ? <Link src={proj.link} style={styles.linkText}>↗ {lbl.viewProject}: {proj.link}</Link> : null}
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

        {/* Certifications */}
        {certifications && certifications.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{lbl.certifications}</Text>
            {certifications.map((cert, i) => (
              <View key={i} style={{ marginBottom: 7, flexDirection: "column" }}>
                <Text style={{ fontSize: 10, fontWeight: 700, color: "#111827" }}>{cert.name}</Text>
                <Text style={styles.certOrg}>{cert.organization}{cert.issue_date ? `  ·  ${cert.issue_date}` : ""}</Text>
                {cert.credential_url ? <Link src={cert.credential_url} style={styles.linkText}>↗ {lbl.viewProject}</Link> : null}
              </View>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
