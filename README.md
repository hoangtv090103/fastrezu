# FastRezu - AI-Powered CV Builder

FastRezu is a Next.js web application for building AI-optimized CVs with ATS (Applicant Tracking System) scoring capabilities.

## 📚 Documentation

All technical and feature documentation is now organized in the `docs/` folder.

See:
- `docs/README.md` for documentation index and details
- `docs/INDEX.md` for a full list of available guides
- `docs/DATABASE_SECURITY_FIXES.md` for security audit results and recommendations

For Vietnamese documentation, see `docs/README.vi.md`.

### 🔒 Security

FastRezu follows security best practices:
- ✅ Database functions use secure search_path configuration
- ✅ Row Level Security (RLS) enabled on all sensitive tables
- ✅ Email notifications via Resend with proper error handling
- 🔔 Leaked password protection recommended (see security docs)

See `docs/DATABASE_SECURITY_FIXES.md` for detailed security information and current status.

## ✨ Key Features

### 🤖 AI-Powered Features
- **Job Description Analysis**: AI scans and extracts key keywords from job descriptions
- **CV Content Generation**: AI automatically writes achievement bullet points based on JD keywords
- **ATS Scoring**: System evaluates CV compatibility with ATS systems
- **Bullet Point Enhancement**: AI suggests improvements for better optimization

### 📝 CV Builder
- **Wizard-based Editor**: Step-by-step interface for easy CV creation
- **Multi-language Support**: Create CVs in Vietnamese and English
- **Real-time Preview**: Instant CV preview while editing
- **Auto-save**: Automatic progress saving
- **Export Options**: Export CV as PDF
 - **Structured Editing**: The in-app editor preserves structure (headings, lists) and emits Markdown to ensure accurate ATS “Formatting” analysis

### 📊 Dashboard & Management
- **CV Dashboard**: Manage multiple CVs in one account
- **ATS Score Tracking**: Track ATS scores for each CV
- **JD Analysis History**: Store job description analysis history

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Magic Links
- **AI**: OpenAI GPT API
- **PDF Generation**: jsPDF, html2canvas
- **Deployment**: Vercel

## 🚀 Installation & Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd fastrezu-ladipage
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
# or
bun install
```

### 3. Environment Variables Configuration

Create a `.env.local` file in the root directory:

```bash
# Site URL for production deployment
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key
```

**Important Notes**: 
- For production, `NEXT_PUBLIC_SITE_URL` must be set to your actual domain for magic link authentication to work
- In development, you can omit this variable (will use localhost)

### 4. Database Setup

See detailed instructions in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to:
- Create Supabase project
- Configure authentication
- Run database schema
- Test APIs

### 5. Run Development Server

```bash
npm run dev
# or
yarn dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

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

## 🔧 Available Scripts

```bash
npm run dev      # Run development server with Turbopack
npm run build    # Build for production with Turbopack
npm run start    # Run production server
npm run lint     # Run ESLint
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Automatic deployment

### Manual Deployment

```bash
npm run build
npm run start
```

## 📚 API Endpoints

### AI Endpoints
- `POST /api/ai/analyze-jd` - Analyze Job Description
- `POST /api/ai/extract-skills` - Extract skills from JD
- `POST /api/ai/generate-summary` - Generate CV summary
- `POST /api/ai/improve-bullet` - Improve bullet points
- `POST /api/ai/score-cv` - Score CV for ATS compatibility
- `POST /api/ai/write-experience` - Write experience descriptions

### CV Management
- `POST /api/cv/create` - Create new CV
- `GET /api/cv/list` - Get CV list
- `PUT /api/cv/[cvId]/update` - Update CV
- `DELETE /api/cv/[cvId]/delete` - Delete CV

### Job Description
- `GET /api/jd/list` - Get analyzed JD list
- `DELETE /api/jd/delete` - Delete JD analysis

## 🎯 How It Works

### 1. Job Description Analysis
Users paste a job description, and AI extracts:
- Key skills and technologies
- Important keywords
- Required qualifications
- Company culture indicators

### 2. CV Optimization
Based on the JD analysis, AI helps:
- Generate relevant bullet points
- Optimize content for ATS systems
- Improve keyword density
- Enhance overall CV structure

### 3. ATS Scoring
The system evaluates:
- Keyword match percentage
- Format compatibility
- Content relevance
- Overall ATS friendliness

### Content Format (Editor ↔️ AI)
- The BlockNote-based editor emits Markdown on every change. When scoring uploaded or edited CV content (e.g., `/api/ai/score-uploaded-cv`), the frontend sends Markdown instead of plain text so AI can better evaluate structure and formatting.

## 🔐 Authentication

FastRezu uses Supabase Auth with magic links for secure, passwordless authentication. Users receive a login link via email.

## 📊 Database Schema

The application uses a flexible JSONB-based schema for CV sections, allowing for easy customization and future feature additions.

Key tables:
- `user_profiles` - User information
- `cvs` - CV metadata and ATS scores
- `cv_sections` - Flexible CV content storage
- `jd_analyses` - Job description analysis results

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues, please create an issue on GitHub or contact the development team.

## 🌐 Language Support

- **English**: This README
- **Vietnamese**: [README.vi.md](./README.vi.md)