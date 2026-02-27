import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import OpenAI from "openai";

// ── Output types (match vault section schemas exactly) ────────────────────────

export interface ExtractedPersonal {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  linkedin: string;
  github: string;
  portfolio: string;
}

export interface ExtractedExperienceItem {
  id: string;
  company: string;
  title: string;
  start_date: string; // "MM/YYYY"
  end_date: string;   // "MM/YYYY" or ""
  is_current: boolean;
  description: string;
}

export interface ExtractedEducationItem {
  id: string;
  school: string;
  degree: string;
  major: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  gpa: string;
  description: string;
}

export interface ExtractedSkills {
  hard_skills: string[];
  soft_skills: string[];
}

export interface ExtractedCertificationItem {
  id: string;
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date: string;
  has_expiry: boolean;
  credential_id: string;
  credential_url: string;
}

export interface ExtractedProjectItem {
  id: string;
  name: string;
  role: string;
  start_date: string; // "MM/YYYY"
  end_date: string;   // "MM/YYYY" or "" if is_ongoing
  is_ongoing: boolean;
  technologies: string[];
  demo_url: string;
  description: string;
}

export interface ExtractedAwardItem {
  id: string;
  name: string;
  issuer: string;
  year: string; // plain year e.g. "2023"
  description: string;
}

export interface ExtractedVolunteerItem {
  id: string;
  activity: string;
  organization: string;
  role: string;
  start_date: string; // "MM/YYYY"
  end_date: string;   // "MM/YYYY" or "" if is_ongoing
  is_ongoing: boolean;
  description: string;
}

export interface ExtractedPublicationItem {
  id: string;
  title: string;
  publisher: string;
  year: string; // plain year e.g. "2023"
  doi_url: string;
}

export interface ExtractedReferenceItem {
  id: string;
  name: string;
  title: string;
  organization: string;
  email: string;
  phone: string;
  relationship: string;
}

export interface ExtractedProfile {
  personal: ExtractedPersonal | null;
  summary: { content: string } | null;
  experience: { items: ExtractedExperienceItem[] } | null;
  education: { items: ExtractedEducationItem[] } | null;
  skills: ExtractedSkills | null;
  certifications: { items: ExtractedCertificationItem[] } | null;
  projects: { items: ExtractedProjectItem[] } | null;
  awards: { items: ExtractedAwardItem[] } | null;
  volunteering: { items: ExtractedVolunteerItem[] } | null;
  hobbies: { items: string[] } | null;
  references: { items: ExtractedReferenceItem[] } | null;
  publications: { items: ExtractedPublicationItem[] } | null;
}

// ── System Prompts (bilingual) ────────────────────────────────────────────────

