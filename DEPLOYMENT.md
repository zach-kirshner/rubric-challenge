# Deployment Guide for Vercel

This guide will walk you through deploying the Rubric Builder application to Vercel.

## Prerequisites

Before deploying, you'll need:

1. A [Vercel account](https://vercel.com/signup)
2. A [PostgreSQL database](https://neon.tech/) (recommended: Neon)
3. An [Anthropic API key](https://console.anthropic.com/)
4. A [Clerk account](https://clerk.com/) for authentication

## Step 1: Prepare Your Database

1. Create a PostgreSQL database (Neon.tech recommended for Vercel):
   - Sign up at [neon.tech](https://neon.tech/)
   - Create a new project
   - Copy the connection string (it should look like: `postgresql://user:password@host/database?sslmode=require`)

## Step 2: Set Up Clerk Authentication

1. Sign up for [Clerk](https://clerk.com/)
2. Create a new application
3. Choose "Email" as the authentication method
4. From your Clerk dashboard, copy:
   - Publishable Key (starts with `pk_`)
   - Secret Key (starts with `sk_`)

## Step 3: Get Your Anthropic API Key

1. Sign up at [Anthropic Console](https://console.anthropic.com/)
2. Create an API key
3. Copy the key (starts with `sk-ant-`)

## Step 4: Deploy to Vercel

### Option A: Deploy with Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. From the project root, run:
   ```bash
   cd rubric-builder
   vercel
   ```

3. Follow the prompts to link to your Vercel account

### Option B: Deploy via GitHub

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

## Step 5: Configure Environment Variables

In your Vercel project dashboard:

1. Go to Settings → Environment Variables
2. Add the following variables:

```
DATABASE_URL=your_neon_connection_string
ANTHROPIC_API_KEY=your_anthropic_api_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/prompt
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/prompt
ADMIN_EMAILS=your-email@example.com,other-admin@example.com
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

3. Click "Save"

## Step 6: Initialize Database Schema

After deployment, you need to initialize your database:

1. In Vercel, go to your project's Functions tab
2. Or use the Vercel CLI:
   ```bash
   vercel env pull .env.local
   npx prisma db push
   ```

## Step 7: Configure Clerk URLs

1. Go to your Clerk dashboard
2. Navigate to "Paths" settings
3. Update the following URLs:
   - Sign-in URL: `https://your-app.vercel.app/sign-in`
   - Sign-up URL: `https://your-app.vercel.app/sign-up`
   - After sign-in URL: `https://your-app.vercel.app/prompt`
   - After sign-up URL: `https://your-app.vercel.app/prompt`

## Step 8: Test Your Deployment

1. Visit your Vercel URL
2. Try signing up with an email
3. Check that you receive the magic link
4. Test the full flow: prompt → rubric generation → submission

## Troubleshooting

### Database Connection Issues
- Ensure your DATABASE_URL includes `?sslmode=require`
- Check that your database is accessible from Vercel's servers
- Verify Prisma schema is synced: `npx prisma db push`

### Authentication Issues
- Verify Clerk keys are correctly set
- Check that Clerk URLs match your Vercel domain
- Ensure NEXT_PUBLIC_ prefixed variables are set

### API Issues
- Verify ANTHROPIC_API_KEY is set correctly
- Check Vercel function logs for errors
- Ensure you have sufficient Anthropic API credits

### Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

## Production Considerations

1. **Rate Limiting**: Consider implementing rate limiting for API routes
2. **Monitoring**: Set up error tracking (e.g., Sentry)
3. **Analytics**: Enable Vercel Analytics for usage insights
4. **Backups**: Set up regular database backups
5. **Scaling**: Monitor database connections and consider connection pooling

## Custom Domain

To add a custom domain:

1. Go to Settings → Domains in Vercel
2. Add your domain
3. Follow DNS configuration instructions
4. Update NEXT_PUBLIC_APP_URL environment variable
5. Update Clerk URLs to use your custom domain

## Security Checklist

- [ ] Remove any hardcoded API keys
- [ ] Set up proper CORS headers if needed
- [ ] Enable Vercel's DDoS protection
- [ ] Review and restrict admin access
- [ ] Set up proper error handling
- [ ] Enable HTTPS (automatic with Vercel)

## Support

For issues specific to:
- Vercel deployment: [vercel.com/support](https://vercel.com/support)
- Database: Check your provider's documentation
- Clerk: [clerk.com/docs](https://clerk.com/docs)
- Anthropic API: [docs.anthropic.com](https://docs.anthropic.com) 