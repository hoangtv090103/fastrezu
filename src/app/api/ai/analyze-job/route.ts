import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { callOpenAI } from '@/lib/openai';
import { analyzeJobSchema, validateSchema } from '@/lib/validation-schemas';
import { checkAndRecordAIUsage, rateLimitExceededResponse } from '@/lib/ai-rate-limit';

const SYSTEM_PROMPT_VI = `Bạn là FastRezu AI, chuyên gia tư vấn nghề nghiệp và phân tích tuyển dụng.
Nhiệm vụ: So sánh Mô tả Công việc (JD) với hồ sơ ứng viên, trả về điểm khớp và phân tích lỗ hổng.

Bạn phải trả về ĐÚNG cấu trúc JSON sau (không thêm bất kỳ văn bản nào ngoài JSON):
{
  "keywords_required": ["keyword1", "keyword2", ...],
  "match_score": <số nguyên 0-100>,
  "gap_analysis": "<chuỗi text>"
}

Hướng dẫn:
- keywords_required: Tối đa 20 kỹ năng, công cụ, yêu cầu quan trọng nhất từ JD
- match_score: Ước tính % phù hợp dựa trên kỹ năng/kinh nghiệm ứng viên so với JD (0 = không phù hợp, 100 = hoàn toàn phù hợp). Nếu hồ sơ trống thì trả về 0.
- gap_analysis: 2-4 câu tiếng Việt, nêu rõ những điểm ứng viên còn thiếu và lời khuyên cụ thể để cải thiện`;

const SYSTEM_PROMPT_EN = `You are FastRezu AI, a career advisor and recruitment analyst.
Task: Compare the Job Description (JD) with the candidate's profile, return a match score and gap analysis.

You MUST return EXACTLY the following JSON structure (do not add any text outside the JSON):
{
  "keywords_required": ["keyword1", "keyword2", ...],
  "match_score": <integer 0-100>,
  "gap_analysis": "<string>"
}

Guidelines:
- keywords_required: Maximum 20 most important skills, tools, and requirements from the JD
- match_score: Estimated match % based on candidate's skills/experience vs JD (0 = no match, 100 = perfect match). Return 0 if profile is empty.
- gap_analysis: 2-4 sentences in English, clearly stating what the candidate is missing and specific advice for improvement`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    const rateLimit = await checkAndRecordAIUsage(
      supabase,
      user.id,
      "analyze-job",
      profile?.subscription_tier,
    );
    if (!rateLimit.allowed) {
      return rateLimitExceededResponse(rateLimit.used, rateLimit.limit);
    }

    const body = await request.json();
    const validation = validateSchema(analyzeJobSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.firstError, details: validation.errors },
        { status: 400 }
      );
    }

    const { jobId } = validation.data;

    // Fetch job and verify ownership (RLS also enforces this)
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, company_name, raw_jd_text')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job không tìm thấy hoặc bạn không có quyền truy cập' },
        { status: 404 }
      );
    }

    if (!job.raw_jd_text || job.raw_jd_text.trim().length < 10) {
      return NextResponse.json(
        { error: 'Job chưa có mô tả công việc để phân tích' },
        { status: 400 }
      );
    }

    // Fetch all master_profiles sections for the user
    const { data: masterProfiles } = await supabase
      .from('master_profiles')
      .select('section_type, content')
      .eq('user_id', user.id);

    const profileSections = (masterProfiles || []).reduce<Record<string, unknown>>(
      (acc, row) => ({ ...acc, [row.section_type]: row.content }),
      {}
    );

    const userMessage = `=== MÔ TẢ CÔNG VIỆC (JD) ===
Vị trí: ${job.title} tại ${job.company_name}

${job.raw_jd_text}

=== HỒ SƠ ỨNG VIÊN ===
${buildProfileText(profileSections)}`;

    const locale = body.locale === 'en' ? 'en' : 'vi';
    const systemPrompt = locale === 'vi' ? SYSTEM_PROMPT_VI : SYSTEM_PROMPT_EN;

    // Call AI with light tier (The Intel uses fast/cheap model)
    let analysis: { keywords_required?: unknown; match_score?: unknown; gap_analysis?: unknown };
    try {
      analysis = await callOpenAI(systemPrompt, userMessage, {
        tier: 'heavy',
        responseFormat: 'json_object',
      });
    } catch (aiError) {
      console.error('[analyze-job] AI error:', aiError);
      return NextResponse.json(
        { error: 'Dịch vụ AI đang bận, vui lòng thử lại sau.' },
        { status: 503 }
      );
    }

    const keywords_required = Array.isArray(analysis.keywords_required)
      ? (analysis.keywords_required as string[])
      : [];
    const match_score =
      typeof analysis.match_score === 'number'
        ? Math.min(100, Math.max(0, Math.round(analysis.match_score)))
        : 0;
    const gap_analysis =
      typeof analysis.gap_analysis === 'string' ? analysis.gap_analysis : '';

    // Upsert to job_analyses (one-to-one with jobs)
    const { error: saveError } = await supabase
      .from('job_analyses')
      .upsert(
        { job_id: jobId, keywords_required, match_score, gap_analysis },
        { onConflict: 'job_id' }
      );

    if (saveError) {
      console.error('[analyze-job] Save error:', saveError);
      // Still return the result even if save fails
    }

    return NextResponse.json({ keywords_required, match_score, gap_analysis }, { status: 200 });
  } catch (error) {
    console.error('[analyze-job] Unexpected error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ. Vui lòng thử lại.' }, { status: 500 });
  }
}

function buildProfileText(sections: Record<string, unknown>): string {
  const lines: string[] = [];

  if (sections.summary && typeof sections.summary === 'string') {
    lines.push(`Tóm tắt: ${sections.summary}`);
  }

  if (Array.isArray(sections.experience)) {
    lines.push('\nKinh nghiệm làm việc:');
    for (const exp of sections.experience as Record<string, unknown>[]) {
      lines.push(
        `- ${exp.title || ''} tại ${exp.company || ''} (${exp.start_date || ''} – ${exp.is_current ? 'Hiện tại' : exp.end_date || ''})`
      );
      if (exp.description) lines.push(`  ${exp.description}`);
    }
  }

  if (sections.skills && typeof sections.skills === 'object' && sections.skills !== null) {
    const skills = sections.skills as { hard_skills?: string[]; soft_skills?: string[] };
    if (skills.hard_skills?.length) lines.push(`\nKỹ năng chuyên môn: ${skills.hard_skills.join(', ')}`);
    if (skills.soft_skills?.length) lines.push(`Kỹ năng mềm: ${skills.soft_skills.join(', ')}`);
  }

  if (Array.isArray(sections.education)) {
    lines.push('\nHọc vấn:');
    for (const edu of sections.education as Record<string, unknown>[]) {
      lines.push(`- ${edu.degree || ''} tại ${edu.school || ''}`);
    }
  }

  if (Array.isArray(sections.certifications)) {
    const certNames = (sections.certifications as Record<string, unknown>[])
      .map((c) => c.name)
      .filter(Boolean);
    if (certNames.length) lines.push(`\nChứng chỉ: ${certNames.join(', ')}`);
  }

  return lines.join('\n') || 'Chưa có thông tin hồ sơ.';
}
