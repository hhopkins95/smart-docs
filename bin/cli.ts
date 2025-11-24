#!/usr/bin/env node

import { spawn } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import open from 'open';

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  const net = await import('net');

  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = (server.address() as any).port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

async function waitForServer(port: number, maxAttempts: number = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`http://localhost:${port}`);
      if (response.ok || response.status === 404) {
        return true;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

async function main() {
  // Parse arguments
  const args = process.argv.slice(2);
  const docsPath = args[0] || './docs';

  // Resolve paths
  const projectRoot = process.cwd();
  const homeDir = os.homedir();
  const absoluteDocsPath = path.resolve(projectRoot, docsPath);

  // Check if docs path exists
  if (!fs.existsSync(absoluteDocsPath)) {
    console.log(`📁 Docs path doesn't exist: ${absoluteDocsPath}`);
    console.log(`Creating directory...`);
    fs.mkdirSync(absoluteDocsPath, { recursive: true });
  }

  // Find available port
  const port = await findAvailablePort(3000);

  // Set environment variables
  process.env.SMART_DOCS_PATH = absoluteDocsPath;
  process.env.SMART_DOCS_PROJECT_ROOT = projectRoot;
  process.env.SMART_DOCS_HOME_DIR = homeDir;
  process.env.PORT = port.toString();

  console.log('🚀 Starting Smart Docs...');
  console.log(`📂 Docs: ${absoluteDocsPath}`);
  console.log(`🏠 Project: ${projectRoot}`);
  console.log(`🌐 Server: http://localhost:${port}`);
  console.log('');

  // Start Next.js dev server
  const nextBin = path.join(__dirname, '..', 'node_modules', '.bin', 'next');
  const server = spawn('node', [nextBin, 'dev', '-p', port.toString()], {
    env: process.env,
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });

  // Wait for server to be ready
  console.log('⏳ Waiting for server to start...');
  const ready = await waitForServer(port);

  if (ready) {
    console.log('✅ Server ready!');
    console.log(`🌐 Opening http://localhost:${port} in your browser...`);
    await open(`http://localhost:${port}`);
  } else {
    console.log('❌ Server failed to start after 30 seconds');
    process.exit(1);
  }

  // Handle exit
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down Smart Docs...');
    server.kill();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
