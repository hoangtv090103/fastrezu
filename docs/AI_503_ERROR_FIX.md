# Fix Lỗi 503 - AI Service Temporarily Unavailable

## Vấn đề
Khi kiểm tra điểm ATS trong tính năng check-cv, hệ thống gặp lỗi 503 từ Google Gemini API:
```
Error: 503 status code (no body)
AI API error: Error: Failed to get AI response
```

## Nguyên nhân
1. **Google Gemini API tạm thời quá tải** - Lỗi 503 Service Unavailable
2. **Retry logic chưa đủ mạnh** - Chỉ retry 3 lần với delay ngắn
3. **Error handling chưa specific** - Không phân biệt các loại lỗi
4. **Timeout quá ngắn** - 120s có thể không đủ cho Gemini API

## Giải pháp đã triển khai

### 1. Cải thiện Retry Logic (`src/lib/openai.ts`)

#### Tăng số lần retry và timeout
- **Trước:** 3 retries, 120s timeout
- **Sau:** 5 retries, 180s timeout

#### Thêm jitter vào exponential backoff
```typescript
// Exponential backoff with jitter: 1s, 2s, 4s, 8s, 16s (+ random 0-500ms)
const baseBackoff = baseDelay * Math.pow(2, attempt);
const jitter = Math.random() * 500;
const delay = baseBackoff + jitter;
```

#### Mở rộng danh sách lỗi retryable
Thêm các status code và error patterns:
- `503` - Service Unavailable
- `500` - Internal Server Error
- `429` - Too Many Requests
- Network errors: `ECONNRESET`, `ETIMEDOUT`, `ECONNREFUSED`
- Message patterns: `timeout`, `Service Unavailable`, `Internal Server Error`

### 2. Cải thiện Error Messages

#### Trong `src/lib/openai.ts`
```typescript
// Provide more specific error messages
if (statusCode === 503) {
  throw new Error('AI service temporarily unavailable (503). Please try again in a moment.');
} else if (statusCode === 429) {
  throw new Error('Too many requests. Please wait a moment before trying again.');
} else if (statusCode === 500) {
  throw new Error('AI service internal error. Please try again.');
}
```

#### Trong `src/app/api/ai/score-uploaded-cv/route.ts`
```typescript
return NextResponse.json(
  { 
    error: isAIError ? errorMessage : "Internal server error",
    details: isAIError ? "The AI service is experiencing high load. Please try again in a few moments." : undefined
  },
  { status: isAIError ? 503 : 500 }
);
```

### 3. Cải thiện UX (`src/app/(authenticated)/check-cv/page.tsx`)

#### Tăng retry và backoff cho client
- **Trước:** 2 retries, 1000ms backoff
- **Sau:** 3 retries, 2000ms backoff

#### Thông báo lỗi thân thiện với người dùng
```typescript
if (is503Error) {
  const friendlyMessage = "Dịch vụ AI đang quá tải. Vui lòng thử lại sau vài giây. Hệ thống đang tự động thử lại...";
  setError(friendlyMessage);
  showErrorToast(friendlyMessage, 'vi');
}
```

### 4. Enhanced Logging

Thêm structured logging để debug:
```typescript
console.error('AI API error:', {
  message: error instanceof Error ? error.message : String(error),
  status: statusCode,
  type: errorObj?.type,
  code: errorObj?.code
});
```

## Kết quả

### Trước khi fix:
- ❌ Lỗi 503 => Fail ngay lập tức
- ❌ User message: "Failed to get AI response"
- ❌ Không retry đủ cho transient errors

### Sau khi fix:
- ✅ Retry 5 lần với exponential backoff + jitter
- ✅ Timeout tăng lên 180s
- ✅ Error messages cụ thể và thân thiện
- ✅ Client-side retry thêm 3 lần
- ✅ Tổng cộng có thể retry lên đến 5 (server) × 3 (client) = 15 attempts
- ✅ Total max time: ~180s + (2s + 4s + 8s) backoff = ~194s

## Testing

### Manual Testing
1. Upload CV file trong check-cv
2. Confirm text và nhập JD (optional)
3. Click "Chấm điểm CV"
4. Kiểm tra:
   - Loading state hiển thị đúng
   - Nếu gặp lỗi 503, hệ thống tự động retry
   - Error message thân thiện hiển thị cho user
   - Sau khi retry thành công, kết quả hiển thị đúng

### Monitoring
Theo dõi logs để xác nhận:
```bash
[OpenAI] Retry attempt 1/5 after 1000ms due to: { message: '503 status code', status: 503 }
[OpenAI] Retry attempt 2/5 after 2500ms due to: { message: '503 status code', status: 503 }
...
```

## Best Practices đã áp dụng

1. **Exponential Backoff with Jitter** - Tránh thundering herd
2. **Specific Error Handling** - Phân biệt lỗi retryable và non-retryable
3. **User-Friendly Messages** - Thông báo dễ hiểu cho người dùng
4. **Structured Logging** - Dễ debug và monitor
5. **Graceful Degradation** - Retry nhiều lần trước khi fail

## Tài liệu liên quan
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [OpenAI API Error Codes](https://platform.openai.com/docs/guides/error-codes)
- [Exponential Backoff Pattern](https://en.wikipedia.org/wiki/Exponential_backoff)

## Notes
- Gemini API có thể gặp 503 khi traffic cao
- Retry với jitter giúp tránh nhiều request cùng retry 1 lúc
- Timeout 180s phù hợp cho CV dài hoặc JD phức tạp
- Cân nhắc implement queue system nếu lỗi 503 xảy ra thường xuyên
