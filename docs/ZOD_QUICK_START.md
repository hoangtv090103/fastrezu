# 🚀 Quick Start: Zod Validation trong FastRezu

## Cài đặt nhanh

Zod đã được cài đặt:
```bash
bun install zod
```

## Sử dụng cơ bản

### 1. Import schemas cần thiết

```typescript
import { 
  createCVSchema,      // Cho CV creation
  updateCVSchema,      // Cho CV updates
  analyzeJDSchema,     // Cho JD analysis
  improveBulletSchema, // Cho bullet improvement
  // ... và nhiều schemas khác
  validateSchema       // Helper function
} from '@/lib/validation-schemas'
```

### 2. Validate request body

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 1️⃣ Validate
    const validation = validateSchema(yourSchema, body);
    
    // 2️⃣ Check errors
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.firstError, details: validation.errors },
        { status: 400 }
      );
    }
    
    // 3️⃣ Use validated data (type-safe! ✨)
    const { field1, field2 } = validation.data;
    
    // Your business logic here...
  } catch (error) {
    // Handle error
  }
}
```

## 📋 Schemas có sẵn

### CV Operations
```typescript
createCVSchema        // title?, language
updateCVSchema        // title?, ats_score?, is_active?
applySuggestionSchema // cvId, suggestionId
```

### AI Operations  
```typescript
analyzeJDSchema       // jdText, cvId, language
improveBulletSchema   // bulletPoint, context?, jdKeywords?, language
generateSummarySchema // experience, skills[], language
scoreCVSchema         // cvContent, jdText, language
extractSkillsSchema   // jdText, language
```

### Feedback
```typescript
submitFeedbackSchema  // feedback_type, subject, message, ...
```

### Common
```typescript
languageSchema        // 'vi' | 'en'
cvIdSchema           // UUID validation
userIdSchema         // UUID validation
paginationSchema     // page, limit
```

## 🎯 Ví dụ thực tế

### Ví dụ 1: CV Creation
```typescript
import { createCVSchema, validateSchema } from '@/lib/validation-schemas';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const validation = validateSchema(createCVSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.firstError },
      { status: 400 }
    );
  }
  
  const { title, language } = validation.data;
  // language is typed as 'vi' | 'en' ✨
  // title is typed as string | undefined ✨
}
```

### Ví dụ 2: AI Bullet Improvement
```typescript
import { improveBulletSchema, validateSchema } from '@/lib/validation-schemas';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const validation = validateSchema(improveBulletSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.firstError },
      { status: 400 }
    );
  }
  
  const { bulletPoint, context, jdKeywords, language } = validation.data;
  // All fields are properly typed! ✨
}
```

### Ví dụ 3: Tạo schema mới
```typescript
// Trong /src/lib/validation-schemas.ts

export const yourNewSchema = z.object({
  field1: z.string().min(1, 'Field 1 is required'),
  field2: z.number().positive(),
  field3: z.enum(['option1', 'option2']).optional(),
  language: languageSchema, // Reuse existing schema!
});

// Export type
export type YourNewInput = z.infer<typeof yourNewSchema>;
```

## ⚡ Tips & Tricks

### 1. Default values
```typescript
const schema = z.object({
  language: z.enum(['vi', 'en']).default('vi'),
  page: z.number().default(1),
});
```

### 2. Optional vs nullable
```typescript
z.string().optional()  // undefined hoặc string
z.string().nullable()  // null hoặc string
z.string().nullish()   // null, undefined, hoặc string
```

### 3. Custom error messages
```typescript
z.string().min(10, 'Must be at least 10 characters')
z.number().positive('Must be a positive number')
z.email('Invalid email format')
```

### 4. Array validation
```typescript
z.array(z.string())                    // string[]
z.array(z.object({ id: z.string() })) // { id: string }[]
z.array(z.string()).min(1)            // Non-empty array
```

### 5. Transform data
```typescript
const schema = z.object({
  email: z.string().email().toLowerCase(),
  age: z.string().transform(val => parseInt(val, 10)),
});
```

## 🔍 Error Handling

### Detailed errors
```typescript
if (!validation.success) {
  console.log(validation.firstError);  // "Field X is required"
  console.log(validation.errors);      // Full error object
}
```

### Error object structure
```json
{
  "_errors": [],
  "field1": {
    "_errors": ["Field 1 is required"]
  },
  "field2": {
    "_errors": ["Must be a positive number"]
  }
}
```

## 📖 Complete Example

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { analyzeJDSchema, validateSchema } from '@/lib/validation-schemas';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse body
    const body = await request.json();
    
    // 2. Validate with Zod
    const validation = validateSchema(analyzeJDSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: validation.firstError,
          details: validation.errors 
        },
        { status: 400 }
      );
    }
    
    // 3. Extract validated data (type-safe!)
    const { jdText, cvId, language } = validation.data;
    
    // 4. Your business logic
    // language is typed as 'vi' | 'en' ✨
    const result = await analyzeJobDescription(jdText, cvId, language);
    
    // 5. Return response
    return NextResponse.json({ data: result }, { status: 200 });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 🎓 Learning Resources

- **Main Schema File**: `/src/lib/validation-schemas.ts`
- **Documentation**: `/docs/ZOD_VALIDATION_IMPLEMENTATION.md`
- **Zod Official Docs**: https://zod.dev/

## ✅ Checklist khi thêm route mới

- [ ] Import schemas từ `/src/lib/validation-schemas.ts`
- [ ] Sử dụng `validateSchema()` để validate request body
- [ ] Check `validation.success` trước khi xử lý
- [ ] Return error với `validation.firstError` nếu validation fails
- [ ] Sử dụng `validation.data` (đã được type-safe)
- [ ] Nếu cần schema mới, thêm vào `validation-schemas.ts`

## 🆘 Common Issues

### Issue: "Property does not exist on type"
```typescript
// ❌ Wrong
const { field } = body;  // body is 'any'

// ✅ Correct
const validation = validateSchema(schema, body);
if (validation.success) {
  const { field } = validation.data;  // Type-safe! ✨
}
```

### Issue: "Schema not matching"
```typescript
// Kiểm tra schema có match với data structure không
console.log(schema.safeParse(body));
```

---

**Happy coding! 🚀**