const EXTRACT_PROFILE_PROMPT: Record<"vi" | "en", string> = {
  vi: `Bạn là chuyên gia phân tích CV. Nhiệm vụ là trích xuất thông tin có cấu trúc từ CV được cung cấp (dạng văn bản hoặc hình ảnh trang).

Trả về JSON hợp lệ CHÍNH XÁC theo schema sau. Trả về null cho bất kỳ section nào không tìm thấy trong CV (không bỏ qua key).

QUAN TRỌNG — Quy tắc về id: Đặt tất cả các trường id thành chuỗi rỗng "" (hệ thống sẽ tự tạo UUID thực).
QUAN TRỌNG — Quy tắc về ngày tháng: Dùng định dạng "MM/YYYY" (ví dụ "06/2023"). Nếu chỉ có năm thì dùng "01/YYYY". Nếu không rõ thì dùng "".

{
  "personal": {
    "full_name": "<họ tên đầy đủ hoặc rỗng>",
    "email": "<email hoặc rỗng>",
    "phone": "<số điện thoại hoặc rỗng>",
    "address": "<địa chỉ/thành phố hoặc rỗng>",
    "linkedin": "<URL LinkedIn hoặc rỗng>",
    "github": "<URL GitHub hoặc rỗng>",
    "portfolio": "<URL website/portfolio hoặc rỗng>"
  } | null,

  "summary": {
    "content": "<toàn bộ nội dung phần tóm tắt/mục tiêu nghề nghiệp>"
  } | null,

  "experience": {
    "items": [
      {
        "id": "",
        "company": "<tên công ty>",
        "title": "<chức danh>",
        "start_date": "<MM/YYYY>",
        "end_date": "<MM/YYYY hoặc rỗng nếu is_current>",
        "is_current": <true nếu đang làm>,
        "description": "<toàn bộ mô tả công việc, bảo tồn dấu xuống dòng>"
      }
    ]
  } | null,

  "education": {
    "items": [
      {
        "id": "",
        "school": "<tên trường>",
        "degree": "<bằng cấp, ví dụ: Cử nhân, Thạc sĩ>",
        "major": "<chuyên ngành>",
        "start_date": "<MM/YYYY>",
        "end_date": "<MM/YYYY hoặc rỗng nếu is_current>",
        "is_current": <true nếu đang học>,
        "gpa": "<GPA hoặc rỗng>",
        "description": "<mô tả thêm hoặc rỗng>"
      }
    ]
  } | null,

  "skills": {
    "hard_skills": ["<kỹ năng kỹ thuật>"],
    "soft_skills": ["<kỹ năng mềm>"]
  } | null,

  "certifications": {
    "items": [
      {
        "id": "",
        "name": "<tên chứng chỉ>",
        "issuer": "<tổ chức cấp>",
        "issue_date": "<MM/YYYY hoặc rỗng>",
        "expiry_date": "<MM/YYYY hoặc rỗng>",
        "has_expiry": <true nếu có ngày hết hạn>,
        "credential_id": "<mã chứng chỉ hoặc rỗng>",
        "credential_url": "<URL xác thực hoặc rỗng>"
      }
    ]
  } | null,

  "projects": {
    "items": [
      {
        "id": "",
        "name": "<tên dự án>",
        "role": "<vai trò của bạn trong dự án hoặc rỗng>",
        "start_date": "<MM/YYYY hoặc rỗng>",
        "end_date": "<MM/YYYY hoặc rỗng nếu is_ongoing>",
        "is_ongoing": <true nếu dự án đang thực hiện>,
        "technologies": ["<công nghệ sử dụng>"],
        "demo_url": "<URL demo/GitHub hoặc rỗng>",
        "description": "<mô tả dự án, bảo tồn dấu xuống dòng>"
      }
    ]
  } | null,

  "awards": {
    "items": [
      {
        "id": "",
        "name": "<tên giải thưởng>",
        "issuer": "<tổ chức trao giải hoặc rỗng>",
        "year": "<năm nhận giải, ví dụ: 2023, hoặc rỗng>",
        "description": "<mô tả hoặc rỗng>"
      }
    ]
  } | null,

  "volunteering": {
    "items": [
      {
        "id": "",
        "activity": "<tên hoạt động tình nguyện>",
        "organization": "<tổ chức hoặc rỗng>",
        "role": "<vai trò hoặc rỗng>",
        "start_date": "<MM/YYYY hoặc rỗng>",
        "end_date": "<MM/YYYY hoặc rỗng nếu is_ongoing>",
        "is_ongoing": <true nếu đang tham gia>,
        "description": "<mô tả hoặc rỗng>"
      }
    ]
  } | null,

  "hobbies": {
    "items": ["<sở thích dạng chuỗi ngắn gọn>"]
  } | null,

  "references": {
    "items": [
      {
        "id": "",
        "name": "<họ tên người tham chiếu>",
        "title": "<chức danh hoặc rỗng>",
        "organization": "<tổ chức hoặc rỗng>",
        "email": "<email hoặc rỗng>",
        "phone": "<số điện thoại hoặc rỗng>",
        "relationship": "<quan hệ, ví dụ: Quản lý trực tiếp, hoặc rỗng>"
      }
    ]
  } | null,

  "publications": {
    "items": [
      {
        "id": "",
        "title": "<tiêu đề bài báo/nghiên cứu>",
        "publisher": "<nhà xuất bản/tạp chí hoặc rỗng>",
        "year": "<năm xuất bản, ví dụ: 2023, hoặc rỗng>",
        "doi_url": "<URL DOI hoặc liên kết hoặc rỗng>"
      }
    ]
  } | null
}`,

  en: `You are a CV analysis expert. Your task is to extract structured information from the provided CV (as text and/or page images).

Return ONLY valid JSON matching the exact schema below. Return null for any section not found in the CV (do not omit the key).

IMPORTANT — id rule: Set all id fields to empty string "" (the system will generate real UUIDs).
IMPORTANT — date rule: Use "MM/YYYY" format (e.g. "06/2023"). If only year is known, use "01/YYYY". If unknown, use "".

{
  "personal": {
    "full_name": "<full name or empty>",
    "email": "<email or empty>",
    "phone": "<phone number or empty>",
    "address": "<address/city or empty>",
    "linkedin": "<LinkedIn URL or empty>",
    "github": "<GitHub URL or empty>",
    "portfolio": "<website/portfolio URL or empty>"
  } | null,

  "summary": {
    "content": "<full text of summary/objective section>"
  } | null,

  "experience": {
    "items": [
      {
        "id": "",
        "company": "<company name>",
        "title": "<job title>",
        "start_date": "<MM/YYYY>",
        "end_date": "<MM/YYYY or empty if is_current>",
        "is_current": <true if still employed>,
        "description": "<full job description preserving line breaks>"
      }
    ]
  } | null,

  "education": {
    "items": [
      {
        "id": "",
        "school": "<school name>",
        "degree": "<degree, e.g. Bachelor, Master>",
        "major": "<field of study>",
        "start_date": "<MM/YYYY>",
        "end_date": "<MM/YYYY or empty if is_current>",
        "is_current": <true if currently enrolled>,
        "gpa": "<GPA or empty>",
        "description": "<additional description or empty>"
      }
    ]
  } | null,

  "skills": {
    "hard_skills": ["<technical skill>"],
    "soft_skills": ["<soft skill>"]
  } | null,

  "certifications": {
    "items": [
      {
        "id": "",
        "name": "<certificate name>",
        "issuer": "<issuing organisation>",
        "issue_date": "<MM/YYYY or empty>",
        "expiry_date": "<MM/YYYY or empty>",
        "has_expiry": <true if has expiry date>,
        "credential_id": "<credential ID or empty>",
        "credential_url": "<verification URL or empty>"
      }
    ]
  } | null,

  "projects": {
    "items": [
      {
        "id": "",
        "name": "<project name>",
        "role": "<your role in the project or empty>",
        "start_date": "<MM/YYYY or empty>",
        "end_date": "<MM/YYYY or empty if is_ongoing>",
        "is_ongoing": <true if currently active>,
        "technologies": ["<technology used>"],
        "demo_url": "<demo/GitHub URL or empty>",
        "description": "<project description preserving line breaks>"
      }
    ]
  } | null,

  "awards": {
    "items": [
      {
        "id": "",
        "name": "<award name>",
        "issuer": "<awarding organisation or empty>",
        "year": "<year received e.g. 2023, or empty>",
        "description": "<description or empty>"
      }
    ]
  } | null,

  "volunteering": {
    "items": [
      {
        "id": "",
        "activity": "<volunteer activity name>",
        "organization": "<organisation or empty>",
        "role": "<role or empty>",
        "start_date": "<MM/YYYY or empty>",
        "end_date": "<MM/YYYY or empty if is_ongoing>",
        "is_ongoing": <true if currently participating>,
        "description": "<description or empty>"
      }
    ]
  } | null,

  "hobbies": {
    "items": ["<hobby as a short string>"]
  } | null,

  "references": {
    "items": [
      {
        "id": "",
        "name": "<reference full name>",
        "title": "<job title or empty>",
        "organization": "<organisation or empty>",
        "email": "<email or empty>",
        "phone": "<phone number or empty>",
        "relationship": "<relationship e.g. Direct Manager, or empty>"
      }
    ]
  } | null,

  "publications": {
    "items": [
      {
        "id": "",
        "title": "<paper/research title>",
        "publisher": "<publisher/journal or empty>",
        "year": "<publication year e.g. 2023, or empty>",
        "doi_url": "<DOI URL or link or empty>"
      }
    ]
  } | null
}`,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Replace placeholder id "" with a real UUID in every items array */
function injectIds(profile: ExtractedProfile): ExtractedProfile {
  const assignId = <T extends { id: string }>(item: T): T => ({
    ...item,
    id: crypto.randomUUID(),
  });

  return {
    ...profile,
    experience: profile.experience
      ? { items: profile.experience.items.map(assignId) }
      : null,
    education: profile.education
      ? { items: profile.education.items.map(assignId) }
      : null,
    certifications: profile.certifications
      ? { items: profile.certifications.items.map(assignId) }
      : null,
    projects: profile.projects
      ? { items: profile.projects.items.map(assignId) }
      : null,
    awards: profile.awards
      ? { items: profile.awards.items.map(assignId) }
      : null,
    volunteering: profile.volunteering
      ? { items: profile.volunteering.items.map(assignId) }
      : null,
    references: profile.references
      ? { items: profile.references.items.map(assignId) }
      : null,
    publications: profile.publications
      ? { items: profile.publications.items.map(assignId) }
      : null,
    // hobbies: items are plain strings — no id injection needed
  };
}

// ── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const {
      pageImages,
      extractedText,
      fileType,
      locale = "vi",
    } = body as {
      pageImages: string[];
      extractedText: string;
      fileType: "pdf" | "docx";
      locale?: "vi" | "en";
    };

    if (!extractedText && (!pageImages || pageImages.length === 0)) {
      return NextResponse.json(
        { error: "At least one of pageImages or extractedText is required" },
        { status: 400 },
      );
    }

    const systemPrompt = EXTRACT_PROFILE_PROMPT[locale] ?? EXTRACT_PROFILE_PROMPT.vi;
    const today = new Date().toISOString().split("T")[0];
    const systemPromptWithDate = `Today's date: ${today}\n\n${systemPrompt}`;

    const apiKey = process.env.AI_HEAVY_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL =
      process.env.AI_HEAVY_BASE_URL ||
      process.env.OPENAI_BASE_URL ||
      "https://api.openai.com/v1";
    const model =
      process.env.AI_HEAVY_MODEL || process.env.OPENAI_MODEL || "gpt-4o";

    const client = new OpenAI({ apiKey, baseURL });

    const userContent: OpenAI.Chat.ChatCompletionContentPart[] = [];

    userContent.push({
      type: "text",
      text: extractedText
        ? `CV Text:\n\n${extractedText}`
        : "No text extracted — parse from images only.",
    });

    if (fileType === "pdf" && pageImages && pageImages.length > 0) {
      pageImages.slice(0, 3).forEach((img, idx) => {
        userContent.push({ type: "text", text: `Page ${idx + 1}:` });
        userContent.push({
          type: "image_url",
          image_url: { url: img, detail: "high" },
        });
      });
    }

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPromptWithDate },
        { role: "user", content: userContent },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const rawContent = response.choices[0]?.message?.content;
    if (!rawContent) throw new Error("Empty response from AI");

    const rawProfile = JSON.parse(rawContent) as ExtractedProfile;
    const profile = injectIds(rawProfile);

    return NextResponse.json(profile, { status: 200 });
  } catch (err) {
    console.error("[extract-profile-from-cv] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
