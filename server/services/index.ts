import type { ServerConfig } from '@/types';
import { FileSystemWatcher } from './file-watcher';
import { PluginDiscovery } from './plugin-discovery';
import { PluginManager } from './plugin-manager';
import { MarkdownService } from './markdown-service';
import { ClaudeConfigService } from './claude-config-service';

// Singleton instances
let watcher: FileSystemWatcher | null = null;
let pluginDiscovery: PluginDiscovery | null = null;
let pluginManager: PluginManager | null = null;
let markdownService: MarkdownService | null = null;
let claudeConfigService: ClaudeConfigService | null = null;

let initialized = false;

export function initializeServices(config: ServerConfig) {
  if (initialized) {
    return;
  }

  watcher = new FileSystemWatcher(config);
  pluginDiscovery = new PluginDiscovery();
  pluginManager = new PluginManager();
  markdownService = new MarkdownService();
  claudeConfigService = new ClaudeConfigService();

  // Start file watching
  watcher.start();

  initialized = true;
  console.log('✅ Services initialized');
}

export function getServices() {
  if (!initialized) {
    // Auto-initialize on first call
    try {
      const { getServerConfig } = require('../config');
      const config = getServerConfig();
      initializeServices(config);
    } catch (error) {
      throw new Error('Services not initialized and failed to auto-initialize: ' + error);
    }
  }

  return {
    watcher: watcher!,
    pluginDiscovery: pluginDiscovery!,
    pluginManager: pluginManager!,
    markdownService: markdownService!,
    claudeConfigService: claudeConfigService!,
  };
}

export function shutdownServices() {
  if (watcher) {
    watcher.stop();
  }
  initialized = false;
  console.log('👋 Services shutdown');
}
