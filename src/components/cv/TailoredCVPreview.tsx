"use client";

// ── Types ─────────────────────────────────────────────────────────────────
export interface TailoredResumeData {
  personal: {
    full_name: string;
    email: string;
    phone: string;
    linkedin?: string | null;
    github?: string | null;
    website?: string | null;
    address?: string | null;
  };
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    start_date: string;
    end_date: string;
    description: string; // bullet points, separated by \n, each starting with •
  }>;
  education: Array<{
    degree: string;
    institution: string;
    start_date?: string | null;
    end_date?: string | null;
    gpa?: string | null;
  }>;
  skills: {
    technical: string[];
    soft: string[];
  };
  projects?: Array<{
    name: string;
    role?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    technologies?: string[];
    link?: string | null;
    description: string;
  }>;
  certifications?: Array<{
    name: string;
    organization: string;
    issue_date?: string | null;
    expiry_date?: string | null;
    credential_url?: string | null;
  }>;
  tailoring_notes?: {
    keywords_integrated: string[];
    sections_prioritized: string[];
    estimated_match_score: number;
  };
}

interface TailoredCVPreviewProps {
  data: TailoredResumeData;
  language?: "vi" | "en";
}

// ── Section header ─────────────────────────────────────────────────────────
function SectionHeading({ title }: { title: string }) {
  return (
    <h2
      style={{
        fontSize: "11pt",
        fontWeight: "700",
        color: "#2563eb",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        borderBottom: "2px solid #2563eb",
        paddingBottom: "3px",
        marginBottom: "10px",
        marginTop: "16px",
      }}
    >
      {title}
    </h2>
  );
}

// ── Bullet list from description string ────────────────────────────────────
function BulletList({ text }: { text: string }) {
  const lines = text
    .split("\n")
    .map((l) => l.replace(/^[•\-]\s*/, "").trim())
    .filter(Boolean);

  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
      {lines.map((line, i) => (
        <li
          key={i}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "6px",
            marginBottom: "3px",
            fontSize: "10pt",
            color: "#374151",
            lineHeight: "1.55",
          }}
        >
          <span
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: "#2563eb",
              marginTop: "6px",
              flexShrink: 0,
            }}
          />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

