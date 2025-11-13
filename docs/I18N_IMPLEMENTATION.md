# 🌍 FastRezu Internationalization (i18n) Implementation

## ✅ Đã hoàn thành

Hệ thống đa ngôn ngữ đã được triển khai thành công cho FastRezu với các tính năng sau:

### 🎯 Core Features

1. **LanguageContext** - Context riêng cho UI language
   - Tách biệt UI language vs CV language
   - Persistent qua localStorage
   - SSR-safe (prevent hydration mismatch)

2. **useTranslation Hook** - Translation hook với TypeScript support
   - Type-safe với autocomplete
   - Support nested keys (`dashboard.title`)
   - Interpolation (`{{variable}}`)
   - Development warnings cho missing keys

3. **Dictionary System** - JSON-based translations
   - `vi.json` - Tiếng Việt (mặc định)
   - `en.json` - English
   - Tổ chức theo modules (common, auth, dashboard, wizard, etc.)

4. **LanguageSwitcher Component** - UI component để đổi ngôn ngữ
   - Dropdown với flags
   - Smooth transitions
   - Accessible (ARIA labels)

### 📁 Files Created

```
src/
├── dictionaries/
│   ├── vi.json                    # Vietnamese translations
│   └── en.json                    # English translations
├── contexts/
│   └── LanguageContext.tsx        # Language provider context
├── hooks/
│   └── useTranslation.ts          # Translation hook
├── components/
│   └── ui/
│       └── LanguageSwitcher.tsx   # Language switcher UI
└── app/
    └── layout.tsx                 # ✅ Updated with LanguageProvider

docs/
├── I18N_GUIDE.md                  # Complete usage guide
└── I18N_MIGRATION_EXAMPLES.md     # Migration examples
```

## 🚀 Quick Start

### 1. Import hook trong component

```tsx
"use client";

import { useTranslation } from "@/hooks/useTranslation";

export default function MyComponent() {
  const { t, locale } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('wizard.stepProgress', { current: 1, total: 5 })}</p>
    </div>
  );
}
```

### 2. Thêm LanguageSwitcher vào Header

```tsx
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

<header>
  {/* ... other content ... */}
  <LanguageSwitcher />
</header>
```

### 3. Thêm translations mới

**vi.json:**
```json
{
  "myFeature": {
    "title": "Tiêu đề",
    "action": "Hành động"
  }
}
```

**en.json:**
```json
{
  "myFeature": {
    "title": "Title",
    "action": "Action"
  }
}
```

## 📊 Translation Coverage

### ✅ Available Translations

Đã có translations cho các modules:

- **common** - Buttons, actions, states
- **auth** - Login, logout, magic link
- **dashboard** - CV management
- **wizard** - CV creation wizard
- **languageSelection** - Language picker
- **jdAnalysis** - Job description analysis
- **personalInfo** - Personal information form
- **experience** - Work experience
- **education** - Education history
- **skills** - Skills management
- **summary** - Professional summary
- **checkCV** - CV checker feature
- **editor** - CV editor
- **feedback** - Feedback form
- **navigation** - Menu items
- **notifications** - Toast messages

### 🚧 Pages Need Implementation

Các trang cần áp dụng i18n (chỉ cần replace hardcoded text bằng `t()` calls):

1. **Dashboard** (`/dashboard`)
   - [ ] Page title, subtitle
   - [ ] Create button
   - [ ] Empty state
   - [ ] CV cards

2. **Editor/Wizard** (`/editor/[cvId]`)
   - [ ] Wizard panel
   - [ ] Step names
   - [ ] Form labels
   - [ ] Buttons

3. **Check CV** (`/check-cv`)
   - [ ] Upload instructions
   - [ ] Status messages
   - [ ] Results display

4. **Feedback** (`/feedback`)
   - [ ] Form labels
   - [ ] Success/error messages

5. **Auth Pages** (`/login`, `/auth/error`)
   - [ ] Login form
   - [ ] Error messages

## 🎨 Design Decisions

### Tại sao tự build thay vì dùng next-intl?

1. **Simplicity** - Không cần thêm dependency
2. **Flexibility** - Dễ customize cho nhu cầu riêng
3. **Lightweight** - ~2KB JSON files, không bloat
4. **Control** - Hiểu rõ cách hoạt động, dễ debug
5. **Perfect fit** - Đủ tính năng cho FastRezu

