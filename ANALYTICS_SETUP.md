# FastRezu Logging & Analytics Setup

## 📊 Tổng quan

Hệ thống logging của FastRezu được thiết kế để theo dõi và phân tích hành vi người dùng qua hai luồng chính:

1. **Creator Funnel (Wizard)**: Người dùng tạo CV mới từ đầu
2. **Checker Funnel (Upload)**: Người dùng kiểm tra CV có sẵn

Chúng ta sử dụng **Vercel Analytics** để tracking events với khả năng:
- ✅ Real-time analytics dashboard
- ✅ Custom events tracking
- ✅ Server-side và client-side tracking
- ✅ Zero config deployment trên Vercel
- ✅ Privacy-focused (không cần cookie consent)

## 📦 Cài đặt

Package `@vercel/analytics` đã được cài đặt trong `package.json`:

```json
{
  "dependencies": {
    "@vercel/analytics": "^1.5.0",
    "@vercel/speed-insights": "^1.2.0"
  }
}
```

## 🏗️ Kiến trúc

```
src/
├── lib/
│   ├── analytics.ts       # Client-side event tracking
│   └── logger.ts          # Server-side logging & performance monitoring
├── app/
│   └── layout.tsx         # Analytics component đã được tích hợp
```

## 📝 Danh sách Events

### 1. 🎯 Activation & Funnel Completion

#### Creator Funnel (Wizard)

| Event | Mô tả | Parameters |
|-------|-------|------------|
| `CV_Created` | Người dùng tạo CV mới | `user_id`, `cv_id`, `language` |
| `Wizard_Step_Completed` | **QUAN TRỌNG NHẤT** - Hoàn thành mỗi bước wizard | `user_id`, `cv_id`, `step_index`, `step_name`, `time_spent_seconds?` |
| `CV_Exported` | Tải xuống PDF/Text (success event) | `user_id`, `cv_id`, `export_type` |
| `Wizard_Completed` | Hoàn thành toàn bộ wizard | `user_id`, `cv_id`, `language`, `total_time_minutes`, `ai_feature_usage_count` |

#### Checker Funnel (/check-cv)

| Event | Mô tả | Parameters |
|-------|-------|------------|
| `Checker_Flow_Started` | Truy cập trang check-cv | `user_id` |
| `Checker_File_Uploaded` | Upload file thành công | `user_id`, `file_type`, `file_size_kb` |
| `Checker_Text_Corrected` | Xác nhận text đã trích xuất | `user_id`, `text_length_original`, `text_length_corrected`, `edit_percentage` |
| `Checker_Score_Generated` | Tạo ATS score (success event) | `user_id`, `final_score`, `with_jd` |

### 2. 🤖 AI Engagement

| Event | Mô tả | Parameters |
|-------|-------|------------|
| `AI_Feature_Used` | Sử dụng bất kỳ tính năng AI nào | `user_id`, `cv_id?`, `language`, `feature_name`, `response_time_ms?`, `success` |
| `AI_Suggestion_Applied` | Áp dụng gợi ý AI | `user_id`, `cv_id`, `suggestion_type`, `priority`, `suggestion_index?` |
| `AI_Suggestion_Dismissed` | Bỏ qua gợi ý AI | `user_id`, `cv_id`, `suggestion_type`, `priority` |

**AI Features:**
- `analyze_jd` - Phân tích Job Description
- `generate_summary` - Tạo summary/objective
- `write_experience` - Viết kinh nghiệm làm việc
- `improve_bullet` - Cải thiện bullet point
- `extract_skills` - Trích xuất kỹ năng
- `score_cv_wizard` - Chấm điểm ATS trong wizard
- `score_cv_checker` - Chấm điểm ATS trong checker
- `generate_projects` - Tạo mô tả dự án
- `optimize_keywords` - Tối ưu từ khóa

### 3. 📉 Friction & Feedback

| Event | Mô tả | Parameters |
|-------|-------|------------|
| `API_Error` | Lỗi từ API calls | `user_id?`, `api_route`, `status_code`, `error_message`, `error_type?` |
| `Frontend_Error` | Lỗi frontend (ErrorBoundary) | `user_id?`, `error_message`, `component_stack?`, `error_boundary?` |
| `Feedback_Submitted` | Gửi feedback | `user_id?`, `feedback_type`, `priority?`, `has_attachment?` |

### 4. 👤 User Engagement

