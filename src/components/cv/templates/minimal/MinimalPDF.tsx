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

export default function MinimalPDF({ data, language = "vi", colorTheme = "blue" }: Props) {
  const c = COLOR_THEMES[colorTheme];
  const lbl = SECTION_LABELS[language];
  const { personal, summary, experience, education, skills, projects, certifications } = data;

  const styles = StyleSheet.create({
    page: { fontFamily: "Roboto", fontSize: 9.5, backgroundColor: "#fff", padding: "36pt 44pt", color: "#1a1a1a" },
    headerName: { fontSize: 20, fontWeight: 400, color: "#1a1a1a", marginBottom: 5, letterSpacing: -0.5 },
    contactRow: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
    contactItem: { fontSize: 9, color: "#6b7280" },
    divider: { height: 0.8, backgroundColor: "#1a1a1a", marginTop: 14, marginBottom: 16 },
    sectionContainer: { marginBottom: 16 },
    sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 7 },
    sectionTitle: { fontSize: 8.5, fontWeight: 700, color: c.primary, textTransform: "uppercase", letterSpacing: 1 },
    sectionLine: { flex: 1, height: 0.4, backgroundColor: "#d1d5db", marginLeft: 10 },
    itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    itemTitle: { fontSize: 10, fontWeight: 700, color: "#1a1a1a" },
    itemSub: { fontSize: 9.5, color: "#6b7280" },
    dateText: { fontSize: 9, color: "#9ca3af", flexShrink: 0 },
    summaryText: { fontSize: 9.5, color: "#374151", lineHeight: 1.65 },
    bulletList: { marginTop: 3 },
    bulletItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 2.5 },
    dashText: { fontSize: 9, color: c.primary, marginRight: 6, marginTop: 1 },
    bulletText: { fontSize: 9, color: "#374151", flex: 1, lineHeight: 1.5 },
    skillRow: { flexDirection: "row", marginBottom: 4 },
    skillLabel: { fontSize: 9, fontWeight: 700, color: "#1a1a1a", marginRight: 4, minWidth: 90 },
    skillValue: { fontSize: 9, color: "#6b7280", flex: 1 },
    techText: { fontSize: 8.5, color: "#9ca3af", marginTop: 1 },
    linkText: { fontSize: 9, color: c.primary },
    itemBlock: { marginBottom: 10 },
    itemGutter: { marginBottom: 7 },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.headerName}>{personal.full_name}</Text>
        <View style={styles.contactRow}>
          {personal.email ? <Text style={styles.contactItem}>{personal.email}</Text> : null}
          {personal.phone ? <Text style={styles.contactItem}>{personal.phone}</Text> : null}
          {personal.address ? <Text style={styles.contactItem}>{personal.address}</Text> : null}
          {personal.linkedin ? <Text style={styles.contactItem}>{personal.linkedin}</Text> : null}
          {personal.github ? <Text style={styles.contactItem}>{personal.github}</Text> : null}
          {personal.website ? <Link src={personal.website} style={styles.linkText}>{personal.website}</Link> : null}
        </View>
        <View style={styles.divider} />

        {/* Summary */}
        {summary ? (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{lbl.summary}</Text>
              <View style={styles.sectionLine} />
            </View>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        ) : null}

        {/* Experience */}
        {experience.length > 0 ? (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{lbl.experience}</Text>
              <View style={styles.sectionLine} />
            </View>
            {experience.map((exp, i) => (
              <View key={i} style={styles.itemBlock}>
                <View style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" }}>
                      <Text style={styles.itemTitle}>{exp.title}</Text>
                      {exp.company ? <Text style={styles.itemSub}>, {exp.company}</Text> : null}
                    </View>
                  </View>
                  {dateRange(exp.start_date, exp.end_date) ? <Text style={styles.dateText}>{dateRange(exp.start_date, exp.end_date)}</Text> : null}
                </View>
                {exp.description ? (
                  <View style={styles.bulletList}>
                    {parseBullets(exp.description).map((line, j) => (
                      <View key={j} style={styles.bulletItem}>
                        <Text style={styles.dashText}>–</Text>
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
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{lbl.education}</Text>
              <View style={styles.sectionLine} />
            </View>
            {education.map((edu, i) => (
              <View key={i} style={{ ...styles.itemRow, marginBottom: 7 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" }}>
                    <Text style={styles.itemTitle}>{edu.degree}</Text>
                    {edu.institution ? <Text style={styles.itemSub}>, {edu.institution}</Text> : null}
                    {edu.gpa ? <Text style={{ fontSize: 9, color: "#9ca3af" }}>  |  {lbl.gpa}: {edu.gpa}</Text> : null}
                  </View>
                </View>
                {dateRange(edu.start_date, edu.end_date) ? <Text style={styles.dateText}>{dateRange(edu.start_date, edu.end_date)}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* Skills */}
        {(skills.technical.length > 0 || skills.soft.length > 0) ? (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{lbl.skills}</Text>
              <View style={styles.sectionLine} />
            </View>
            {skills.technical.length > 0 ? (
              <View style={styles.skillRow}>
                <Text style={styles.skillLabel}>{lbl.technicalSkills}: </Text>
                <Text style={styles.skillValue}>{skills.technical.join(", ")}</Text>
              </View>
            ) : null}
            {skills.soft.length > 0 ? (
              <View style={styles.skillRow}>
                <Text style={styles.skillLabel}>{lbl.softSkills}: </Text>
                <Text style={styles.skillValue}>{skills.soft.join(", ")}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Projects */}
        {projects && projects.length > 0 ? (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{lbl.projects}</Text>
              <View style={styles.sectionLine} />
            </View>
            {projects.map((proj, i) => (
              <View key={i} style={styles.itemBlock}>
                <View style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" }}>
                      <Text style={styles.itemTitle}>{proj.name}</Text>
                      {proj.role ? <Text style={styles.itemSub}>, {proj.role}</Text> : null}
                    </View>
                    {proj.technologies && proj.technologies.length > 0 ? <Text style={styles.techText}>{proj.technologies.join(", ")}</Text> : null}
                  </View>
                  {dateRange(proj.start_date, proj.end_date) ? <Text style={styles.dateText}>{dateRange(proj.start_date, proj.end_date)}</Text> : null}
                </View>
                {proj.link ? <Link src={proj.link} style={styles.linkText}>↗ {lbl.viewProject}</Link> : null}
                {proj.description ? (
                  <View style={styles.bulletList}>
                    {parseBullets(proj.description).map((line, j) => (
                      <View key={j} style={styles.bulletItem}>
                        <Text style={styles.dashText}>–</Text>
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
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{lbl.certifications}</Text>
              <View style={styles.sectionLine} />
            </View>
            {certifications.map((cert, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" }}>
                  <Text style={styles.itemTitle}>{cert.name}</Text>
                  <Text style={styles.itemSub}>, {cert.organization}</Text>
                  {cert.issue_date ? <Text style={{ fontSize: 9, color: "#9ca3af" }}>  ·  {cert.issue_date}</Text> : null}
                </View>
                {cert.credential_url ? <Link src={cert.credential_url} style={styles.linkText}>↗ {lbl.viewProject}</Link> : null}
              </View>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
