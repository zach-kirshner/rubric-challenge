# Supabase Setup Guide

This guide will help you connect your Rubric Builder app to Supabase.

## Prerequisites

1. A [Supabase account](https://supabase.com)
2. Node.js installed locally
3. The Rubric Builder project cloned locally

## Step 1: Create a Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New project"
3. Fill in:
   - Project name: `rubric-builder`
   - Database password: Choose a strong password (save this!)
   - Region: Choose the closest to your users
4. Click "Create new project"

## Step 2: Get Your Database Connection String

1. In your Supabase project, go to Settings → Database
2. Scroll to "Connection string"
3. Copy the "URI" connection string
4. It should look like: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

## Step 3: Configure Environment Variables

1. Create a `.env.local` file in the `rubric-builder` directory
2. Add the following content:

```env
# Supabase Database URL
DATABASE_URL="YOUR_SUPABASE_CONNECTION_STRING?sslmode=require"

# For better performance with serverless, use connection pooling:
# DATABASE_URL="YOUR_SUPABASE_CONNECTION_STRING?pgbouncer=true&connection_limit=1"

# Anthropic API Key (get from https://console.anthropic.com/)
ANTHROPIC_API_KEY="sk-ant-..."

# Clerk Authentication (get from https://dashboard.clerk.com/)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/prompt"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/prompt"

# Admin emails (comma-separated)
ADMIN_EMAILS="your-email@example.com"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Step 4: Initialize the Database Schema

Run these commands from the `rubric-builder` directory:

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to Supabase
npm run db:push
```

## Step 5: Verify Database Setup

1. Go to your Supabase dashboard
2. Navigate to Table Editor
3. You should see these tables:
   - User
   - Submission
   - Criterion
   - CriterionAction

## Step 6: Run the Application

```bash
# Start the development server
npm run dev
```

Visit `http://localhost:3000` to see your app running!

## Troubleshooting

### Connection Issues

1. **"Connection refused" error**:
   - Ensure your connection string includes `?sslmode=require`
   - Check that your password is correct
   - Try using the pooler connection string

2. **"Database does not exist" error**:
   - Make sure you're using the correct project reference
   - Verify the database name (usually `postgres`)

3. **Prisma errors**:
   - Run `npm run db:generate` after any schema changes
   - Ensure `DATABASE_URL` is set correctly

### Performance Optimization

For production, consider:

1. **Connection Pooling**: Use Supabase's pooler endpoint
2. **Prisma Data Proxy**: For edge deployments
3. **Row Level Security**: Configure RLS policies in Supabase

## Security Best Practices

1. Never commit `.env.local` to git
2. Use different database passwords for development and production
3. Enable Row Level Security (RLS) in Supabase for production
4. Regularly rotate your database passwords
5. Use Supabase's built-in authentication if migrating from Clerk

## Next Steps

1. Set up Clerk authentication (or migrate to Supabase Auth)
2. Configure your Anthropic API key
3. Deploy to Vercel with production environment variables
4. Set up database backups in Supabase

## Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [Prisma with Supabase](https://supabase.com/docs/guides/integrations/prisma)
- [Next.js with Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) 