| Event | Mô tả | Parameters |
|-------|-------|------------|
| `Page_View` | Xem trang | `user_id?`, `page_path`, `page_title?`, `referrer?` |
| `Auth_Event` | Sự kiện authentication | `event_type`, `user_id?`, `method?` |
| `Template_Selected` | Chọn template CV | `user_id`, `cv_id`, `template_name` |
| `Auto_Save` | Tự động lưu | `user_id`, `cv_id`, `section_changed`, `changes_since_last_save?` |

## 🔧 Sử dụng

### Client-Side Tracking (Components/Pages)

```typescript
import {
  trackCVCreated,
  trackWizardStepCompleted,
  trackAIFeatureUsed,
  trackCVExported,
} from '@/lib/analytics';

// 1. Track khi tạo CV mới
const handleCreateCV = async () => {
  const cvId = await createNewCV();
  
  trackCVCreated({
    userId: user.id,
    cvId: cvId,
    language: selectedLanguage, // 'vi' | 'en'
  });
};

// 2. Track wizard steps - QUAN TRỌNG!
const handleNextStep = (currentStep: number) => {
  trackWizardStepCompleted({
    userId: user.id,
    cvId: currentCVId,
    stepIndex: currentStep,
    stepName: getStepName(currentStep), // 'PersonalInfo', 'Summary', etc.
    timeSpentSeconds: calculateTimeSpent(), // Optional
  });
};

// 3. Track AI feature usage
const handleAIGenerate = async () => {
  const startTime = performance.now();
  
  try {
    const result = await generateSummary(jdText);
    const duration = performance.now() - startTime;
    
    trackAIFeatureUsed({
      userId: user.id,
      cvId: currentCVId,
      language: 'vi',
      featureName: 'generate_summary',
      responseTimeMs: duration,
      success: true,
    });
  } catch (error) {
    trackAIFeatureUsed({
      userId: user.id,
      cvId: currentCVId,
      language: 'vi',
      featureName: 'generate_summary',
      success: false,
    });
  }
};

// 4. Track export
const handleExportPDF = () => {
  trackCVExported({
    userId: user.id,
    cvId: currentCVId,
    exportType: 'pdf',
  });
};
```

### Server-Side Tracking (API Routes)

```typescript
import { logger, logAIOperation, measurePerformance } from '@/lib/logger';
import { track } from '@vercel/analytics/server';

// 1. Sử dụng logger cơ bản
export async function POST(req: Request) {
  const requestLogger = logger.child({
    path: req.url,
    method: req.method,
  });

  try {
    requestLogger.info('Processing CV analysis request');
    
    // Your logic here
    
    requestLogger.info('Request completed successfully');
    return Response.json({ success: true });
  } catch (error) {
    requestLogger.error('Request failed', error);
    return Response.json({ error: 'Failed' }, { status: 500 });
  }
}

// 2. Measure performance
export async function POST(req: Request) {
  return measurePerformance(
    '/api/ai/score-cv',
    async () => {
      const { cvText, jdText } = await req.json();
      const score = await calculateATSScore(cvText, jdText);
      return Response.json({ score });
    },
    { userId: 'user_123' }
  );
}

// 3. Log AI operations
export async function POST(req: Request) {
  const { prompt, language } = await req.json();
  
  const summary = await logAIOperation(
    'generate_summary',
    async () => {
      return await openai.generateSummary(prompt);
    },
    {
      userId: 'user_123',
      cvId: 'cv_456',
      language: language,
      featureName: 'generate_summary',
    }
  );
  
  return Response.json({ summary });
}

// 4. Track server-side events
export async function POST(req: Request) {
  'use server';
  
  await track('Purchase', {
    user_id: 'user_123',
    plan: 'premium',
    amount: 99000,
  });
}
```

### Error Tracking

```typescript
// In ErrorBoundary component
import { trackFrontendError } from '@/lib/analytics';

class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    trackFrontendError({
      userId: this.props.userId,
      errorMessage: error.message,
      componentStack: errorInfo.componentStack,
      errorBoundary: 'RootErrorBoundary',
    });
  }
}

// In API error handler
import { trackAPIError } from '@/lib/analytics';

async function handleAPIError(error: unknown, apiRoute: string) {
  if (error instanceof AppError) {
    trackAPIError({
      userId: getCurrentUserId(),
      apiRoute: apiRoute,
      statusCode: error.statusCode,
      errorMessage: error.message,
      errorType: error.type,
    });
  }
}
```

## 📊 Xem Analytics

### Vercel Dashboard

