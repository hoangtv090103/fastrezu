# FastRezu - AI-Powered CV Builder

FastRezu là một ứng dụng web được xây dựng bằng Next.js để tạo CV được tối ưu hóa bởi AI với hệ thống chấm điểm ATS (Applicant Tracking System).

## ✨ Tính năng chính

### 🤖 AI-Powered Features
- **Phân tích Job Description (JD)**: AI quét và trích xuất từ khóa quan trọng từ mô tả công việc
- **Soạn thảo nội dung CV**: AI tự động viết các gạch đầu dòng mô tả thành tích dựa trên từ khóa JD
- **Chấm điểm ATS**: Hệ thống đánh giá mức độ tương thích của CV với ATS
- **Cải thiện bullet points**: AI đề xuất cách viết lại các điểm mô tả để tối ưu hóa

### 📝 CV Builder
- **Wizard-based Editor**: Giao diện từng bước để tạo CV dễ dàng
- **Multi-language Support**: Hỗ trợ tạo CV bằng tiếng Việt và tiếng Anh
- **Real-time Preview**: Xem trước CV ngay lập tức khi chỉnh sửa
- **Auto-save**: Tự động lưu tiến trình
- **Export Options**: Xuất CV dưới dạng PDF

### 📊 Dashboard & Management
- **CV Dashboard**: Quản lý nhiều CV trong một tài khoản
- **ATS Score Tracking**: Theo dõi điểm ATS của từng CV
- **JD Analysis History**: Lưu trữ lịch sử phân tích JD

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth với Magic Links
- **AI**: OpenAI GPT API
- **PDF Generation**: jsPDF, html2canvas
- **Deployment**: Vercel

## 🚀 Cài đặt và Chạy

### 1. Clone repository
```bash
git clone <repository-url>
cd fastrezu-ladipage
```

### 2. Cài đặt dependencies
```bash
npm install
# hoặc
yarn install
# hoặc
bun install
```

### 3. Cấu hình Environment Variables

Tạo file `.env.local` trong thư mục gốc:

```bash
# Site URL cho production deployment
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key
```

**Lưu ý quan trọng**: 
- Đối với production, `NEXT_PUBLIC_SITE_URL` phải được set đúng domain để magic link authentication hoạt động
- Trong development, có thể bỏ qua biến này (sẽ dùng localhost)

### 4. Setup Database

Xem hướng dẫn chi tiết trong [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) để:
- Tạo project Supabase
- Cấu hình authentication
- Chạy database schema
- Test API

### 5. Chạy development server

```bash
npm run dev
# hoặc
yarn dev
# hoặc
bun dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## 📁 Cấu trúc Project

```
src/
├── app/                    # Next.js App Router
│   ├── (authenticated)/    # Protected routes
│   │   ├── dashboard/      # CV dashboard
│   │   └── editor/         # CV editor
│   ├── api/               # API routes
│   │   ├── ai/            # AI endpoints
│   │   ├── cv/            # CV management
│   │   └── jd/            # Job description
│   └── auth/              # Authentication
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── cv/                # CV-related components
│   ├── dashboard/         # Dashboard components
│   ├── editor/            # CV editor components
│   └── ui/                # UI components
├── contexts/              # React contexts
├── lib/                   # Utility libraries
└── types/                 # TypeScript types
```

## 🔧 Scripts

```bash
npm run dev      # Chạy development server với Turbopack
npm run build    # Build production với Turbopack
npm run start    # Chạy production server
npm run lint     # Chạy ESLint
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push code lên GitHub
2. Connect repository với Vercel
3. Set environment variables trong Vercel dashboard
4. Deploy tự động

### Manual Deployment

```bash
npm run build
npm run start
```

## 📚 API Endpoints

### AI Endpoints
- `POST /api/ai/analyze-jd` - Phân tích Job Description
- `POST /api/ai/extract-skills` - Trích xuất kỹ năng từ JD
- `POST /api/ai/generate-summary` - Tạo summary cho CV
- `POST /api/ai/improve-bullet` - Cải thiện bullet points
- `POST /api/ai/score-cv` - Chấm điểm ATS cho CV
- `POST /api/ai/write-experience` - Viết mô tả kinh nghiệm

### CV Management
- `POST /api/cv/create` - Tạo CV mới
- `GET /api/cv/list` - Lấy danh sách CV
- `PUT /api/cv/[cvId]/update` - Cập nhật CV
- `DELETE /api/cv/[cvId]/delete` - Xóa CV

### Job Description
- `GET /api/jd/list` - Lấy danh sách JD đã phân tích
- `DELETE /api/jd/delete` - Xóa JD analysis

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

Nếu gặp vấn đề, vui lòng tạo issue trên GitHub hoặc liên hệ team phát triển.
