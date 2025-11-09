# Khắc Phục Lỗi Summary Section Bị Mất Sau Khi Apply Suggestion

## Vấn Đề

Khi người dùng apply một suggestion liên quan đến **Summary section**, sau khi áp dụng, phần summary **BỊ MẤT HOÀN TOÀN** trên UI.

## Nguyên Nhân

### Root Cause: Structure Mismatch

**Summary section có cấu trúc dữ liệu đặc biệt:**
```typescript
// Expected structure trong database và UI
{
  content: "Summary text here..."
}
```

**UI code trong SummaryStep.tsx expects:**
```typescript
const summaryData = state.cvData?.sections.summary || {};
const summary = {
  content: typeof summaryData.content === "string" ? summaryData.content : ""
};
```

**Vấn đề:** AI có thể generate `suggested_content` với nhiều formats khác nhau:

1. **String trực tiếp** (BUG CASE):
   ```json
   {
     "suggested_content": "New summary text with keywords"
   }
   ```

2. **Object với field 'text' thay vì 'content'**:
   ```json
   {
     "suggested_content": {
       "text": "New summary text"
     }
   }
   ```

3. **Object đúng format** (rare):
   ```json
   {
     "suggested_content": {
       "content": "New summary text"
     }
   }
   ```

### Flow Gây Lỗi

```
1. AI generates suggestion → suggested_content = "string text"
2. User clicks Apply → API: updatedData = validatedSuggestion.suggested_content
3. Database saves → section.data = "string text" (không phải {content: "..."})
4. UI loads → summaryData.content = undefined (vì data là string, không có field 'content')
5. Result → Summary hiển thị trống ❌
```

### Code Gây Lỗi

**File: `src/app/api/cv/apply-suggestion/route.ts` (Line ~214)**
```typescript
// ❌ BUG: Ghi đè trực tiếp mà không check structure
else {
  updatedData = validatedSuggestion.suggested_content;
}
```

**Hậu quả:**
- Nếu `suggested_content` là string → database lưu string thay vì `{content: "..."}`
- UI không thể access `section.data.content` → hiển thị trống
- Data bị corrupt, không thể recover trừ khi edit manual

## Giải Pháp

### 1. Thêm Special Handling cho Summary Section

**File: `src/app/api/cv/apply-suggestion/route.ts`**

```typescript
} else if (validatedSuggestion.target_section === 'summary') {
  // For summary section, ensure data is wrapped in { content: "..." } structure
  const suggestedContent = validatedSuggestion.suggested_content;
  
  // If suggested_content is a string, wrap it in the expected structure
  if (typeof suggestedContent === 'string') {
    updatedData = { content: suggestedContent };
  } else if (typeof suggestedContent === 'object' && suggestedContent !== null) {
    // If it's already an object, ensure it has 'content' field
    const contentObj = suggestedContent as Record<string, unknown>;
    updatedData = {
      content: contentObj.content || contentObj.text || ''
    };
  } else {
    // Fallback: preserve existing data or use empty
    updatedData = sectionData?.data || { content: '' };
  }
} else {
  // Replace entire section for other section types
  updatedData = validatedSuggestion.suggested_content;
}
```

**Logic:**
1. ✅ **String → Wrap**: `"text"` → `{content: "text"}`
2. ✅ **Object với 'content'**: Preserve as-is
3. ✅ **Object với 'text'**: Normalize to `{content: "..."}`
4. ✅ **Null/invalid**: Preserve existing data

### 2. Apply Cùng Fix cho Apply-All

**File: `src/app/api/cv/apply-all-suggestions/route.ts`**

Áp dụng **cùng logic** để đảm bảo consistency giữa apply single và apply all.

## Testing

### Test Cases

**Test 1: String suggested_content (Bug Case)**
```typescript
Input: suggested_content = "New summary text"
Expected: { content: "New summary text" }
Result: ✅ PASSED
```

**Test 2: Object with 'content' field**
```typescript
Input: suggested_content = { content: "Summary text" }
Expected: { content: "Summary text" }
Result: ✅ PASSED
```

**Test 3: Object with 'text' field (fallback)**
```typescript
Input: suggested_content = { text: "Summary text" }
Expected: { content: "Summary text" }
Result: ✅ PASSED
```

**Test 4: Null suggestion (preserve existing)**
```typescript
Input: suggested_content = null
Expected: Preserve existing section.data
Result: ✅ PASSED
```

