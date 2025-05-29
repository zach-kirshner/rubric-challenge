#!/bin/bash

echo "🚀 Deploying Rubric Builder to Vercel"
echo ""
echo "Before proceeding, make sure you have:"
echo "✓ Supabase database URL"
echo "✓ Anthropic API key"
echo "✓ Clerk authentication keys"
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "Please create it from .env.example and add your credentials"
    exit 1
fi

# Load environment variables
source .env.local

# Check required variables
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set in .env.local"
    exit 1
fi

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ ANTHROPIC_API_KEY is not set in .env.local"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🗄️  Pushing database schema to Supabase..."
npx prisma db push

echo "🏗️  Building the application..."
npm run build

echo ""
echo "✅ Build successful! Now deploying to Vercel..."
echo ""
echo "Run 'vercel' to deploy, then add these environment variables in Vercel dashboard:"
echo ""
echo "DATABASE_URL"
echo "ANTHROPIC_API_KEY"
echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
echo "CLERK_SECRET_KEY"
echo "NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in"
echo "NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up"
echo "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/prompt"
echo "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/prompt"
echo "ADMIN_EMAILS=your-email@example.com"
echo "NEXT_PUBLIC_APP_URL=https://your-app.vercel.app" 