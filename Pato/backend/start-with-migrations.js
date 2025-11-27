#!/usr/bin/env node
/**
 * Enhanced Render Backend Startup Script
 * - Uses multiple methods to ensure database schema is created
 * - Runs Prisma migrations
 * - Seeds the database with test users
 * - Starts the Express server
 */

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config.js';

console.log('🚀 Starting backend service...');
console.log('📁 Working directory:', process.cwd());
console.log('🗄️  Database URL:', process.env.DATABASE_URL ? 'Set' : 'NOT SET');
console.log('');

const prisma = new PrismaClient();

// Ensure database schema exists
async function ensureDatabaseSchema() {
  console.log('📊 Ensuring database schema exists...');
  
  // Method 1: Try prisma db push with force-reset
  try {
    console.log('  Method 1: Attempting prisma db push...');
    execSync('npx prisma db push --skip-generate --accept-data-loss --force-reset', { 
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    console.log('  ✅ Schema pushed successfully');
    return true;
  } catch (err) {
    console.warn('  ⚠️  db push failed:', err.message?.split('\n')[0] || err.message);
  }
  
  // Method 2: Try prisma migrate deploy
  try {
    console.log('  Method 2: Attempting prisma migrate deploy...');
    execSync('npx prisma migrate deploy --skip-generate', { 
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    console.log('  ✅ Migrations deployed successfully');
    return true;
  } catch (err) {
    console.warn('  ⚠️  migrate deploy failed:', err.message?.split('\n')[0] || err.message);
  }
  
  // Method 3: Try to connect and detect missing tables
  try {
    console.log('  Method 3: Testing database connection...');
    const userCount = await prisma.user.count();
    console.log('  ✅ Database schema exists, found', userCount, 'users');
    return true;
  } catch (err) {
    if (err.message.includes('does not exist')) {
      console.log('  ⚠️  Database schema missing, will attempt reset...');
      try {
        execSync('npx prisma migrate reset --force --skip-generate', { 
          stdio: 'pipe',
          encoding: 'utf-8'
        });
        console.log('  ✅ Database reset and schema created');
        return true;
      } catch (resetErr) {
        console.warn('  ⚠️  reset failed:', resetErr.message?.split('\n')[0] || resetErr.message);
      }
    }
  }
  
  console.log('  ⚠️  Could not ensure schema, will continue anyway...');
  return false;
}

// Seed database with test users
async function seedDatabase() {
  try {
    console.log('');
    console.log('👥 Checking if test users exist...');
    
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });
    
    if (adminCount > 0) {
      console.log('  ✅ Admin user already exists, skipping seed');
      return true;
    }
    
    console.log('  📝 Creating test users...');
    
    // Create admin
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: '$2a$10$ZyFIH8zO8M1o7XlqvF7X9e4y6PjM1n6FvF2gJfS1iGd3i4v5Yt6xC', // bcrypt hash for "password"
        role: 'ADMIN'
      }
    });
    
    console.log('  ✅ Admin created:', admin.email);
    return true;
  } catch (err) {
    if (err.message.includes('does not exist')) {
      console.log('  ⚠️  Cannot seed - database schema missing');
      return false;
    }
    console.warn('  ⚠️  Seed error:', err.message);
    return false;
  }
}

// Start Express server
function startServer() {
  console.log('');
  console.log('🚀 Starting Express server...');
  console.log('');
  try {
    execSync('node src/server.js', { stdio: 'inherit' });
  } catch (err) {
    console.error('❌ Server error:', err.message);
    process.exit(1);
  }
}

// Main execution
(async () => {
  try {
    await ensureDatabaseSchema();
    await seedDatabase();
    startServer();
  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
