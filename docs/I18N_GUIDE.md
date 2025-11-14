# FastRezu Internationalization (i18n) Guide

## 📖 Tổng quan

FastRezu sử dụng hệ thống i18n tự build đơn giản và hiệu quả, phù hợp với kiến trúc Next.js App Router và Client Components.

### Đặc điểm chính:
- ✅ **Tách biệt UI language và CV language** - Người dùng có thể dùng giao diện tiếng Việt để tạo CV tiếng Anh và ngược lại
- ✅ **Type-safe** - TypeScript autocomplete cho tất cả translation keys
- ✅ **Lightweight** - Không cần dependency thêm, chỉ dùng React Context
- ✅ **Persistent** - UI language được lưu trong localStorage
- ✅ **Interpolation** - Hỗ trợ variables trong translations (ví dụ: `{{name}}`)

## 🏗️ Cấu trúc

```
src/
├── dictionaries/
│   ├── vi.json          # Vietnamese translations
│   └── en.json          # English translations
├── contexts/
│   └── LanguageContext.tsx   # Language provider
├── hooks/
│   └── useTranslation.ts     # Translation hook
└── components/
    └── ui/
        └── LanguageSwitcher.tsx  # Language switcher component
```

## 🚀 Cách sử dụng

### 1. Trong Component

```tsx
"use client";

import { useTranslation } from "@/hooks/useTranslation";

export default function MyComponent() {
  const { t, locale } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.subtitle')}</p>
      
      {/* With interpolation */}
      <p>{t('wizard.stepProgress', { current: 2, total: 5 })}</p>
      
      {/* Current locale */}
      <p>Current language: {locale}</p>
    </div>
  );
}
```

### 2. Thêm LanguageSwitcher vào Header

```tsx
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

export default function Header() {
  return (
    <header>
      {/* ... other header content ... */}
      <LanguageSwitcher />
    </header>
  );
}
```

### 3. Thay đổi UI language programmatically

```tsx
"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export default function MyComponent() {
  const { language, setLanguage } = useLanguage();

  return (
    <button onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}>
      Toggle Language
    </button>
  );
}
```

## 📝 Thêm translations mới

### Bước 1: Thêm vào `vi.json`

```json
{
  "myFeature": {
    "title": "Tiêu đề tính năng",
    "description": "Mô tả chi tiết",
    "action": "Hành động"
  }
}
```

### Bước 2: Thêm vào `en.json`

```json
{
  "myFeature": {
    "title": "Feature Title",
    "description": "Detailed description",
    "action": "Action"
  }
}
```

### Bước 3: Sử dụng trong component

```tsx
const { t } = useTranslation();

<h1>{t('myFeature.title')}</h1>
```

## 🎯 Best Practices

### 1. Tổ chức translations theo module

```json
{
  "dashboard": { ... },
  "editor": { ... },
  "checkCV": { ... },
  "feedback": { ... }
}
```

### 2. Dùng nested keys cho structure rõ ràng

```json
{
  "auth": {
    "login": "Đăng nhập",
    "logout": "Đăng xuất",
    "errors": {
      "invalidCredentials": "Thông tin không hợp lệ",
      "accountNotFound": "Không tìm thấy tài khoản"
    }
  }
}
```

### 3. Interpolation cho dynamic content

```json
{
  "greeting": "Xin chào, {{name}}!",
  "itemsCount": "{{count}} mục"
}
```

```tsx
t('greeting', { name: 'John' })
// => "Xin chào, John!"

t('itemsCount', { count: 5 })
// => "5 mục"
```

### 4. Fallback cho missing keys

Nếu key không tồn tại, hệ thống sẽ:
1. Trả về key đó (để dễ debug)
2. Log warning trong development mode

```tsx
t('non.existent.key')
// => "non.existent.key"
// Console: [i18n] Translation key missing: "non.existent.key" for locale: "vi"
```

## 🔄 UI Language vs CV Language

FastRezu tách biệt 2 loại ngôn ngữ:

### UI Language
- Ngôn ngữ giao diện người dùng
- Được quản lý bởi `LanguageContext`
- Lưu trong localStorage
- Sử dụng `useTranslation()` hook

### CV Language
- Ngôn ngữ nội dung CV
- Được quản lý bởi `CVEditorContext`
- Lưu trong database cùng CV
- Ảnh hưởng đến AI prompts và template labels

```tsx
// UI Language
const { language: uiLang } = useLanguage();

// CV Language
const { state } = useCVEditor();
const cvLang = state.cvData.language;
```

