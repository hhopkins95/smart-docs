import { NextResponse } from 'next/server';
import { getServices } from '@/server/services';
import { getServerConfig } from '@/server/config';
import * as path from 'path';

export async function GET() {
  try {
    const config = getServerConfig();
    const { pluginDiscovery, pluginManager } = getServices();

    // Discover plugins from both global and project locations
    const plugins = await pluginDiscovery.discoverPlugins([
      { path: path.join(config.homeDir, '.claude'), source: 'global' },
      { path: path.join(config.projectRoot, '.claude'), source: 'project' },
    ]);

    // Get plugin states from settings.json
    const states = await pluginManager.getPluginStates(config.projectRoot);

    // Merge plugin data with enabled states
    const pluginsWithStates = plugins.map(plugin => ({
      ...plugin,
      enabled: states[plugin.id] !== undefined ? states[plugin.id] : true,
    }));

    return NextResponse.json({ plugins: pluginsWithStates });
  } catch (error) {
    console.error('Error listing plugins:', error);
    return NextResponse.json(
      { error: 'Failed to list plugins' },
      { status: 500 }
    );
  }
}
