# 🔄 Zod Migration Template

Sử dụng template này để migrate các routes còn lại sang Zod validation.

## 📋 Step-by-Step Migration Guide

### Step 1: Identify Current Validation

Tìm tất cả validation logic trong route hiện tại:

```typescript
// Example: Manual validation
const { field1, field2, field3 } = await request.json()

if (!field1 || typeof field1 !== 'string') {
  return NextResponse.json({ error: 'Invalid field1' }, { status: 400 })
}

if (!['option1', 'option2'].includes(field2)) {
  return NextResponse.json({ error: 'Invalid field2' }, { status: 400 })
}
```

### Step 2: Create Schema

Thêm schema vào `/src/lib/validation-schemas.ts`:

```typescript
/**
 * Schema for [describe your operation]
 */
export const yourNewSchema = z.object({
  field1: z.string().min(1, 'Field 1 is required'),
  field2: z.enum(['option1', 'option2']),
  field3: z.number().positive().optional(),
  language: languageSchema, // Reuse common schemas!
});

// Export type
export type YourNewInput = z.infer<typeof yourNewSchema>;
```

### Step 3: Update Import Statements

```typescript
// Add to your route file
import { yourNewSchema, validateSchema } from '@/lib/validation-schemas';
```

### Step 4: Replace Validation Logic

**Before:**
```typescript
export async function POST(request: NextRequest) {
  try {
    const { field1, field2 } = await request.json()
    
    if (!field1 || typeof field1 !== 'string') {
      return NextResponse.json({ error: 'Invalid field1' }, { status: 400 })
    }
    
    if (!['option1', 'option2'].includes(field2)) {
      return NextResponse.json({ error: 'Invalid field2' }, { status: 400 })
    }
    
    // Business logic...
  } catch (error) {
    // Error handling...
  }
}
```

**After:**
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate with Zod
    const validation = validateSchema(yourNewSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.firstError, details: validation.errors },
        { status: 400 }
      );
    }
    
    // Extract validated data (type-safe!)
    const { field1, field2 } = validation.data;
    
    // Business logic... (same as before)
  } catch (error) {
    // Error handling... (same as before)
  }
}
```

### Step 5: Test

```bash
# Run build to check for type errors
bun run build

# Run linter
bun run lint

# Test the endpoint
curl -X POST http://localhost:3000/api/your-endpoint \
  -H "Content-Type: application/json" \
  -d '{"field1": "value", "field2": "option1"}'
```

## 🎯 Common Patterns

### Pattern 1: Simple String/Number Validation

```typescript
// Schema
export const simpleSchema = z.object({
  title: z.string().min(1).max(100),
  count: z.number().int().positive(),
  email: z.string().email(),
});

// Usage
const validation = validateSchema(simpleSchema, body);
```

### Pattern 2: Enum Validation

```typescript
// Schema
export const enumSchema = z.object({
  status: z.enum(['active', 'inactive', 'pending']),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});
```

### Pattern 3: Array Validation

```typescript
// Schema
export const arraySchema = z.object({
  tags: z.array(z.string()).min(1, 'At least one tag required'),
  items: z.array(z.object({
    id: z.string(),
    value: z.number(),
  })),
});
```

### Pattern 4: Optional Fields

```typescript
// Schema
export const optionalSchema = z.object({
  required: z.string(),
  optional: z.string().optional(),
  nullable: z.string().nullable(),
  withDefault: z.string().default('default value'),
});
```

### Pattern 5: Nested Objects

```typescript
// Schema
export const nestedSchema = z.object({
  user: z.object({
    name: z.string(),
    age: z.number(),
  }),
  settings: z.object({
    theme: z.enum(['light', 'dark']),
    notifications: z.boolean(),
  }).optional(),
});
```

### Pattern 6: With Existing Common Schemas

```typescript
// Schema - Reuse existing schemas!
export const withCommonSchema = z.object({
  cvId: cvIdSchema,              // Reuse!
  language: languageSchema,      // Reuse!
  userId: userIdSchema,          // Reuse!
  customField: z.string(),
});
```

## 📝 Templates by Route Type

### Template 1: CV Operations

```typescript
// Schema
export const cvOperationSchema = z.object({
  cvId: cvIdSchema,
  // Add your specific fields
  field: z.string(),
});

// Type
export type CVOperationInput = z.infer<typeof cvOperationSchema>;

// Usage in route
import { cvOperationSchema, validateSchema } from '@/lib/validation-schemas';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = validateSchema(cvOperationSchema, body);
  
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.firstError },
      { status: 400 }
    );
  }
  
  const { cvId, field } = validation.data;
  // Your logic...
}
```

### Template 2: AI Operations

```typescript
// Schema
export const aiOperationSchema = z.object({
  content: z.string().min(10, 'Content too short'),
  language: languageSchema,
  options: z.object({
    // AI-specific options
  }).optional(),
});

