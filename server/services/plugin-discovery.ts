import * as fs from 'fs/promises';
import * as path from 'path';
import type { Plugin, PluginManifest, MarketplaceManifest } from '@/types';

export class PluginDiscovery {
  async discoverPlugins(basePaths: { path: string; source: 'global' | 'project' }[]): Promise<Plugin[]> {
    const plugins: Plugin[] = [];

    for (const { path: basePath, source } of basePaths) {
      const pluginsDir = path.join(basePath, 'plugins');

      try {
        // Search in plugins directory and its subdirectories (marketplaces, repos, etc.)
        await this.searchForPlugins(pluginsDir, source, plugins);
      } catch (error) {
        // Directory doesn't exist or can't be read, skip
      }
    }

    return plugins;
  }

  private async searchForPlugins(
    directory: string,
    source: 'global' | 'project',
    plugins: Plugin[],
    depth: number = 0
  ): Promise<void> {
    // Limit recursion depth to avoid infinite loops
    if (depth > 2) return;

    try {
      const entries = await fs.readdir(directory);

      for (const entry of entries) {
        // Skip hidden files and known non-plugin files
        if (entry.startsWith('.') || entry.endsWith('.json')) continue;

        const entryPath = path.join(directory, entry);
        const stat = await fs.stat(entryPath);

        if (!stat.isDirectory()) continue;

        // Check if this directory is a plugin or marketplace
        const plugin = await this.parsePlugin(entryPath, source);
        if (plugin) {
          plugins.push(plugin);
        } else {
          // Check if it's a marketplace
          const marketplacePlugins = await this.parseMarketplace(entryPath, source);
          if (marketplacePlugins.length > 0) {
            plugins.push(...marketplacePlugins);
          } else {
            // If not a plugin or marketplace, search its subdirectories
            await this.searchForPlugins(entryPath, source, plugins, depth + 1);
          }
        }
      }
    } catch (error) {
      // Can't read directory, skip
    }
  }

  private async parseMarketplace(marketplacePath: string, source: 'global' | 'project'): Promise<Plugin[]> {
    try {
      const manifestPath = path.join(marketplacePath, '.claude-plugin', 'marketplace.json');
      const content = await fs.readFile(manifestPath, 'utf-8');
      const manifest: MarketplaceManifest = JSON.parse(content);

      const plugins: Plugin[] = [];

      for (const pluginDef of manifest.plugins) {
        const skillCount = pluginDef.skills?.length || 0;
        const commandCount = pluginDef.commands?.length || 0;
        const agentCount = pluginDef.agents?.length || 0;
        const hookCount = pluginDef.hooks?.length || 0;

        plugins.push({
          id: `${pluginDef.name}@${manifest.name}`,
          name: pluginDef.name,
          description: pluginDef.description,
          version: manifest.metadata?.version || '1.0.0',
          source,
          path: marketplacePath,
          enabled: true, // Will be updated by PluginManager
          skillCount,
          commandCount,
          agentCount,
          hookCount,
        });
      }

      return plugins;
    } catch (error) {
      // Not a marketplace directory or can't parse manifest
      return [];
    }
  }

  private async parsePlugin(pluginPath: string, source: 'global' | 'project'): Promise<Plugin | null> {
    try {
      const manifestPath = path.join(pluginPath, '.claude-plugin', 'plugin.json');
      const content = await fs.readFile(manifestPath, 'utf-8');
      const manifest: PluginManifest = JSON.parse(content);

      // Count components
      const counts = await this.countComponents(pluginPath);

      return {
        id: manifest.name,
        name: manifest.displayName || manifest.name,
        description: manifest.description,
        version: manifest.version,
        source,
        path: pluginPath,
        enabled: true, // Will be updated by PluginManager
        skillCount: counts.skills,
        commandCount: counts.commands,
        agentCount: counts.agents,
        hookCount: counts.hooks,
      };
    } catch (error) {
      // Not a plugin directory or can't parse manifest, return null silently
      return null;
    }
  }

  private async countComponents(pluginPath: string): Promise<{
    skills: number;
    commands: number;
    agents: number;
    hooks: number;
  }> {
    const counts = { skills: 0, commands: 0, agents: 0, hooks: 0 };

    try {
      const skillsDir = path.join(pluginPath, 'skills');
      const skillsDirs = await fs.readdir(skillsDir);
      counts.skills = skillsDirs.length;
    } catch {}

    try {
      const commandsDir = path.join(pluginPath, 'commands');
      const commandFiles = await fs.readdir(commandsDir);
      counts.commands = commandFiles.filter(f => f.endsWith('.md')).length;
    } catch {}

    try {
      const agentsDir = path.join(pluginPath, 'agents');
      const agentFiles = await fs.readdir(agentsDir);
      counts.agents = agentFiles.filter(f => f.endsWith('.md')).length;
    } catch {}

    try {
      const hooksDir = path.join(pluginPath, 'hooks');
      const hookFiles = await fs.readdir(hooksDir);
      counts.hooks = hookFiles.filter(f => f.endsWith('.sh')).length;
    } catch {}

    return counts;
  }
}
