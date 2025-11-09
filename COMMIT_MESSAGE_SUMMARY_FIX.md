# Commit Message for Summary Section Fix

## Title
```
fix: Khắc phục lỗi Summary section bị mất sau khi apply suggestion
```

## Description
```
Summary section BỊ MẤT hoàn toàn sau khi apply suggestion do AI generate 
suggested_content là string thay vì object {content: "..."}.

## Root Cause
UI expects summary structure: { content: "text" }
AI sometimes returns: "text" (string directly)
Code ghi đè trực tiếp → database lưu string → UI không tìm thấy field 'content'

## Solution
Added special handling cho summary section:
1. Wrap string suggestions vào {content: "..."}
2. Normalize object suggestions (content/text fields)
3. Preserve existing data on null/invalid suggestions
4. Apply cùng logic cho both single và batch apply

## Changes

### src/app/api/cv/apply-suggestion/route.ts
- Added summary section special handling (line ~199-218)
- Wraps string content in proper structure
- Handles multiple AI output formats
- Graceful fallbacks for edge cases

### src/app/api/cv/apply-all-suggestions/route.ts
- Added identical summary handling logic
- Ensures consistency between single and batch operations

## Testing
✅ Unit tests: 5/5 passed (scripts/test-summary-fix.ts)
✅ Build successful: No TypeScript errors
✅ Test cases: string wrap, object preserve, text normalize, null fallback, UI compat

## Impact
Before: ❌ Summary disappears, data corrupted
After:  ✅ Summary preserved, structure maintained, UI works correctly

## Documentation
- docs/SUMMARY_SECTION_FIX.md - Full technical documentation
- docs/SUMMARY_FIX_SUMMARY.md - Quick reference
- scripts/test-summary-fix.ts - Test suite

## Related
- Related to Apply All Suggestions fix (docs/APPLY_ALL_SUGGESTIONS_FIX.md)
- Similar pattern to Skills merge logic

Fixes: Summary section disappearing after apply suggestions
```

## Git Commands
```bash
# Stage changes
git add src/app/api/cv/apply-suggestion/route.ts
git add src/app/api/cv/apply-all-suggestions/route.ts
git add scripts/test-summary-fix.ts
git add docs/SUMMARY_SECTION_FIX.md
git add docs/SUMMARY_FIX_SUMMARY.md
git add docs/APPLY_ALL_SUGGESTIONS_FIX.md

# Commit
git commit -m "fix: Khắc phục lỗi Summary section bị mất sau khi apply suggestion

Summary section BỊ MẤT hoàn toàn sau khi apply suggestion do AI generate 
suggested_content là string thay vì object {content: '...'}.

Root Cause:
- UI expects: { content: 'text' }
- AI returns: 'text' (string directly)
- Code ghi đè trực tiếp → DB lưu string → UI không tìm field 'content'

Solution:
- Wrap string suggestions vào {content: '...'}
- Normalize object suggestions (content/text fields)
- Preserve existing data on null/invalid
- Consistent handling cho single & batch apply

Changes:
- apply-suggestion/route.ts: Added summary special handling
- apply-all-suggestions/route.ts: Same logic for consistency
- test-summary-fix.ts: 5/5 tests passed ✅
- Documentation: Full technical docs + quick reference

Impact:
- Before: ❌ Summary disappears, data corrupted
- After:  ✅ Summary preserved, structure maintained

Fixes: User report - Summary bị mất sau khi apply suggestion"

# Push
git push origin main
```
