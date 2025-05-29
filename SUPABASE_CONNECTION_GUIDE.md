# Supabase + Prisma Connection Guide

## The Issue
When using Prisma with Supabase's connection pooler, you may encounter:
- `ERROR: prepared statement "s0" already exists`
- Connection timeouts
- IPv6 connectivity issues

## The Solution

### For Database Migrations
Use **port 5432** (direct connection) when running migrations:
```bash
# Temporarily change port to 5432 in your DATABASE_URL
DATABASE_URL="postgresql://postgres.vqlrvanvjbfkvyizfotj:JaYt2c4Qb1hQ2tsK@aws-0-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require"

# Run migration
npm run db:push
```

### For Runtime (Your App)
Use **port 6543** (pooled connection) with PgBouncer parameters:
```bash
DATABASE_URL="postgresql://postgres.vqlrvanvjbfkvyizfotj:JaYt2c4Qb1hQ2tsK@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1"
```

## Connection Types in Supabase

According to Supabase docs, there are three connection types:

1. **Direct Connection** (Port 5432)
   - Uses IPv6 (may not work in all environments)
   - Best for: migrations, admin tasks
   - Format: `db.PROJECT_REF.supabase.co:5432`

2. **Session Pooler** (Port 6543)
   - Uses IPv4 via AWS
   - Best for: ORMs like Prisma
   - Maintains connection for entire session
   - Format: `aws-0-REGION.pooler.supabase.com:6543`

3. **Transaction Pooler** (Port 6543)
   - Not recommended for Prisma
   - Only maintains connection per transaction

## Best Practices

### 1. Dual Connection Setup
For production apps using Prisma with Supabase:

```env
# For runtime queries (pooled)
DATABASE_URL="postgresql://...@aws-0-REGION.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1"

# For migrations (direct) - only if needed
DIRECT_URL="postgresql://...@db.PROJECT_REF.supabase.co:5432/postgres"
```

### 2. Migration Workflow
```bash
# 1. Temporarily switch to port 5432
sed -i '' 's/:6543/:5432/' .env

# 2. Run migration
npm run db:push

# 3. Switch back to port 6543
sed -i '' 's/:5432/:6543/' .env
```

### 3. Connection Parameters
Always include these parameters for pooled connections:
- `?sslmode=require` - Required for secure connections
- `&pgbouncer=true` - Tells Prisma to use PgBouncer mode
- `&connection_limit=1` - Prevents connection pool issues

## Troubleshooting

### IPv6 Issues
- Direct URLs (`db.*.supabase.co`) use IPv6
- Many local/serverless environments are IPv4-only
- Solution: Use pooled connection (`aws-0-*.pooler.supabase.com`)

### Prepared Statement Errors
- Caused by PgBouncer reusing connections
- Solution: Add `pgbouncer=true` parameter
- Alternative: Use port 5432 for one-time operations

### Region Mismatch
- Error: "Tenant or user not found"
- Solution: Get exact region from Supabase dashboard
- Common regions: us-east-1, us-east-2, us-west-1, eu-central-1, ap-southeast-1

## Verification

Your setup is working correctly when:
1. `npm run db:push` completes without errors
2. `/api/health` returns `{"status":"healthy","database":"connected"}`
3. No prepared statement errors in console

## References
- [Supabase Database Docs](https://supabase.com/docs)
- [Prisma + Supabase Guide](https://supabase.com/partners/integrations/prisma)
- Connection pooling best practices for serverless environments 