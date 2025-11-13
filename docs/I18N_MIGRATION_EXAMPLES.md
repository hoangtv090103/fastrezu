# Ví dụ triển khai i18n cho Dashboard

## Before (Hardcoded text)

```tsx
"use client";

export default function Dashboard() {
  return (
    <div>
      <h1>Quản lý CV</h1>
      <p>Tạo và quản lý CV của bạn với sự hỗ trợ của AI</p>
      
      <button>Tạo CV mới</button>
      
      {cvs.length === 0 ? (
        <div>
          <h2>Chưa có CV nào</h2>
          <p>Bắt đầu tạo CV đầu tiên của bạn với sự hỗ trợ của AI.</p>
        </div>
      ) : (
        <div>
          {cvs.map(cv => (
            <CVCard
              key={cv.id}
              title={cv.title}
              lastModified="Sửa đổi lần cuối"
              atsScore={cv.ats_score}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

## After (With i18n)

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

## Translation Keys Used

```json
{
  "dashboard": {
    "title": "Quản lý CV",
    "subtitle": "Tạo và quản lý CV của bạn với sự hỗ trợ của AI",
    "createNew": "Tạo CV mới",
    "noCVTitle": "Chưa có CV nào",
    "noCVDesc": "Bắt đầu tạo CV đầu tiên của bạn với sự hỗ trợ của AI.",
    "lastModified": "Sửa đổi lần cuối"
  }
}
```

---

## Các component khác cần áp dụng

### 1. WizardPanel (Editor)

**Keys cần:**
```json
{
  "wizard": {
    "title": "Tạo CV của bạn",
    "steps": {
      "language": "Ngôn ngữ",
      "jd": "Phân tích JD",
      "personal": "Thông tin cá nhân",
      "experience": "Kinh nghiệm",
      "skills": "Kỹ năng"
    },
    "next": "Tiếp tục",
    "back": "Quay lại",
    "skip": "Bỏ qua"
  }
}
```

### 2. PersonalInfoStep

**Keys cần:**
```json
{
  "personalInfo": {
    "title": "Thông tin cá nhân",
    "fullName": "Họ và tên",
    "email": "Email",
    "phone": "Số điện thoại",
    "placeholders": {
      "fullName": "Nguyễn Văn A",
      "email": "example@email.com"
    }
  }
}
```

### 3. CheckCV Page

**Keys cần:**
```json
{
  "checkCV": {
    "title": "Kiểm tra CV",
    "uploadFile": "Tải file lên",
    "analyzing": "Đang phân tích...",
    "atsScore": "Điểm ATS",
    "suggestions": "Gợi ý cải thiện"
  }
}
```

### 4. Feedback Page

**Keys cần:**
```json
{
  "feedback": {
    "title": "Gửi phản hồi",
    "type": "Loại phản hồi",
    "message": "Nội dung phản hồi",
    "submit": "Gửi phản hồi",
    "success": "Cảm ơn bạn đã gửi phản hồi!"
  }
}
```

---

## Checklist triển khai từng trang

- [ ] **Dashboard** (`/dashboard`)
  - [ ] Title và subtitle
  - [ ] Create button
  - [ ] Empty state message
  - [ ] CV card labels
  
- [ ] **Editor/Wizard** (`/editor/[cvId]`)
  - [ ] Wizard title
  - [ ] Step names
  - [ ] Navigation buttons
  - [ ] All step forms
  
- [ ] **Check CV** (`/check-cv`)
  - [ ] Page title
  - [ ] Upload instructions
  - [ ] Status messages
  - [ ] Results labels
  
- [ ] **Feedback** (`/feedback`)
  - [ ] Form labels
  - [ ] Type options
  - [ ] Success/error messages
  
- [ ] **Auth** (`/login`, `/auth/error`)
  - [ ] Login form
  - [ ] Error messages
  - [ ] Magic link text

---

## Tips khi refactor

1. **Bắt đầu từ component nhỏ nhất** - Dễ test và verify
2. **Thay thế từng section** - Không cần làm hết một lúc
3. **Test cả 2 ngôn ngữ** - Toggle language switcher để verify
4. **Check console warnings** - Tìm missing keys
5. **Commit từng trang** - Dễ rollback nếu có lỗi
