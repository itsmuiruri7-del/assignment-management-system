#!/usr/bin/env node
/**
 * Manual Database Fix Script for Render
 * This script directly creates the database schema by connecting to the Render PostgreSQL database
 * and running Prisma schema push
 */

import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

console.log('🔧 Database Fix Script for Render');
console.log('==================================');
console.log('This script will fix missing database tables by pushing the Prisma schema');
console.log('');

try {
  console.log('📊 Step 1: Pushing Prisma schema to database...');
  console.log('DATABASE_URL:', DATABASE_URL.substring(0, 20) + '...');
  
  execSync('npx prisma db push --skip-generate --accept-data-loss --force-reset', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: DATABASE_URL
    }
  });
  
  console.log('');
  console.log('✅ Schema successfully pushed to database!');
  console.log('');
  
  console.log('👥 Step 2: Seeding database with test users...');
  execSync('npm run seed', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: DATABASE_URL
    }
  });
  
  console.log('');
  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('✅ All done! The database should now have the correct schema and test users.');
  
} catch (error) {
  console.error('');
  console.error('❌ Error during database fix:');
  console.error(error.message);
  process.exit(1);
}