// Type
export type AIOperationInput = z.infer<typeof aiOperationSchema>;
```

### Template 3: File Upload

```typescript
// Schema
export const fileUploadSchema = z.object({
  fileName: z.string(),
  fileSize: z.number().positive().max(10 * 1024 * 1024, 'File too large (max 10MB)'),
  fileType: z.enum(['application/pdf', 'application/msword']),
});
```

### Template 4: Pagination

```typescript
// Schema - Use existing paginationSchema!
export const listSchema = z.object({
  ...paginationSchema.shape,  // Include page & limit
  filters: z.object({
    status: z.enum(['active', 'inactive']).optional(),
    search: z.string().optional(),
  }).optional(),
});
```

## 🔍 Migration Checklist

For each route you migrate:

- [ ] **Analyze** current validation logic
- [ ] **Create** schema in `validation-schemas.ts`
- [ ] **Export** type with `z.infer<typeof schema>`
- [ ] **Import** schema and `validateSchema` in route
- [ ] **Replace** manual validation with `validateSchema()`
- [ ] **Check** validation.success before proceeding
- [ ] **Extract** validated data from `validation.data`
- [ ] **Test** with `bun run build`
- [ ] **Lint** with `bun run lint`
- [ ] **Update** route count in documentation

## 🎯 Priority Routes to Migrate

### High Priority (11 routes)

1. **CV Routes** (5 routes)
   ```
   /api/cv/save-suggestions
   /api/cv/apply-all-suggestions
   /api/cv/upload-check
   /api/cv/[cvId]/delete
   /api/cv/deactivate-suggestions/[cvId]
   ```

2. **AI Routes** (4 routes)
   ```
   /api/ai/write-experience
   /api/ai/score-cv
   /api/ai/extract-skills
   /api/ai/score-uploaded-cv
   ```

3. **JD Routes** (2 routes)
   ```
   /api/jd/list
   /api/jd/delete
   ```

### Medium Priority (27 remaining routes)

See `/docs/ZOD_VALIDATION_IMPLEMENTATION.md` for full list.

## 🔧 Helper Scripts

### Find Routes Without Validation

```bash
# Find all API routes
find src/app/api -name "route.ts" | wc -l

# Find routes already using Zod
grep -r "validateSchema" src/app/api --include="*.ts" | wc -l
```

### Generate Schema Template

```typescript
// Run this to generate a basic schema template
function generateSchemaTemplate(routeName: string) {
  return `
export const ${routeName}Schema = z.object({
  // TODO: Add your fields here
  language: languageSchema,
});

export type ${routeName}Input = z.infer<typeof ${routeName}Schema>;
`;
}
```

## 💡 Tips & Best Practices

### 1. Start Simple
Begin with routes that have simple validation (2-3 fields).

### 2. Reuse Schemas
Always check if a common schema exists before creating new ones.

### 3. Meaningful Error Messages
```typescript
z.string().min(10, 'Must be at least 10 characters')  // ✅ Good
z.string().min(10)                                     // ❌ Less helpful
```

### 4. Group Related Schemas
```typescript
// Group CV-related schemas together
export const createCVSchema = z.object({...});
export const updateCVSchema = z.object({...});
export const deleteCVSchema = z.object({...});
```

### 5. Document Your Schemas
```typescript
/**
 * Schema for analyzing job descriptions
 * 
 * @property jdText - Job description text (min 10 chars)
 * @property cvId - CV ID to analyze against
 * @property language - Output language
 */
export const analyzeJDSchema = z.object({
  jdText: z.string().min(10),
  cvId: cvIdSchema,
  language: languageSchema,
});
```

## 🆘 Common Issues & Solutions

### Issue 1: Complex Nested Objects

**Problem:** Route has deeply nested validation
```typescript
const { user: { profile: { settings } } } = body;
```

**Solution:** Create nested schemas
```typescript
const settingsSchema = z.object({...});
const profileSchema = z.object({
  settings: settingsSchema,
});
const userSchema = z.object({
  profile: profileSchema,
});
```

### Issue 2: Dynamic Validation

**Problem:** Validation depends on other fields
```typescript
if (type === 'A') {
  // validate fieldA
} else {
  // validate fieldB
}
```

**Solution:** Use discriminated unions
```typescript
const schema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('A'), fieldA: z.string() }),
  z.object({ type: z.literal('B'), fieldB: z.number() }),
]);
```

### Issue 3: File Uploads

**Problem:** Validating FormData/Files

**Solution:** Validate metadata, not the file itself
```typescript
const fileMetadataSchema = z.object({
  fileName: z.string(),
  fileSize: z.number().max(10 * 1024 * 1024),
  fileType: z.string(),
});
```

## 📊 Track Your Progress

Update this table as you migrate routes:

| Route | Status | Date | Notes |
|-------|--------|------|-------|
| `/api/cv/create` | ✅ Done | 2025-11-09 | Initial implementation |
| `/api/cv/[cvId]/update` | ✅ Done | 2025-11-09 | Initial implementation |
| `/api/cv/apply-suggestion` | ✅ Done | 2025-11-09 | Initial implementation |
| `/api/ai/improve-bullet` | ✅ Done | 2025-11-09 | Initial implementation |
| `/api/ai/analyze-jd` | ✅ Done | 2025-11-09 | Initial implementation |
| `/api/feedback` | ✅ Done | 2025-11-09 | Initial implementation |
| `/api/cv/save-suggestions` | 🔲 Todo | - | - |
| `/api/cv/apply-all-suggestions` | 🔲 Todo | - | - |
| ... | ... | ... | ... |

## 🎓 Learning Resources

- **Main Docs**: `/docs/ZOD_VALIDATION_IMPLEMENTATION.md`
- **Quick Start**: `/docs/ZOD_QUICK_START.md`
- **Schema File**: `/src/lib/validation-schemas.ts`
- **Zod Docs**: https://zod.dev/

---

**Happy migrating! 🚀**

Remember: Each route you migrate makes the codebase safer and more maintainable! ✨
