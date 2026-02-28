"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet, Link, Font, Image } from "@react-pdf/renderer";
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

export default function CreativePDF({ data, language = "vi", colorTheme = "blue" }: Props) {
  const c = COLOR_THEMES[colorTheme];
  const lbl = SECTION_LABELS[language];
  const { personal, summary, experience, education, skills, projects, certifications } = data;

  const styles = StyleSheet.create({
    page: { fontFamily: "Roboto", fontSize: 9.5, backgroundColor: "#fff" },
    headerBand: { backgroundColor: c.primary, padding: "24pt 38pt 20pt", flexDirection: "row", alignItems: "center" },
    photo: { width: 68, height: 68, borderRadius: 34, marginRight: 18, borderWidth: 3, borderColor: "rgba(255,255,255,0.45)", borderStyle: "solid" },
    headerName: { fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 5 },
    contactRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    contactItem: { fontSize: 8, color: "rgba(255,255,255,0.85)" },
    accentBar: { height: 4, backgroundColor: c.dark },
    body: { padding: "20pt 38pt" },
    sectionContainer: { marginBottom: 14 },
    sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 9 },
    sectionDot: { width: 8, height: 8, backgroundColor: c.primary, borderRadius: 4, marginRight: 7 },
    sectionTitle: { fontSize: 10, fontWeight: 700, color: c.primary, textTransform: "uppercase", letterSpacing: 0.6 },
    sectionLine: { flex: 1, height: 1.5, backgroundColor: c.light, marginLeft: 8 },
    itemBlock: { marginBottom: 12, paddingLeft: 10, borderLeftWidth: 2.5, borderLeftColor: c.light },
    itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    itemTitle: { fontSize: 10, fontWeight: 700, color: "#111827" },
    itemSub: { fontSize: 9, color: c.primary, fontWeight: 600 },
    datePill: { fontSize: 8, color: "#fff", backgroundColor: c.primary, padding: "1pt 6pt", borderRadius: 10 },
    summaryText: { fontSize: 9.5, color: "#374151", lineHeight: 1.65 },
    bulletList: { marginTop: 3 },
    bulletItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 2.5 },
    bullet: { width: 4, height: 4, backgroundColor: c.primary, borderRadius: 4, marginTop: 3, marginRight: 6, flexShrink: 0 },
    bulletText: { fontSize: 9, color: "#374151", flex: 1, lineHeight: 1.5 },
    skillPill: { fontSize: 8, color: c.primary, backgroundColor: c.light, padding: "2pt 7pt", borderRadius: 10, marginRight: 4, marginBottom: 3 },
    softPill: { fontSize: 8, color: "#6b7280", backgroundColor: "#f3f4f6", padding: "2pt 7pt", borderRadius: 10, marginRight: 4, marginBottom: 3 },
    skillLabel: { fontSize: 8.5, fontWeight: 700, color: "#374151", marginBottom: 4 },
    pillRow: { flexDirection: "row", flexWrap: "wrap" },
    techText: { fontSize: 8, color: "#6b7280", marginTop: 2, marginBottom: 3 },
    linkText: { fontSize: 8.5, color: c.primary },
    itemSub2: { fontSize: 9, color: "#6b7280" },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerBand}>
          {personal.photo_url ? <Image src={personal.photo_url} style={styles.photo} /> : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.headerName}>{personal.full_name}</Text>
            <View style={styles.contactRow}>
              {personal.email ? <Text style={styles.contactItem}>{personal.email}</Text> : null}
              {personal.phone ? <Text style={styles.contactItem}>·  {personal.phone}</Text> : null}
              {personal.address ? <Text style={styles.contactItem}>·  {personal.address}</Text> : null}
              {personal.linkedin ? <Text style={styles.contactItem}>·  {personal.linkedin}</Text> : null}
              {personal.github ? <Text style={styles.contactItem}>·  {personal.github}</Text> : null}
            </View>
          </View>
        </View>
        <View style={styles.accentBar} />

        <View style={styles.body}>
          {/* Summary */}
          {summary ? (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionDot} />
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
                <View style={styles.sectionDot} />
                <Text style={styles.sectionTitle}>{lbl.experience}</Text>
                <View style={styles.sectionLine} />
              </View>
              {experience.map((exp, i) => (
                <View key={i} style={styles.itemBlock}>
                  <View style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" }}>
                        <Text style={styles.itemTitle}>{exp.title}</Text>
                        {exp.company ? <Text style={styles.itemSub}> • {exp.company}</Text> : null}
                      </View>
                    </View>
                    {dateRange(exp.start_date, exp.end_date) ? <Text style={styles.datePill}>{dateRange(exp.start_date, exp.end_date)}</Text> : null}
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
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionDot} />
                <Text style={styles.sectionTitle}>{lbl.education}</Text>
                <View style={styles.sectionLine} />
              </View>
              {education.map((edu, i) => (
                <View key={i} style={{ ...styles.itemRow, marginBottom: 7 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{edu.degree}</Text>
                    {edu.institution ? <Text style={styles.itemSub2}>{edu.institution}{edu.gpa ? `  ·  ${lbl.gpa}: ${edu.gpa}` : ""}</Text> : null}
                  </View>
                  {dateRange(edu.start_date, edu.end_date) ? <Text style={styles.datePill}>{dateRange(edu.start_date, edu.end_date)}</Text> : null}
                </View>
              ))}
            </View>
          ) : null}

          {/* Skills */}
          {(skills.technical.length > 0 || skills.soft.length > 0) ? (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionDot} />
                <Text style={styles.sectionTitle}>{lbl.skills}</Text>
                <View style={styles.sectionLine} />
              </View>
              {skills.technical.length > 0 ? (
                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.skillLabel}>{lbl.technicalSkills}</Text>
                  <View style={styles.pillRow}>
                    {skills.technical.map((sk, i) => <Text key={i} style={styles.skillPill}>{sk}</Text>)}
                  </View>
                </View>
              ) : null}
              {skills.soft.length > 0 ? (
                <View>
                  <Text style={styles.skillLabel}>{lbl.softSkills}</Text>
                  <View style={styles.pillRow}>
                    {skills.soft.map((sk, i) => <Text key={i} style={styles.softPill}>{sk}</Text>)}
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Projects */}
          {projects && projects.length > 0 ? (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionDot} />
                <Text style={styles.sectionTitle}>{lbl.projects}</Text>
                <View style={styles.sectionLine} />
              </View>
              {projects.map((proj, i) => (
                <View key={i} style={styles.itemBlock}>
                  <View style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" }}>
                        <Text style={styles.itemTitle}>{proj.name}</Text>
                        {proj.role ? <Text style={styles.itemSub2}>  ·  {proj.role}</Text> : null}
                      </View>
                      {proj.technologies && proj.technologies.length > 0 ? <Text style={styles.techText}>{proj.technologies.join("  ·  ")}</Text> : null}
                    </View>
                    {dateRange(proj.start_date, proj.end_date) ? <Text style={styles.datePill}>{dateRange(proj.start_date, proj.end_date)}</Text> : null}
                  </View>
                  {proj.link ? <Link src={proj.link} style={styles.linkText}>↗ {lbl.viewProject}</Link> : null}
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
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionDot} />
                <Text style={styles.sectionTitle}>{lbl.certifications}</Text>
                <View style={styles.sectionLine} />
              </View>
              {certifications.map((cert, i) => (
                <View key={i} style={{ marginBottom: 7 }}>
                  <Text style={styles.itemTitle}>{cert.name}</Text>
                  <Text style={styles.itemSub2}>{cert.organization}{cert.issue_date ? `  ·  ${cert.issue_date}` : ""}</Text>
                  {cert.credential_url ? <Link src={cert.credential_url} style={styles.linkText}>↗ {lbl.viewProject}</Link> : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </Page>
    </Document>
  );
}
