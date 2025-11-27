#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const candidate = path.join(__dirname, 'Pato', 'backend');
console.log(`Looking for backend at: ${candidate}`);
if (!fs.existsSync(candidate)) {
	console.log('Pato/backend not found. Attempting to initialize git submodules...');
	try {
		execSync('git submodule update --init --recursive', { stdio: 'inherit' });
	} catch (err) {
		console.error('git submodule update failed:', err && err.message ? err.message : err);
	}
}

let backendDir = candidate;
if (!fs.existsSync(backendDir)) {
	const alt = path.join(__dirname, 'backend');
	if (fs.existsSync(alt)) {
		backendDir = alt;
		console.log(`Using alternative backend dir: ${backendDir}`);
	} else {
		console.error('Backend directory not found. Expected at either:');
		console.error(`  - ${candidate}`);
		console.error(`  - ${alt}`);
		throw new Error('Backend directory missing. Ensure repository contains the backend or enable git submodules.');
	}
}

process.chdir(backendDir);
console.log(`Building from: ${backendDir}`);
execSync('npm ci && npx prisma generate', { stdio: 'inherit' });
