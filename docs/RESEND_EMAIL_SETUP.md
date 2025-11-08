# Hướng dẫn cấu hình Email Notifications với Resend

## Tổng quan

Hệ thống đã được tích hợp Resend để gửi email thông báo tự động cho team khi có feedback mới từ người dùng.

## Tính năng

✅ **Thông báo tức thì**: Nhận email ngay khi có feedback mới
✅ **Chi tiết đầy đủ**: Email chứa tất cả thông tin feedback (loại, độ ưu tiên, nội dung, tệp đính kèm)
✅ **Giao diện đẹp**: Email HTML được thiết kế chuyên nghiệp với gradient và responsive
✅ **Non-blocking**: Lỗi gửi email không ảnh hưởng đến việc lưu feedback
✅ **Reply-to**: Có thể trả lời trực tiếp email của người gửi feedback

## Cấu hình

### Bước 1: Tạo tài khoản Resend

1. Truy cập [resend.com](https://resend.com) và đăng ký tài khoản
2. Xác thực email của bạn

### Bước 2: Tạo API Key

1. Đăng nhập vào Resend Dashboard
2. Vào phần **API Keys** trong menu bên trái
3. Click **"Create API Key"**
4. Đặt tên cho key (ví dụ: "FastRezu Production")
5. Chọn quyền: **"Sending access"** (đủ cho việc gửi email)
6. Copy API key (chỉ hiển thị 1 lần duy nhất!)

### Bước 3: Cấu hình biến môi trường

Thêm các biến sau vào file `.env.local`:

```bash
# Resend API Key (bắt buộc)
RESEND_API_KEY=re_your_api_key_here

# Email gửi đi (tùy chọn, mặc định: onboarding@resend.dev)
# Nếu chưa verify domain, dùng email test của Resend
RESEND_FROM_EMAIL=FastRezu <onboarding@resend.dev>

# Email nhận feedback (bắt buộc)
TEAM_EMAIL=your-team-email@gmail.com
```

### Bước 4: Verify Domain (Tùy chọn - cho Production)

Để gửi email từ domain riêng của bạn (ví dụ: `notifications@fastrezu.com`):

1. Vào **Domains** trong Resend Dashboard
2. Click **"Add Domain"**
3. Nhập tên domain của bạn (ví dụ: `fastrezu.com`)
4. Resend sẽ cung cấp các DNS records (SPF, DKIM, DMARC)
5. Thêm các records này vào DNS của domain (qua Cloudflare, Namecheap, etc.)
6. Đợi vài phút và click **"Verify"**
7. Sau khi verify thành công, cập nhật `RESEND_FROM_EMAIL`:

```bash
RESEND_FROM_EMAIL=FastRezu <notifications@fastrezu.com>
```

## Testing

### Test trong Development

1. Đảm bảo đã cấu hình đầy đủ các biến môi trường
2. Khởi động dev server: `bun run dev`
3. Truy cập trang feedback: `http://localhost:3000/feedback`
4. Gửi một feedback thử
5. Kiểm tra email trong hòm thư của `TEAM_EMAIL`

### Gửi feedback từ API

```bash
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "feedback_type": "bug_report",
    "subject": "Test bug report",
    "message": "This is a test feedback",
    "user_email": "test@example.com",
    "priority": "high"
  }'
```

## Nội dung Email

Email thông báo sẽ bao gồm:

### Header
- 🔔 Icon và tiêu đề "Feedback mới từ FastRezu"
- Gradient màu xanh chuyên nghiệp

### Thông tin chính
- **Loại feedback**: Bug report / Feature request / General / Praise
- **Độ ưu tiên**: High / Medium / Low (với màu sắc)
- **Người gửi**: Email hoặc "Ẩn danh"
- **Tiêu đề**: Subject của feedback
- **Thời gian**: Format theo múi giờ Việt Nam

### Nội dung
- Message của người dùng (format đẹp với background)

### Tệp đính kèm
- Danh sách file đính kèm (nếu có)
- Tên file, kích thước

### CTA
- Nút "Xem chi tiết trong Database" link trực tiếp đến Supabase

### Footer
- Feedback ID
- Note "Email tự động"

## Troubleshooting

### Không nhận được email?

1. **Kiểm tra biến môi trường**:
   ```bash
   # Xem các biến đã được load chưa
   echo $RESEND_API_KEY
   echo $TEAM_EMAIL
   ```

2. **Kiểm tra logs**:
   - Mở terminal dev server
   - Tìm log "Failed to send notification email" nếu có lỗi
   - Log sẽ chỉ ra lỗi cụ thể (invalid API key, wrong email format, etc.)

3. **Kiểm tra Resend Dashboard**:
   - Vào [Resend Dashboard > Logs](https://resend.com/logs)
   - Xem lịch sử gửi email và status
   - Kiểm tra bounce/complaint rates

4. **Kiểm tra spam folder**:
   - Email có thể bị đánh dấu spam lần đầu
   - Mark as "Not spam" để các email sau vào inbox

### Rate Limits

- **Free plan**: 100 emails/day, 3000 emails/month
- **Paid plan**: Từ $20/tháng cho 50,000 emails

Nếu cần gửi nhiều hơn, nâng cấp plan trong Resend Dashboard.

### Email bị reject?

Nếu gửi email từ domain chưa verify, một số email provider có thể reject:
- **Gmail**: Thường chấp nhận email từ `onboarding@resend.dev`
- **Corporate email**: Có thể yêu cầu verify domain
- **Giải pháp**: Verify domain của bạn (xem Bước 4 ở trên)

## Best Practices

1. **Verify domain cho production**: Tăng deliverability rate lên 99%
2. **Monitor logs**: Định kỳ kiểm tra Resend logs để phát hiện vấn đề
3. **Set up webhooks** (optional): Nhận thông báo về bounce, complaint, delivery
4. **Test thoroughly**: Gửi test email trước khi deploy production

## Tham khảo

- [Resend Documentation](https://resend.com/docs)
- [Resend Node.js SDK](https://github.com/resend/resend-node)
- [Resend Examples](https://github.com/resend/resend-examples)

## Support

Nếu gặp vấn đề, liên hệ:
- Resend Support: [resend.com/support](https://resend.com/support)
- FastRezu Team: team@fastrezu.com
