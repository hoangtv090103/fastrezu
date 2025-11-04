# Skills Suggestion Fix - Applied Suggestions Bug

## Vấn đề (Problem)

Khi apply suggestion cho skills section, phần skills trong CV biến mất hoặc chỉ còn một phần (technical hoặc soft).

## Nguyên nhân (Root Cause)

Skills section có cấu trúc đặc biệt:
```json
{
  "technical": ["React", "Node.js", "TypeScript"],
  "soft": ["Teamwork", "Communication", "Problem Solving"]
}
```

### Hai vấn đề chính:

1. **API Route Logic**: Code trong `/api/cv/apply-suggestion` đang thay thế toàn bộ skills object khi `target_index` là `null`, không merge với data hiện tại.

2. **AI Prompt Structure**: Prompt trong `prompts.ts` đang hướng dẫn AI sử dụng array đơn giản `["skill1", "skill2"]` thay vì object structure đúng.

## Giải pháp (Solution)

### 1. Cập nhật Apply Suggestion Logic

**File**: `/Users/hoangtv/fastrezu/src/app/api/cv/apply-suggestion/route.ts`

Thêm logic merge đặc biệt cho skills section:

```typescript
if (validatedSuggestion.target_section === 'skills' && sectionData?.data) {
  const currentSkills = sectionData.data as Record<string, unknown>;
  const suggestedSkills = validatedSuggestion.suggested_content as Record<string, unknown>;
  
  // Merge skills, preserving existing data
  updatedData = {
    technical: suggestedSkills.technical !== undefined 
      ? suggestedSkills.technical 
      : currentSkills.technical || [],
    soft: suggestedSkills.soft !== undefined 
      ? suggestedSkills.soft 
      : currentSkills.soft || [],
  };
} else {
  // Replace entire section for other section types
  updatedData = validatedSuggestion.suggested_content;
}
```

### 2. Cập nhật AI Prompts

**File**: `/Users/hoangtv/fastrezu/src/lib/prompts.ts`

Cập nhật hướng dẫn và ví dụ trong cả phiên bản tiếng Việt và tiếng Anh:

**Trước:**
```json
{
  "original_content": ["React", "Node.js", "TypeScript"],
  "suggested_content": ["React", "Node.js", "TypeScript", "Docker"]
}
```

**Sau:**
```json
{
  "original_content": {
    "technical": ["React", "Node.js", "TypeScript"],
    "soft": ["Teamwork", "Communication"]
  },
  "suggested_content": {
    "technical": ["React", "Node.js", "TypeScript", "Docker"],
    "soft": ["Teamwork", "Communication"]
  }
}
```

### 3. Thêm Debug Logging

Thêm logging chi tiết trong apply-suggestion route để debug:

```typescript
console.log("Updating section:", {
  cv_id: cvId,
  section_type: validatedSuggestion.target_section,
  target_index: validatedSuggestion.target_index,
  hasSection: !!sectionData,
  currentData: sectionData?.data,
  suggestedContent: validatedSuggestion.suggested_content,
  updatedData,
});
```

## Testing

1. Tạo CV với skills có cả technical và soft skills
2. Run ATS scoring để generate suggestions cho skills
3. Apply một suggestion cho technical skills
4. Verify rằng soft skills vẫn còn nguyên
5. Apply một suggestion cho soft skills  
6. Verify rằng technical skills vẫn còn nguyên

## Files Changed

- `/Users/hoangtv/fastrezu/src/app/api/cv/apply-suggestion/route.ts` - Added merge logic for skills
- `/Users/hoangtv/fastrezu/src/lib/prompts.ts` - Updated prompt examples and instructions
- `/Users/hoangtv/fastrezu/src/lib/openai.ts` - Added retry logic (bonus fix for 503 errors)

## Related Issues

- OpenAI 503 errors: Added retry with exponential backoff in `openai.ts`
