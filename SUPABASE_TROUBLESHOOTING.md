# Supabase Connection Troubleshooting

## ⚠️ Connection Failed - Common Issues

### 1. Check if Your Supabase Project is Active

**Most common issue**: Supabase pauses free projects after 1 week of inactivity.

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your **rubrics-challenge** project
3. If you see a "Project Paused" message:
   - Click the **"Restore"** button
   - Wait 2-3 minutes for the database to start

### 2. Get the Correct Connection String

1. In your Supabase project dashboard
2. Go to **Settings → Database**
3. Find the **Connection String** section
4. You'll see several options:

   - **URI** - Direct connection
   - **Transaction pooler** - For long transactions
   - **Session pooler** - For serverless (recommended)

5. Copy the **Session pooler** connection string
6. It should look like:
   ```
   postgresql://postgres.vqlrvanvjbfkvyizfotj:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

### 3. Update Your .env File

Replace the entire DATABASE_URL line in your `.env` file with:
```
DATABASE_URL="[YOUR_CONNECTION_STRING_FROM_SUPABASE]?sslmode=require"
```

### 4. Test the Connection

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# If successful, start the app
npm run dev
```

## 🔍 Still Having Issues?

### Check These Things:

1. **Password is correct**: `JaYt2c4Qb1hQ2tsK`
2. **Project ID is correct**: `vqlrvanvjbfkvyizfotj`
3. **Add `?sslmode=require`** at the end of your connection string
4. **Try different connection types**:
   - Direct: `db.vqlrvanvjbfkvyizfotj.supabase.co:5432`
   - Pooled: `aws-0-[region].pooler.supabase.com:6543`

### Quick Test Script

Create a file `test-connection.js`:
```javascript
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    await prisma.$connect()
    console.log('✅ Connected to Supabase!')
    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
  }
}

test()
```

Run: `node test-connection.js`

## 📞 Need More Help?

1. Check Supabase status: [status.supabase.com](https://status.supabase.com)
2. Supabase Discord: [discord.supabase.com](https://discord.supabase.com)
3. Make sure you're using Node.js 18+ (`node --version`) 