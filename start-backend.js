#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const candidate = path.join(__dirname, 'Pato', 'backend');
if (!fs.existsSync(candidate)) {
	try {
		execSync('git submodule update --init --recursive', { stdio: 'inherit' });
	} catch (err) {
		// ignore — we'll handle missing dir below
	}
}

let backendDir = candidate;
if (!fs.existsSync(backendDir)) {
	const alt = path.join(__dirname, 'backend');
	if (fs.existsSync(alt)) backendDir = alt;
	else throw new Error('Backend directory not found. Ensure repository contains the backend or enable git submodules.');
}

process.chdir(backendDir);
console.log(`Starting from: ${backendDir}`);
execSync('node src/server.js', { stdio: 'inherit' });