**Test 5: UI Compatibility**
```typescript
UI accesses: section.data.content (string)
We provide: { content: "..." }
Result: ✅ PASSED
```

### Run Tests

```bash
bun run scripts/test-summary-fix.ts
```

**Output:**
```
=== All Summary Tests Passed! ✅ ===

Summary:
1. String suggestions are wrapped in { content: '...' }
2. Object suggestions with 'content' are preserved
3. Object suggestions with 'text' are normalized to 'content'
4. Null/invalid suggestions preserve existing data
5. Updated data is compatible with UI expectations

Bug Fix: Summary section no longer disappears after applying suggestions! 🎉
```

## Files Changed

1. **src/app/api/cv/apply-suggestion/route.ts**
   - Added special handling for summary section (line ~199-218)
   - Wraps string content in `{content: "..."}` structure
   - Handles multiple suggestion formats

2. **src/app/api/cv/apply-all-suggestions/route.ts**
   - Added identical summary handling logic
   - Ensures consistency between single and batch apply

3. **scripts/test-summary-fix.ts** (NEW)
   - Comprehensive test suite for summary handling
   - Validates all edge cases and UI compatibility

4. **docs/SUMMARY_SECTION_FIX.md** (THIS FILE)
   - Technical documentation
   - Root cause analysis
   - Solution explanation

## Verification

### Build Check
```bash
bun run build
# Result: ✓ Compiled successfully
```

### Manual Test Checklist

1. **Test Apply Single Suggestion**
   - [ ] Create CV with summary
   - [ ] Score CV to get suggestions
   - [ ] Apply ONE summary suggestion
   - [ ] **Verify:** Summary still displays after apply
   - [ ] **Verify:** Summary content updated correctly

2. **Test Apply All Suggestions**
   - [ ] Create CV with summary and other sections
   - [ ] Score CV to get multiple suggestions (including summary)
   - [ ] Apply ALL suggestions
   - [ ] **Verify:** Summary still displays
   - [ ] **Verify:** All sections updated correctly

3. **Test Different Suggestion Formats**
   - [ ] Force different AI outputs (if possible)
   - [ ] Apply suggestions with different formats
   - [ ] **Verify:** All formats handled correctly

4. **Test Edge Cases**
   - [ ] Empty summary
   - [ ] Very long summary
   - [ ] Summary with special characters
   - [ ] Multiple applies in a row

## Impact

### Before Fix
- ❌ Summary disappears after applying suggestions
- ❌ Data corruption in database (string instead of object)
- ❌ Cannot recover without manual edit
- ❌ Poor user experience

### After Fix
- ✅ Summary preserved and updated correctly
- ✅ Data structure consistency maintained
- ✅ Handles multiple AI output formats
- ✅ Graceful fallbacks for edge cases
- ✅ Improved user experience

## Related Sections

**Other sections with similar structure that should be monitored:**

1. **Personal Info** - Object structure `{full_name, email, phone, ...}`
2. **Skills** - Already has merge logic `{technical: [], soft: []}`
3. **Experience/Education** - Array structures (different handling)

**Note:** Summary is unique because:
- Simple single-field object structure
- AI often returns just the text content
- UI expects specific structure `{content: "..."}`

## Prevention

To prevent similar issues in the future:

1. **AI Prompt Engineering**: Ensure AI always returns correct structure
2. **Schema Validation**: Add Zod schema for suggested_content
3. **Type Guards**: Always check structure before applying
4. **Unit Tests**: Test with various suggestion formats
5. **Documentation**: Document expected structure for each section

## Rollback Plan

If issues occur:

1. Revert changes:
   ```bash
   git revert <commit-hash>
   ```

2. Database cleanup (if needed):
   ```sql
   -- Fix corrupted summary data
   UPDATE cv_sections 
   SET data = jsonb_build_object('content', data)
   WHERE section_type = 'summary' 
   AND jsonb_typeof(data) = 'string';
   ```

3. Re-apply suggestions manually through UI

## References

- **UI Component**: `src/components/editor/steps/SummaryStep.tsx`
- **API Single**: `src/app/api/cv/apply-suggestion/route.ts`
- **API Batch**: `src/app/api/cv/apply-all-suggestions/route.ts`
- **AI Scoring**: `src/app/api/ai/score-cv/route.ts`
- **Previous Fix**: `docs/APPLY_ALL_SUGGESTIONS_FIX.md` (Skills merge logic)
