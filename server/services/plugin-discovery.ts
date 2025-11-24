import * as fs from 'fs/promises';
import * as path from 'path';
import type { Plugin, PluginManifest } from '@/types';

export class PluginDiscovery {
  async discoverPlugins(basePaths: { path: string; source: 'global' | 'project' }[]): Promise<Plugin[]> {
    const plugins: Plugin[] = [];

    for (const { path: basePath, source } of basePaths) {
      const pluginsDir = path.join(basePath, 'plugins');

      try {
        const dirs = await fs.readdir(pluginsDir);

        for (const dir of dirs) {
          const pluginPath = path.join(pluginsDir, dir);
          const stat = await fs.stat(pluginPath);

          if (!stat.isDirectory()) continue;

          const plugin = await this.parsePlugin(pluginPath, source);
          if (plugin) {
            plugins.push(plugin);
          }
        }
      } catch (error) {
        // Directory doesn't exist or can't be read, skip
      }
    }

    return plugins;
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
      console.error(`Failed to parse plugin at ${pluginPath}:`, error);
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