## 🎨 Ví dụ thực tế

### Dashboard với i18n

```tsx
"use client";

import { useTranslation } from "@/hooks/useTranslation";

export default function Dashboard() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.subtitle')}</p>
      
      <button>{t('dashboard.createNew')}</button>
      
      {cvs.length === 0 ? (
        <div>
          <h2>{t('dashboard.noCVTitle')}</h2>
          <p>{t('dashboard.noCVDesc')}</p>
        </div>
      ) : (
        <div>
          {cvs.map(cv => (
            <CVCard
              key={cv.id}
              title={cv.title}
              lastModified={t('dashboard.lastModified')}
              atsScore={cv.ats_score}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Form với i18n

```tsx
"use client";

import { useTranslation } from "@/hooks/useTranslation";

export default function PersonalInfoForm() {
  const { t } = useTranslation();

  return (
    <form>
      <div>
        <label>{t('personalInfo.fullName')}</label>
        <input
          type="text"
          placeholder={t('personalInfo.placeholders.fullName')}
        />
      </div>
      
      <div>
        <label>{t('personalInfo.email')}</label>
        <input
          type="email"
          placeholder={t('personalInfo.placeholders.email')}
        />
      </div>
      
      <button type="submit">{t('common.save')}</button>
      <button type="button">{t('common.cancel')}</button>
    </form>
  );
}
```

## 🧪 Testing

### Test translation keys

```tsx
import { getTranslation } from "@/hooks/useTranslation";

describe('Translations', () => {
  it('should return correct Vietnamese translation', () => {
    const { t } = getTranslation('vi');
    expect(t('common.loading')).toBe('Đang tải...');
  });

  it('should return correct English translation', () => {
    const { t } = getTranslation('en');
    expect(t('common.loading')).toBe('Loading...');
  });

  it('should handle interpolation', () => {
    const { t } = getTranslation('vi');
    expect(t('wizard.stepProgress', { current: 1, total: 5 }))
      .toBe('Bước 1 / 5');
  });
});
```

## 📊 Tiến độ triển khai

### ✅ Completed
- [x] Dictionary structure (vi.json, en.json)
- [x] LanguageContext
- [x] useTranslation hook
- [x] LanguageSwitcher component
- [x] Root layout integration

### 🚧 In Progress
- [ ] Dashboard page
- [ ] Wizard steps
- [ ] Editor components
- [ ] Check CV page
- [ ] Feedback page

### 📋 Todo
- [ ] Add more translations as needed
- [ ] Add pluralization support if needed
- [ ] Add date/time formatting helpers
- [ ] Add number formatting helpers

## 🔗 Resources

- [Next.js i18n Docs](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [React Context API](https://react.dev/reference/react/useContext)
- [TypeScript Type Safety](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

## 💡 Tips

1. **Luôn thêm translations cho cả 2 ngôn ngữ** - Tránh để missing keys
2. **Dùng nested keys** - Giúp tổ chức tốt hơn
3. **Test missing keys** - Đảm bảo fallback hoạt động đúng
4. **Consistent naming** - Dùng camelCase cho keys
5. **Document context** - Thêm comments cho keys phức tạp

## ❓ FAQ

### Q: Làm sao để thêm ngôn ngữ thứ 3 (ví dụ: 中文)?

A: 
1. Tạo `src/dictionaries/zh.json`
2. Thêm `'zh'` vào type `Language` trong `LanguageContext.tsx`
3. Thêm vào `dictionaries` object trong `useTranslation.ts`
4. Thêm option trong `LanguageSwitcher.tsx`

### Q: Làm sao để dùng i18n trong Server Components?

A: Dùng `getTranslation()` utility function:

```tsx
import { getTranslation } from "@/hooks/useTranslation";

export default function ServerPage() {
  const { t } = getTranslation('vi'); // hoặc lấy từ cookies/headers
  
  return <h1>{t('dashboard.title')}</h1>;
}
```

### Q: Có thể dùng thư viện như next-intl không?

A: Có thể, nhưng giải pháp hiện tại đã đủ tốt cho FastRezu vì:
- Đơn giản, dễ maintain
- Không thêm dependency
- Type-safe
- Linh hoạt tùy chỉnh

Nếu cần tính năng nâng cao (plural rules, date formatting phức tạp), có thể migrate sang next-intl sau.

---

**Tạo bởi:** FastRezu Team  
**Cập nhật:** November 10, 2025
