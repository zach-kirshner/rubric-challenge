# Vercel Deployment Guide for Rubric Builder

## Prerequisites
- [x] Supabase database connected and working locally
- [ ] Vercel CLI installed (`npm i -g vercel`)
- [ ] Vercel account created
- [ ] All environment variables ready

## Step 1: Prepare Environment Variables

You'll need these environment variables in Vercel:

```env
# Supabase Database (use pooled connection for production)
DATABASE_URL="postgresql://postgres.vqlrvanvjbfkvyizfotj:JaYt2c4Qb1hQ2tsK@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1"

# Anthropic API
ANTHROPIC_API_KEY="sk-ant-YOUR_KEY"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_YOUR_KEY"
CLERK_SECRET_KEY="sk_YOUR_KEY"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/prompt"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/prompt"

# Admin emails
ADMIN_EMAILS="your-email@example.com"

# App URL (update after deployment)
NEXT_PUBLIC_APP_URL="https://your-project.vercel.app"
```

## Step 2: Update Prisma Schema for Production

Ensure your `prisma/schema.prisma` has the correct datasource:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Step 3: Deploy to Vercel

### Option A: Using Vercel CLI

```bash
# From rubric-builder directory
cd rubric-builder

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# For production deployment
vercel --prod
```

### Option B: Using GitHub Integration

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Configure environment variables (see Step 4)

## Step 4: Configure Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable from Step 1
4. **Important**: Make sure to select all environments (Production, Preview, Development)

## Step 5: Handle Prisma in Production

Your `vercel.json` is already configured correctly with:
```json
{
  "buildCommand": "prisma generate && next build"
}
```

This ensures Prisma client is generated during build.

## Step 6: Post-Deployment Setup

1. **Update NEXT_PUBLIC_APP_URL**:
   - Get your Vercel URL (e.g., `rubric-builder.vercel.app`)
   - Update the environment variable in Vercel dashboard

2. **Configure Clerk URLs**:
   - In Clerk dashboard, update production URLs to match your Vercel domain
   - Add your Vercel domain to allowed origins

3. **Test the deployment**:
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

## Troubleshooting

### Database Connection Issues
If you see connection errors in Vercel:

1. **Ensure you're using the pooled connection** (port 6543)
2. **Include all parameters**: `?sslmode=require&pgbouncer=true&connection_limit=1`
3. **Check region**: Make sure it's `us-east-2` in your case

### Build Failures
Common issues:
- Missing `prisma generate` in build command
- Environment variables not set
- TypeScript errors

Check build logs in Vercel dashboard for details.

### Runtime Errors
- Check **Functions** tab in Vercel for error logs
- Verify all environment variables are set
- Ensure Supabase project is not paused

## Production Best Practices

1. **Enable Vercel Analytics**:
   ```bash
   npm install @vercel/analytics
   ```

2. **Set up error monitoring** (optional):
   - Sentry is already configured in your app
   - Add `SENTRY_DSN` to environment variables

3. **Configure caching**:
   - Next.js automatically handles caching
   - Consider ISR for dynamic pages

4. **Security**:
   - Never expose sensitive keys
   - Use Vercel's secret management
   - Enable CORS if needed

## Quick Deploy Script

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Deploying to Vercel..."

# Build locally first to catch errors
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Deploying..."
    vercel --prod
else
    echo "❌ Build failed! Fix errors before deploying."
    exit 1
fi
```

## Monitoring Your Deployment

1. **Vercel Dashboard**: Monitor deployments, functions, and logs
2. **Supabase Dashboard**: Monitor database connections and queries
3. **Health Check**: `https://your-app.vercel.app/api/health`

## Next Steps

After successful deployment:
1. Test all features in production
2. Set up custom domain (optional)
3. Configure production monitoring
4. Enable automatic deployments from GitHub 