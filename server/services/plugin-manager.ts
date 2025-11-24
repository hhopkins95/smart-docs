import * as fs from 'fs/promises';
import * as path from 'path';
import type { Settings } from '@/types';

export class PluginManager {
  async getPluginStates(projectRoot: string): Promise<Record<string, boolean>> {
    const settingsPath = path.join(projectRoot, '.claude', 'settings.json');

    try {
      const content = await fs.readFile(settingsPath, 'utf-8');
      const settings: Settings = JSON.parse(content);
      return settings.enabledPlugins || {};
    } catch {
      // File doesn't exist or can't be read
      return {};
    }
  }

  async togglePlugin(projectRoot: string, pluginId: string, enabled: boolean): Promise<void> {
    const settingsPath = path.join(projectRoot, '.claude', 'settings.json');
    const settingsDir = path.dirname(settingsPath);

    // Ensure .claude directory exists
    await fs.mkdir(settingsDir, { recursive: true });

    // Read or create settings
    let settings: Settings;
    try {
      const content = await fs.readFile(settingsPath, 'utf-8');
      settings = JSON.parse(content);
    } catch {
      settings = { enabledPlugins: {} };
    }

    // Update plugin state
    settings.enabledPlugins = settings.enabledPlugins || {};
    settings.enabledPlugins[pluginId] = enabled;

    // Write back to file
    await fs.writeFile(
      settingsPath,
      JSON.stringify(settings, null, 2),
      'utf-8'
    );
  }
}
