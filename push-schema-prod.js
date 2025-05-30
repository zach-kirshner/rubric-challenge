// Script to push database schema to production
// Run with: node push-schema-prod.js "YOUR_PRODUCTION_DATABASE_URL"

const { execSync } = require('child_process');

const productionDbUrl = process.argv[2];

if (!productionDbUrl) {
  console.error('❌ Please provide your production DATABASE_URL as an argument');
  console.error('Usage: node push-schema-prod.js "postgresql://..."');
  process.exit(1);
}

console.log('🚀 Pushing schema to production database...');

try {
  // Set the DATABASE_URL environment variable temporarily
  process.env.DATABASE_URL = productionDbUrl;
  
  // Push the schema
  execSync('npx prisma db push --skip-generate', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: productionDbUrl }
  });
  
  console.log('✅ Schema pushed successfully!');
  console.log('🔄 Now redeploy your app on Vercel to apply changes.');
} catch (error) {
  console.error('❌ Failed to push schema:', error.message);
  process.exit(1);
} 