1. Truy cập: https://vercel.com/[your-team]/[project-name]/analytics
2. Tab "Events" để xem custom events
3. Filter theo event name, user_id, cv_id, etc.
4. Export data nếu cần phân tích sâu hơn

### Debug Mode (Development)

Trong `app/layout.tsx`, bật debug mode:

```tsx
<Analytics debug={process.env.NODE_ENV === 'development'} />
```

Tất cả events sẽ được log ra console khi development.

## 🎯 Key Metrics để theo dõi

### Activation Metrics
- **CV Creation Rate**: Số người tạo CV mới / Số visitors
- **Wizard Completion Rate**: `Wizard_Completed` / `CV_Created`
- **Export Rate**: `CV_Exported` / `CV_Created`
- **Checker Success Rate**: `Checker_Score_Generated` / `Checker_Flow_Started`

### Engagement Metrics
- **AI Feature Usage**: Tần suất sử dụng mỗi AI feature
- **Suggestion Apply Rate**: `AI_Suggestion_Applied` / Total suggestions shown
- **Average Time per Step**: Từ `time_spent_seconds` trong `Wizard_Step_Completed`

### Friction Metrics
- **Error Rate**: Tỷ lệ `API_Error` / Total requests
- **Drop-off Points**: Bước nào trong wizard có drop-off cao nhất
- **AI Success Rate**: % AI calls thành công

### Funnel Analysis
```
Creator Funnel:
CV_Created -> Wizard_Step_Completed (each step) -> Wizard_Completed -> CV_Exported

Checker Funnel:
Checker_Flow_Started -> Checker_File_Uploaded -> Checker_Text_Corrected -> Checker_Score_Generated
```

## 🚀 Deployment

1. **Automatic**: Khi deploy lên Vercel, analytics tự động hoạt động
2. **Environment**: Chỉ track ở production (kiểm tra bằng `process.env.NODE_ENV`)
3. **Cost**: Free tier: 10,000 events/month, Pro: 100,000 events/month

## 🔒 Privacy & GDPR

- Vercel Analytics **không sử dụng cookies**
- Không cần cookie consent banner
- Data được hash và anonymize
- Tuân thủ GDPR, CCPA
- User có thể opt-out bằng `beforeSend` callback

## 📚 Best Practices

1. **Track Events ở điểm quan trọng nhất**:
   - Đầu và cuối mỗi funnel
   - Khi user interact với AI features
   - Khi có lỗi xảy ra

2. **Thêm context hữu ích**:
   - `user_id` để phân tích theo user
   - `cv_id` để track journey của mỗi CV
   - `language` để so sánh VI vs EN
   - `response_time_ms` để monitor performance

3. **Đừng over-track**:
   - Tránh track mọi click
   - Focus vào business metrics
   - Respect user privacy

4. **Error Handling**:
   - Luôn wrap tracking trong try-catch
   - Đừng để tracking failure làm crash app
   - Log ra console khi tracking fails (debug mode)

## 🧪 Testing

```typescript
// Mock tracking trong tests
jest.mock('@vercel/analytics', () => ({
  track: jest.fn(),
}));

// Verify events được track
import { track } from '@vercel/analytics';

test('should track CV creation', () => {
  createCV();
  expect(track).toHaveBeenCalledWith('CV_Created', {
    user_id: 'test_user',
    cv_id: 'test_cv',
    language: 'vi',
  });
});
```

## 🔄 Migration Plan

### Phase 1: Setup (✅ Done)
- [x] Install packages
- [x] Create analytics & logger utilities
- [x] Integrate `<Analytics />` component

### Phase 2: Implement Core Events (Next Steps)
- [ ] Track `Wizard_Step_Completed` trong wizard flow
- [ ] Track `CV_Created` và `CV_Exported`
- [ ] Track `Checker_*` events
- [ ] Track `AI_Feature_Used` cho tất cả AI features

### Phase 3: Error & Performance Tracking
- [ ] Integrate với ErrorBoundary
- [ ] Integrate với API error handler
- [ ] Add performance monitoring

### Phase 4: Analysis & Optimization
- [ ] Monitor metrics trong 1-2 tuần
- [ ] Identify drop-off points
- [ ] Optimize based on data
- [ ] Add A/B testing nếu cần

## 📞 Support

- Vercel Analytics Docs: https://vercel.com/docs/analytics
- FastRezu Analytics Dashboard: https://vercel.com/[your-team]/fastrezu/analytics
