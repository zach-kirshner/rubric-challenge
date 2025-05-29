# Rubric Builder Challenge

A web application that allows candidates to create and curate AI-generated rubrics for LLM tasks. Built with Next.js 14, TypeScript, Tailwind CSS, and Prisma.

## Features

- 🔐 **Email Authentication** - Magic link authentication via Clerk
- 🤖 **AI-Powered Rubric Generation** - Uses Claude API to generate 20-40 binary criteria
- ✏️ **Interactive Rubric Curation** - Drag-and-drop reordering, edit, delete, and add criteria
- 📝 **Justification Requirements** - Every change requires a written justification
- 📊 **Admin Dashboard** - Review submissions with full diff history
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🌓 **Dark Mode Support** - Automatic theme switching

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (via Neon.io)
- **ORM**: Prisma
- **Authentication**: Clerk
- **AI**: Claude API (Anthropic)
- **Drag & Drop**: @dnd-kit
- **Logging**: Pino
- **Analytics**: Vercel Analytics

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (recommend Neon.io)
- Claude API key from Anthropic
- Clerk account for authentication

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# Claude API
CLAUDE_API_KEY="sk-ant-api03-..."
DEFAULT_MODEL="claude-3-5-sonnet-20241022"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/prompt"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/prompt"

# Admin emails (comma-separated)
ADMIN_EMAILS="admin@example.com,admin2@example.com"

# Optional
SENTRY_DSN=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd rubric-builder
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
rubric-builder/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── api/            # API routes
│   │   ├── admin/          # Admin dashboard
│   │   ├── prompt/         # Prompt input page
│   │   ├── rubric/         # Rubric curation page
│   │   └── sign-in/        # Authentication pages
│   ├── components/         # React components
│   ├── lib/               # Utility libraries
│   ├── types/             # TypeScript types
│   └── utils/             # Helper functions
├── prisma/                # Database schema
└── public/               # Static assets
```

## User Flow

1. **Authentication**: Users sign in with their email via magic link
2. **Prompt Input**: Enter a task prompt (max 2000 characters)
3. **AI Generation**: System generates 20-40 rubric criteria using Claude
4. **Curation**: Users can:
   - Drag to reorder criteria
   - Edit existing criteria
   - Delete criteria
   - Add new criteria
   - All changes require justification
5. **Submission**: Final rubric is saved with full change history
6. **Admin Review**: Admins can view all submissions and export data

## API Endpoints

- `POST /api/auth/email` - Send magic link
- `POST /api/rubric/generate` - Generate AI rubric using Claude
- `POST /api/submissions` - Save submission
- `GET /api/submissions/:id` - Get single submission (admin)
- `GET /api/submissions/export` - Export submissions (admin)

## Database Schema

The application uses three main models:

- **User**: Stores user email and ID
- **Submission**: Contains prompt, AI rubric, final rubric
- **Action**: Tracks all edits with justifications

## Development

```bash
# Run development server
npm run dev

# Run type checking
npm run type-check

# Run linting
npm run lint

# Format code
npm run format
```

## Deployment

The application is designed to be deployed on Vercel:

1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy

## Security Considerations

- All API routes are protected with authentication
- Admin routes check against allowlist
- Input validation on all user inputs
- CSRF protection on mutating routes
- Rate limiting for anonymous users

## Future Enhancements

- Leaderboard scoring engine
- Slack webhook notifications
- Multi-tenant support
- Internationalization
- Real-time collaboration

## License

MIT
# Force deployment to pick up new env vars - Thu May 29 14:04:36 EDT 2025
