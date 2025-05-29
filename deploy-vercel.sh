#!/bin/bash

echo "🚀 Vercel Deployment for Rubric Builder"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from rubric-builder directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Run this script from the rubric-builder directory${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Pre-deployment checklist:${NC}"
echo ""
echo "1. Supabase Database:"
echo "   - Project: rubrics-challenge"
echo "   - Region: us-east-2"
echo "   - Connection: Pooled (port 6543)"
echo ""
echo "2. Required API Keys:"
echo "   - [ ] Anthropic API Key"
echo "   - [ ] Clerk Publishable Key"
echo "   - [ ] Clerk Secret Key"
echo ""
echo "3. Your .env file should have the correct DATABASE_URL"
echo ""
echo -e "${YELLOW}Press Enter to continue or Ctrl+C to cancel...${NC}"
read

# Test build locally first
echo -e "${YELLOW}🏗️  Testing build locally...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed! Fix errors before deploying.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful!${NC}"
echo ""

# Deploy with Vercel
echo -e "${YELLOW}🚀 Starting Vercel deployment...${NC}"
echo ""
echo "Follow these steps:"
echo ""
echo "1. Run: npx vercel"
echo "2. Link to existing project or create new"
echo "3. After deployment, go to Vercel dashboard"
echo "4. Add these environment variables:"
echo ""
echo -e "${GREEN}Required Environment Variables:${NC}"
echo ""
echo "DATABASE_URL:"
echo "postgresql://postgres.vqlrvanvjbfkvyizfotj:JaYt2c4Qb1hQ2tsK@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1"
echo ""
echo "ANTHROPIC_API_KEY:"
echo "sk-ant-YOUR_KEY_HERE"
echo ""
echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:"
echo "pk_YOUR_KEY_HERE"
echo ""
echo "CLERK_SECRET_KEY:"
echo "sk_YOUR_KEY_HERE"
echo ""
echo "NEXT_PUBLIC_CLERK_SIGN_IN_URL:"
echo "/sign-in"
echo ""
echo "NEXT_PUBLIC_CLERK_SIGN_UP_URL:"
echo "/sign-up"
echo ""
echo "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL:"
echo "/prompt"
echo ""
echo "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL:"
echo "/prompt"
echo ""
echo "ADMIN_EMAILS:"
echo "your-email@example.com"
echo ""
echo "NEXT_PUBLIC_APP_URL:"
echo "https://your-project-name.vercel.app"
echo ""
echo -e "${YELLOW}📌 Important Notes:${NC}"
echo "- Use the pooled connection (port 6543) for production"
echo "- Include all connection parameters for Supabase"
echo "- Update NEXT_PUBLIC_APP_URL after getting your Vercel URL"
echo "- Configure Clerk production URLs in Clerk dashboard"
echo ""
echo -e "${GREEN}Ready to deploy? Run: npx vercel${NC}" 