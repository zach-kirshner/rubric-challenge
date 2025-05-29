# Quick Deploy to Vercel with Supabase

## Prerequisites ✅
- [x] Vercel account
- [x] Supabase account
- [ ] Anthropic API key
- [ ] Clerk authentication setup

## Step 1: Configure Environment Variables

Edit `.env.local` with your credentials:

```env
# Supabase Database
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Anthropic Claude API
ANTHROPIC_API_KEY="sk-ant-api03-..."

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/prompt"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/prompt"

# Admin
ADMIN_EMAILS="your-email@example.com"
```

## Step 2: Push Database Schema

```bash
npx prisma db push
```

## Step 3: Deploy to Vercel

```bash
npx vercel
```

Follow the prompts:
- Link to existing project? **No** (create new)
- What's your project's name? **rubric-builder**
- In which directory is your code located? **./** (current directory)
- Want to override the settings? **No**

## Step 4: Add Environment Variables in Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your **rubric-builder** project
3. Go to **Settings** → **Environment Variables**
4. Add all variables from your `.env.local` file
5. Don't forget to update `NEXT_PUBLIC_APP_URL` to your Vercel URL

## Step 5: Redeploy

After adding environment variables:
```bash
npx vercel --prod
```

## Step 6: Configure Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Update your production URLs to match your Vercel deployment
3. Add your Vercel domain to allowed origins

## Your App URLs

- Development: http://localhost:3000
- Production: https://rubric-challenge-xptp.vercel.app/prompt

## Troubleshooting

### Database Connection Issues
- Make sure Supabase project is active
- Check connection string includes `?sslmode=require`
- Verify database schema was pushed: `npx prisma db push`

### Clerk Authentication Issues
- Claim your keys from: https://dashboard.clerk.com/apps/claim
- Update production URLs in Clerk dashboard
- Check NEXT_PUBLIC_ prefixed variables are set

### Build Failures
- Check Vercel function logs
- Ensure all environment variables are set
- Run `npm run build` locally to test

## Admin Access

To access the admin panel:
1. Add your email to `ADMIN_EMAILS` environment variable
2. Visit `/admin` on your deployed app
3. Sign in with your admin email 