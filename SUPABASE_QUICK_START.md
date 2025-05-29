# 🚀 Supabase Quick Start Checklist

Follow these steps to connect your app to Supabase:

## ✅ Step-by-Step Setup

### 1. Create Supabase Project
- [ ] Go to [app.supabase.com](https://app.supabase.com)
- [ ] Create new project named "rubric-builder"
- [ ] Save your database password

### 2. Get Connection String
- [ ] In Supabase: Settings → Database
- [ ] Copy the "Connection string" URI
- [ ] Should look like: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

### 3. Create .env.local File
In the `rubric-builder` directory, create `.env.local`:

```env
DATABASE_URL="[YOUR_SUPABASE_CONNECTION_STRING]?sslmode=require"
ANTHROPIC_API_KEY="sk-ant-..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/prompt"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/prompt"
ADMIN_EMAILS="your-email@example.com"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Initialize Database
```bash
# Generate Prisma client
npm run db:generate

# Push schema to Supabase
npm run db:push

# Test connection
npm run test-db
```

### 5. Run the App
```bash
npm run dev
```

## 🧪 Test Your Setup

Run this command to test your database connection:
```bash
npm run test-db
```

You should see:
- ✅ Successfully connected to database!
- ✅ Successfully created test user
- ✨ Database connection test completed successfully!

## 🔧 Troubleshooting

If connection fails:
1. Check `DATABASE_URL` format and credentials
2. Ensure `?sslmode=require` is at the end
3. Verify Supabase project is active
4. Try the pooler connection string if issues persist

## 📝 Notes
- The app uses Prisma ORM to manage database operations
- Tables will be created automatically when you run `npm run db:push`
- Use `npm run db:studio` to view your data in Prisma Studio 