#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

const backendDir = path.join(__dirname, 'Pato', 'backend');
process.chdir(backendDir);
console.log(`Building from: ${backendDir}`);
execSync('npm ci && npx prisma generate', { stdio: 'inherit' });
