#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// List of directories to check for backend in order of preference
const backendCandidates = [
	path.join(__dirname, 'Pato', 'backend'),
	path.join(__dirname, 'backend'),
];

let backendDir = null;

// Check each candidate directory
for (const candidate of backendCandidates) {
	console.log(`Looking for backend at: ${candidate}`);
	if (fs.existsSync(candidate)) {
		backendDir = candidate;
		console.log(`✓ Found backend at: ${backendDir}`);
		break;
	}
}

// If still not found, try git submodules as last resort
if (!backendDir) {
	console.log('Backend not found. Attempting to initialize git submodules...');
	try {
		execSync('git submodule update --init --recursive', { stdio: 'inherit' });
		// Check again after submodule init
		for (const candidate of backendCandidates) {
			if (fs.existsSync(candidate)) {
				backendDir = candidate;
				console.log(`✓ Found backend at: ${backendDir}`);
				break;
			}
		}
	} catch (err) {
		console.error('git submodule update failed:', err && err.message ? err.message : err);
	}
}

// If backend still not found, provide helpful error message
if (!backendDir) {
	console.error('Backend directory not found. Expected at:');
	backendCandidates.forEach(c => console.error(`  - ${c}`));
	console.error('');
	console.error('To fix this:');
	console.error('1. Ensure the Pato directory with backend is committed to git');
	console.error('2. Or use git submodules with proper .gitmodules configuration');
	console.error('');
	throw new Error('Backend directory missing. Ensure repository contains the backend.');
}

process.chdir(backendDir);
console.log(`Building from: ${backendDir}`);
console.log('Running: npm ci && npx prisma generate');
execSync('npm ci && npx prisma generate', { stdio: 'inherit' });