// ── Date range helper ───────────────────────────────────────────────────────
function dateRange(start?: string | null, end?: string | null): string {
  const s = start?.trim() || "";
  const e = end?.trim() || "";
  if (s && e) return `${s} – ${e}`;
  return s || e;
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function TailoredCVPreview({
  data,
  language = "vi",
}: TailoredCVPreviewProps) {
  const labels =
    language === "vi"
      ? {
          summary: "Tóm tắt nghề nghiệp",
          experience: "Kinh nghiệm làm việc",
          education: "Học vấn",
          skills: "Kỹ năng",
          technicalSkills: "Kỹ năng chuyên môn",
          softSkills: "Kỹ năng mềm",
          projects: "Dự án",
          certifications: "Chứng chỉ",
          viewProject: "Xem dự án",
          present: "Hiện tại",
          gpa: "GPA",
        }
      : {
          summary: "Professional Summary",
          experience: "Work Experience",
          education: "Education",
          skills: "Skills",
          technicalSkills: "Technical Skills",
          softSkills: "Soft Skills",
          projects: "Projects",
          certifications: "Certifications",
          viewProject: "View project",
          present: "Present",
          gpa: "GPA",
        };

  const { personal, summary, experience, education, skills, projects, certifications } = data;

  return (
    <div
      id="tailored-cv-page"
      style={{
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: "#fff",
        color: "#111827",
        padding: "32px 40px",
        width: "100%",
        maxWidth: "794px", // A4 width px at 96dpi
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          textAlign: "center",
          borderBottom: "2px solid #2563eb",
          paddingBottom: "16px",
          marginBottom: "4px",
        }}
      >
        <h1
          style={{
            fontSize: "20pt",
            fontWeight: "700",
            color: "#111827",
            margin: "0 0 8px",
            letterSpacing: "-0.5px",
          }}
        >
          {personal.full_name}
        </h1>

        {/* Contact row */}
        <div
          style={{
            fontSize: "9.5pt",
            color: "#6b7280",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "12px",
            lineHeight: "1.4",
          }}
        >
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && <span>{personal.phone}</span>}
          {personal.address && <span>{personal.address}</span>}
        </div>

        {/* Links row */}
        {(personal.linkedin || personal.github || personal.website) && (
          <div
            style={{
              fontSize: "9.5pt",
              color: "#2563eb",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "12px",
              marginTop: "4px",
            }}
          >
            {personal.linkedin && <span>LinkedIn: {personal.linkedin}</span>}
            {personal.github && <span>GitHub: {personal.github}</span>}
            {personal.website && <span>{personal.website}</span>}
          </div>
        )}
      </div>

      {/* ── Summary ── */}
      {summary && (
        <div>
          <SectionHeading title={labels.summary} />
          <p
            style={{
              fontSize: "10.5pt",
              color: "#374151",
              lineHeight: "1.6",
              margin: 0,
            }}
          >
            {summary}
          </p>
        </div>
      )}

      {/* ── Experience ── */}
      {experience.length > 0 && (
        <div>
          <SectionHeading title={labels.experience} />
          {experience.map((exp, i) => (
            <div
              key={i}
              style={{
                marginBottom: "12px",
                paddingBottom: i < experience.length - 1 ? "10px" : 0,
                borderBottom:
                  i < experience.length - 1 ? "1px solid #f3f4f6" : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "4px",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "11pt",
                      fontWeight: "700",
                      color: "#111827",
                    }}
                  >
                    {exp.title}
                  </span>
                  {exp.company && (
                    <span
                      style={{ fontSize: "10.5pt", color: "#6b7280" }}
                    >
                      {" "}— {exp.company}
                    </span>
                  )}
                </div>
                {dateRange(exp.start_date, exp.end_date) && (
                  <span
                    style={{
                      fontSize: "9.5pt",
                      color: "#9ca3af",
                      whiteSpace: "nowrap",
                      marginLeft: "8px",
                      flexShrink: 0,
                    }}
                  >
                    {dateRange(exp.start_date, exp.end_date)}
                  </span>
                )}
              </div>
              {exp.description && <BulletList text={exp.description} />}
            </div>
          ))}
        </div>
      )}

      {/* ── Education ── */}
      {education.length > 0 && (
        <div>
          <SectionHeading title={labels.education} />
          {education.map((edu, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "8px",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "10.5pt",
                    fontWeight: "700",
                    color: "#111827",
                  }}
                >
                  {edu.degree}
                </span>
                {edu.institution && (
                  <span
                    style={{
                      fontSize: "10pt",
                      color: "#6b7280",
                      display: "block",
                    }}
                  >
                    {edu.institution}
                    {edu.gpa ? ` · ${labels.gpa}: ${edu.gpa}` : ""}
                  </span>
                )}
              </div>
              {dateRange(edu.start_date, edu.end_date) && (
                <span
                  style={{
                    fontSize: "9.5pt",
                    color: "#9ca3af",
                    whiteSpace: "nowrap",
                    marginLeft: "8px",
                    flexShrink: 0,
                  }}
                >
                  {dateRange(edu.start_date, edu.end_date)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Skills ── */}
      {(skills.technical.length > 0 || skills.soft.length > 0) && (
        <div>
          <SectionHeading title={labels.skills} />
          {skills.technical.length > 0 && (
            <div style={{ marginBottom: "6px" }}>
              <span
                style={{
                  fontSize: "10pt",
                  fontWeight: "600",
                  color: "#374151",
                }}
              >
                {labels.technicalSkills}:{" "}
              </span>
              <span style={{ fontSize: "10pt", color: "#6b7280" }}>
                {skills.technical.join(" · ")}
              </span>
            </div>
          )}
          {skills.soft.length > 0 && (
            <div>
              <span
                style={{
                  fontSize: "10pt",
                  fontWeight: "600",
                  color: "#374151",
                }}
              >
                {labels.softSkills}:{" "}
              </span>
              <span style={{ fontSize: "10pt", color: "#6b7280" }}>
                {skills.soft.join(" · ")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Projects ── */}
      {projects && projects.length > 0 && (
        <div>
          <SectionHeading title={labels.projects} />
          {projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: "10px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "3px",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "10.5pt",
                      fontWeight: "700",
                      color: "#111827",
                    }}
                  >
                    {proj.name}
                  </span>
                  {proj.role && (
                    <span style={{ fontSize: "10pt", color: "#6b7280" }}>
                      {" "}· {proj.role}
                    </span>
                  )}
                  {proj.link && (
                    <a
                      href={proj.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "9.5pt",
                        color: "#2563eb",
                        marginLeft: "8px",
                        textDecoration: "none",
                      }}
                    >
                      ↗ {labels.viewProject}
                    </a>
                  )}
                </div>
                {dateRange(proj.start_date, proj.end_date) && (
                  <span
                    style={{
                      fontSize: "9.5pt",
                      color: "#9ca3af",
                      whiteSpace: "nowrap",
                      marginLeft: "8px",
                      flexShrink: 0,
                    }}
                  >
                    {dateRange(proj.start_date, proj.end_date)}
                  </span>
                )}
              </div>
              {proj.technologies && proj.technologies.length > 0 && (
                <p
                  style={{
                    fontSize: "9.5pt",
                    color: "#6b7280",
                    margin: "0 0 3px",
                  }}
                >
                  {proj.technologies.join(" · ")}
                </p>
              )}
              {proj.description && <BulletList text={proj.description} />}
            </div>
          ))}
        </div>
      )}

      {/* ── Certifications ── */}
      {certifications && certifications.length > 0 && (
        <div>
          <SectionHeading title={labels.certifications} />
          {certifications.map((cert, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "6px",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "10.5pt",
                    fontWeight: "700",
                    color: "#111827",
                  }}
                >
                  {cert.name}
                </span>
                <span
                  style={{
                    fontSize: "10pt",
                    color: "#6b7280",
                    display: "block",
                  }}
                >
                  {cert.organization}
                  {cert.issue_date ? ` · ${cert.issue_date}` : ""}
                </span>
                {cert.credential_url && (
                  <a
                    href={cert.credential_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "9.5pt", color: "#2563eb" }}
                  >
                    ↗ {labels.viewProject}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