### UI Language vs CV Language

```
┌─────────────────────────────────────────┐
│  UI Language (LanguageContext)         │
│  - Ngôn ngữ giao diện                  │
│  - localStorage persistent              │
│  - User preference                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  CV Language (CVEditorContext)         │
│  - Ngôn ngữ nội dung CV                │
│  - Database persistent                  │
│  - Per-CV setting                       │
│  - Affects AI prompts                   │
└─────────────────────────────────────────┘
```

**Example:** Người Việt có thể dùng UI tiếng Việt để tạo CV tiếng Anh cho dễ hiểu!

## 🔄 Migration Guide

### Step-by-step cho mỗi page:

1. Import hook:
```tsx
import { useTranslation } from "@/hooks/useTranslation";
```

2. Use hook:
```tsx
const { t } = useTranslation();
```

3. Replace text:
```tsx
// Before
<h1>Quản lý CV</h1>

// After
<h1>{t('dashboard.title')}</h1>
```

4. Test cả 2 ngôn ngữ:
- Click Language Switcher
- Verify translations hiển thị đúng

5. Commit:
```bash
git add .
git commit -m "feat: add i18n to Dashboard page"
```

## 📝 Best Practices

### DO ✅

- **Dùng nested keys** cho tổ chức tốt: `dashboard.title`
- **Thêm cả vi và en** cùng lúc
- **Test missing keys** trong development
- **Dùng interpolation** cho dynamic content: `{{name}}`
- **Group theo module** trong JSON files

### DON'T ❌

- ❌ Hardcode text trong components
- ❌ Quên thêm key vào en.json
- ❌ Dùng keys quá dài: `this.is.a.very.long.nested.key`
- ❌ Duplicate translations (dùng common thay vì)
- ❌ Translate technical terms (Git, API, CV, ATS, etc.)

## 🧪 Testing

### Manual Testing

1. Build project:
```bash
bun run build
```

2. Start dev server:
```bash
bun run dev
```

3. Toggle language switcher
4. Navigate qua các pages
5. Verify all text được translate

### Console Warnings

Development mode sẽ warn về missing keys:
```
[i18n] Translation key missing: "dashboard.unknownKey" for locale: "vi"
```

## 📚 Documentation

- **[I18N_GUIDE.md](./I18N_GUIDE.md)** - Complete usage guide với examples
- **[I18N_MIGRATION_EXAMPLES.md](./I18N_MIGRATION_EXAMPLES.md)** - Migration examples cho từng component

## 🎯 Next Steps

### Immediate (Làm ngay)
1. [ ] Thêm LanguageSwitcher vào AuthenticatedHeader
2. [ ] Apply i18n cho Dashboard page (ví dụ mẫu)
3. [ ] Apply i18n cho Login page

### Short-term (Trong tuần này)
4. [ ] Apply i18n cho Wizard steps
5. [ ] Apply i18n cho Check CV page
6. [ ] Apply i18n cho Feedback page

### Long-term (Khi cần)
7. [ ] Add pluralization support (`1 item` vs `2 items`)
8. [ ] Add date/number formatting helpers
9. [ ] Consider server-side i18n cho SEO
10. [ ] Add more languages (中文, 日本語, etc.)

## 🐛 Known Issues

### None! 🎉

Build successful, no TypeScript errors, no runtime errors.

## 💡 Tips

1. **Bắt đầu từ page nhỏ nhất** - Dashboard hoặc Login
2. **Commit frequently** - Mỗi page một commit
3. **Check console** - Tìm missing keys
4. **Toggle switcher** - Test cả 2 ngôn ngữ
5. **Use search** - Tìm hardcoded text: `grep -r "Quản lý" src/`

## 🙏 Credits

Triển khai dựa trên:
- Next.js App Router best practices
- React Context API
- TypeScript type safety
- FastRezu existing architecture

---

**Status:** ✅ **READY FOR IMPLEMENTATION**

Build successful! Hệ thống i18n đã sẵn sàng. Bây giờ chỉ cần apply vào từng page một cách từ từ.

**Tạo bởi:** FastRezu Team  
**Ngày:** November 10, 2025  
**Version:** 1.0.0
