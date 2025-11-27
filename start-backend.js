#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

const backendDir = path.join(__dirname, 'Pato', 'backend');
process.chdir(backendDir);
console.log(`Starting from: ${backendDir}`);
execSync('node src/server.js', { stdio: 'inherit' });
