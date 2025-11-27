#!/usr/bin/env node
/**
 * Render Backend Startup Script
 * - Runs Prisma migrations
 * - Starts the Express server
 * - Handles database connection errors gracefully
 */

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting backend service...');
console.log('Working directory:', process.cwd());

// Run Prisma migrations (with retries)
async function runMigrations() {
  console.log('Running Prisma migrations...');
  
  // First, try prisma db push with force-reset (creates schema from prisma.schema if no migrations exist)
  try {
    console.log('Attempting prisma db push with force-reset...');
    execSync('npx prisma db push --skip-generate --accept-data-loss --force-reset', { stdio: 'inherit' });
    console.log('Database schema pushed successfully');
    return true;
  } catch (err) {
    console.error('db push failed:', err.message);
  }
  
  // If that fails, try migrate deploy
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      console.log(`Migration attempt ${attempts + 1}/${maxAttempts}`);
      execSync('npx prisma migrate deploy --skip-generate', { stdio: 'inherit' });
      console.log('Migrations completed successfully');
      return true;
    } catch (err) {
      attempts++;
      console.error(`Migration attempt ${attempts}/${maxAttempts} failed:`, err.message);
      
      if (attempts < maxAttempts) {
        const delay = 5000 * attempts;
        console.log(`Retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.warn('Migrations failed after retries, but continuing startup anyway...');
  return false;
}

// Start server
function startServer() {
  console.log('Starting Express server...');
  execSync('node src/server.js', { stdio: 'inherit' });
}

// Main execution
(async () => {
  try {
    await runMigrations();
    startServer();
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
})();
