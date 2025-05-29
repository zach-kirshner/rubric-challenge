# Supabase Environment Configuration

## Your Supabase Connection Details
- **Project Name**: rubrics-challenge
- **Project ID**: vqlrvanvjbfkvyizfotj
- **Password**: JaYt2c4Qb1hQ2tsK

## Required .env.local Configuration

Your `.env.local` file should contain:

```env
# Supabase Database URL
# You need to get the REGION from your Supabase dashboard (Settings → Database)
# Common regions: us-east-1, us-west-1, eu-west-1, ap-southeast-1
DATABASE_URL="postgresql://postgres.vqlrvanvjbfkvyizfotj:JaYt2c4Qb1hQ2tsK@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require"

# Alternative: Direct connection (not recommended for production)
# DATABASE_URL="postgresql://postgres:JaYt2c4Qb1hQ2tsK@db.vqlrvanvjbfkvyizfotj.supabase.co:5432/postgres"

# For connection pooling (recommended for serverless):
# DATABASE_URL="postgresql://postgres.vqlrvanvjbfkvyizfotj:JaYt2c4Qb1hQ2tsK@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Anthropic API Key (required for AI features)
ANTHROPIC_API_KEY="sk-ant-YOUR_KEY_HERE"

# Clerk Authentication (required for user auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_YOUR_KEY_HERE"
CLERK_SECRET_KEY="sk_YOUR_KEY_HERE"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/prompt"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/prompt"

# Admin Configuration
ADMIN_EMAILS="your-email@example.com"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Clean Up Extra Environment Files

You should only need:
- `.env.local` - Your main configuration file
- `.env.example` - Example for other developers

You can safely delete:
- `.env`
- `.env.bak2`
- `.env.bak3`
- `.env.local.backup`
- `.env.local.bak`
- `.env.local.bak2`
- `.env.local.bak3`

Run this command to clean up:
```bash
rm .env .env.bak* .env.local.bak* .env.local.backup
```

## Getting Your Supabase Region

1. Log into [app.supabase.com](https://app.supabase.com)
2. Select your "rubrics-challenge" project
3. Go to Settings → Database
4. Look for your connection string - the region will be visible there
5. Replace `[REGION]` in the DATABASE_URL with your actual region

## Testing Your Configuration

After updating `.env.local`, run:
```bash
npm run db:push
```

Then test the connection:
```bash
npm run dev
# Visit http://localhost:3000/api/health
``` 