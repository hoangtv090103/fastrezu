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

export default function ModernPDF({ data, language = "vi", colorTheme = "blue" }: Props) {
  const c = COLOR_THEMES[colorTheme];
  const lbl = SECTION_LABELS[language];
  const { personal, summary, experience, education, skills, projects, certifications } = data;

  const styles = StyleSheet.create({
    page: { fontFamily: "Roboto", fontSize: 9, backgroundColor: "#fff", flexDirection: "row" },
    sidebar: { width: "30%", backgroundColor: c.primary, padding: "28pt 16pt", color: "#fff" },
    main: { flex: 1, padding: "28pt 22pt" },
    photo: { width: 72, height: 72, borderRadius: 36, alignSelf: "center", marginBottom: 12, borderWidth: 2, borderColor: "rgba(255,255,255,0.5)", borderStyle: "solid" },
    sideName: { fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 8, textAlign: "center" },
    sideSectionTitle: { fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 },
    sideDivider: { borderTopWidth: 0.8, borderTopColor: "rgba(255,255,255,0.25)", marginTop: 12, paddingTop: 10, marginBottom: 0 },
    sideLabel: { fontSize: 7, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 1 },
    sideValue: { fontSize: 8, color: "#fff", marginBottom: 5 },
    skillDot: { width: 3, height: 3, backgroundColor: "rgba(255,255,255,0.6)", borderRadius: 3, marginRight: 5, marginTop: 3, flexShrink: 0 },
    skillItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 3 },
    skillText: { fontSize: 8, color: "#fff", flex: 1 },
    sectionTitle: { fontSize: 10, fontWeight: 700, color: c.primary, textTransform: "uppercase", letterSpacing: 0.6, borderBottomWidth: 1.5, borderBottomColor: c.primary, paddingBottom: 2, marginBottom: 8 },
    itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    itemTitle: { fontSize: 10, fontWeight: 700, color: "#111827" },
    itemCompany: { fontSize: 9, color: c.primary, fontWeight: 600 },
    dateText: { fontSize: 8, color: "#9ca3af", flexShrink: 0 },
    summaryText: { fontSize: 9, color: "#374151", lineHeight: 1.6 },
    bulletList: { marginTop: 3 },
    bulletItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 2 },
    bullet: { width: 3, height: 3, backgroundColor: c.primary, borderRadius: 3, marginTop: 3, marginRight: 5, flexShrink: 0 },
    bulletText: { fontSize: 8.5, color: "#374151", flex: 1, lineHeight: 1.5 },
    techText: { fontSize: 8, color: "#6b7280", marginTop: 1, marginBottom: 2 },
    itemSection: { marginBottom: 12 },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Sidebar */}
        <View style={styles.sidebar}>
          {personal.photo_url ? (
            <Image src={personal.photo_url} style={styles.photo} />
          ) : null}
          <Text style={styles.sideName}>{personal.full_name}</Text>

          {/* Contact */}
          <View style={styles.sideDivider}>
            <Text style={styles.sideSectionTitle}>Contact</Text>
            {personal.email ? <><Text style={styles.sideLabel}>Email</Text><Text style={styles.sideValue}>{personal.email}</Text></> : null}
            {personal.phone ? <><Text style={styles.sideLabel}>Phone</Text><Text style={styles.sideValue}>{personal.phone}</Text></> : null}
            {personal.address ? <><Text style={styles.sideLabel}>Address</Text><Text style={styles.sideValue}>{personal.address}</Text></> : null}
            {personal.linkedin ? <><Text style={styles.sideLabel}>LinkedIn</Text><Text style={styles.sideValue}>{personal.linkedin}</Text></> : null}
            {personal.github ? <><Text style={styles.sideLabel}>GitHub</Text><Text style={styles.sideValue}>{personal.github}</Text></> : null}
          </View>

          {/* Skills */}
          {(skills.technical.length > 0 || skills.soft.length > 0) ? (
            <View style={styles.sideDivider}>
              <Text style={styles.sideSectionTitle}>{lbl.skills}</Text>
              {skills.technical.length > 0 ? (
                <>
                  <Text style={{ ...styles.sideLabel, marginBottom: 4 }}>{lbl.technicalSkills}</Text>
                  {skills.technical.map((sk, i) => (
                    <View key={i} style={styles.skillItem}>
                      <View style={styles.skillDot} />
                      <Text style={styles.skillText}>{sk}</Text>
                    </View>
                  ))}
                </>
              ) : null}
              {skills.soft.length > 0 ? (
                <>
                  <Text style={{ ...styles.sideLabel, marginTop: 6, marginBottom: 4 }}>{lbl.softSkills}</Text>
                  {skills.soft.map((sk, i) => (
                    <View key={i} style={styles.skillItem}>
                      <View style={styles.skillDot} />
                      <Text style={styles.skillText}>{sk}</Text>
                    </View>
                  ))}
                </>
              ) : null}
            </View>
          ) : null}

          {/* Education */}
          {education.length > 0 ? (
            <View style={styles.sideDivider}>
              <Text style={styles.sideSectionTitle}>{lbl.education}</Text>
              {education.map((edu, i) => (
                <View key={i} style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 9, fontWeight: 700, color: "#fff" }}>{edu.degree}</Text>
                  {edu.institution ? <Text style={styles.sideValue}>{edu.institution}</Text> : null}
                  {dateRange(edu.start_date, edu.end_date) ? <Text style={{ fontSize: 7.5, color: "rgba(255,255,255,0.6)" }}>{dateRange(edu.start_date, edu.end_date)}</Text> : null}
                </View>
              ))}
            </View>
          ) : null}

          {/* Certifications */}
          {certifications && certifications.length > 0 ? (
            <View style={styles.sideDivider}>
              <Text style={styles.sideSectionTitle}>{lbl.certifications}</Text>
              {certifications.map((cert, i) => (
                <View key={i} style={{ marginBottom: 7 }}>
                  <Text style={{ fontSize: 9, fontWeight: 700, color: "#fff" }}>{cert.name}</Text>
                  <Text style={styles.sideValue}>{cert.organization}</Text>
                  {cert.issue_date ? <Text style={{ fontSize: 7.5, color: "rgba(255,255,255,0.6)" }}>{cert.issue_date}</Text> : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* Main */}
        <View style={styles.main}>
          {summary ? (
            <View style={{ marginBottom: 14 }}>
              <Text style={styles.sectionTitle}>{lbl.summary}</Text>
              <Text style={styles.summaryText}>{summary}</Text>
            </View>
          ) : null}

          {experience.length > 0 ? (
            <View style={{ marginBottom: 14 }}>
              <Text style={styles.sectionTitle}>{lbl.experience}</Text>
              {experience.map((exp, i) => (
                <View key={i} style={styles.itemSection}>
                  <View style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" }}>
                        <Text style={styles.itemTitle}>{exp.title}</Text>
                        {exp.company ? <Text style={styles.itemCompany}> @ {exp.company}</Text> : null}
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

          {projects && projects.length > 0 ? (
            <View style={{ marginBottom: 14 }}>
              <Text style={styles.sectionTitle}>{lbl.projects}</Text>
              {projects.map((proj, i) => (
                <View key={i} style={styles.itemSection}>
                  <View style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" }}>
                        <Text style={styles.itemTitle}>{proj.name}</Text>
                        {proj.role ? <Text style={styles.itemCompany}>  ·  {proj.role}</Text> : null}
                      </View>
                      {proj.technologies && proj.technologies.length > 0 ? <Text style={styles.techText}>{proj.technologies.join("  ·  ")}</Text> : null}
                    </View>
                    {dateRange(proj.start_date, proj.end_date) ? <Text style={styles.dateText}>{dateRange(proj.start_date, proj.end_date)}</Text> : null}
                  </View>
                  {proj.link ? <Link src={proj.link} style={{ fontSize: 8, color: c.primary }}>↗ {lbl.viewProject}</Link> : null}
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
        </View>
      </Page>
    </Document>
  );
}
