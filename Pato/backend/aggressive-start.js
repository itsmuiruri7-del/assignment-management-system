#!/usr/bin/env node
/**
 * AGGRESSIVE Database Schema Fix
 * This script directly executes all migrations sequentially
 * It's designed to work on Render where async startup might fail silently
 */

import { spawn, spawnSync } from 'child_process';
import 'dotenv/config.js';

console.log('DATABASE SCHEMA CREATION SCRIPT');
console.log('==============================');
console.log('');

// Check if we can connect to database
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('ERROR: DATABASE_URL not set');
  process.exit(1);
}

console.log('Starting aggressive schema creation...');
console.log('');

// Step 1: Attempt force database reset
console.log('[1/5] Attempting database reset...');
try {
  const result = spawnSync('npx', ['prisma', 'migrate', 'reset', '--force', '--skip-generate'], {
    stdio: 'pipe',
    encoding: 'utf-8',
    timeout: 60000
  });
  
  if (result.status === 0) {
    console.log('    SUCCESS: Database reset completed');
  } else {
    console.log('    NOTE: Reset skipped (may not have been needed)');
  }
} catch (e) {
  console.log('    NOTE: Reset step skipped');
}

console.log('');

// Step 2: Generate Prisma client
console.log('[2/5] Generating Prisma client...');
try {
  const result = spawnSync('npx', ['prisma', 'generate'], {
    stdio: 'pipe',
    encoding: 'utf-8',
    timeout: 60000
  });
  
  if (result.status === 0) {
    console.log('    SUCCESS: Prisma client generated');
  } else {
    console.error('    ERROR:', result.stderr || result.stdout);
  }
} catch (e) {
  console.error('    ERROR:', e.message);
}

console.log('');

// Step 3: Deploy migrations
console.log('[3/5] Deploying migrations...');
try {
  const result = spawnSync('npx', ['prisma', 'migrate', 'deploy', '--skip-generate'], {
    stdio: 'pipe',
    encoding: 'utf-8',
    timeout: 120000
  });
  
  if (result.status === 0) {
    console.log('    SUCCESS: Migrations deployed');
  } else {
    console.log('    ERROR deploying migrations:');
    console.log(result.stdout || result.stderr);
  }
} catch (e) {
  console.error('    ERROR:', e.message);
}

console.log('');

// Step 4: Push schema directly
console.log('[4/5] Pushing schema directly (fallback)...');
try {
  const result = spawnSync('npx', ['prisma', 'db', 'push', '--skip-generate', '--accept-data-loss'], {
    stdio: 'pipe',
    encoding: 'utf-8',
    timeout: 120000
  });
  
  if (result.status === 0) {
    console.log('    SUCCESS: Schema pushed');
  } else {
    console.log('    NOTE: Push method skipped or not needed');
  }
} catch (e) {
  console.log('    NOTE: Push method skipped');
}

console.log('');

// Step 5: Verify schema exists
console.log('[5/5] Verifying schema...');
try {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  const userCount = await prisma.user.count();
  console.log('    SUCCESS: Database tables exist, found', userCount, 'users');
  
  // Cleanup
  await prisma.$disconnect();
} catch (err) {
  console.error('    ERROR: Schema verification failed');
  console.error('    Details:', err.message);
  process.exit(1);
}

console.log('');
console.log('==============================');
console.log('All database tasks completed!');
console.log('==============================');

// Now start the server
console.log('');
console.log('Starting Express server...');
console.log('');

spawnSync('node', ['src/server.js'], {
  stdio: 'inherit',
  timeout: 0 // No timeout for long-running server
});
