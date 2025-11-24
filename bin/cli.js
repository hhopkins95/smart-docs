#!/usr/bin/env node

// This is a shim that runs the TypeScript CLI file using tsx
const { spawn } = require('child_process');
const path = require('path');

const tsxPath = path.join(__dirname, '..', 'node_modules', '.bin', 'tsx');
const cliPath = path.join(__dirname, 'cli.ts');

const proc = spawn(tsxPath, [cliPath, ...process.argv.slice(2)], {
  stdio: 'inherit',
});

proc.on('exit', (code) => {
  process.exit(code || 0);
});
