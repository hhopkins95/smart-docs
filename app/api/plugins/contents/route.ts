import { NextResponse } from 'next/server';
import { getServices } from '@/server/services';

export async function POST(request: Request) {
  try {
    const { pluginPath, pluginId, marketplace } = await request.json();

    if (!pluginPath) {
      return NextResponse.json(
        { error: 'Plugin path is required' },
        { status: 400 }
      );
    }

    const { claudeConfigService, pluginDiscovery } = getServices();

    let config;

    if (marketplace) {
      // This is a marketplace plugin - load it differently
      const manifest = await pluginDiscovery.getMarketplaceManifest(pluginPath);
      if (manifest) {
        // Find this plugin's definition in the manifest
        const pluginDef = manifest.plugins.find(p => `${p.name}@${manifest.name}` === pluginId);
        if (pluginDef && pluginDef.skills) {
          config = await claudeConfigService.getMarketplacePluginConfig(
            pluginPath,
            pluginDef.name,
            pluginDef.skills
          );
        } else {
          config = { skills: [], commands: [], agents: [], hooks: [] };
        }
      } else {
        config = { skills: [], commands: [], agents: [], hooks: [] };
      }
    } else {
      // Standard plugin with .claude structure
      config = await claudeConfigService.getConfig(pluginPath, 'plugin');
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching plugin contents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plugin contents' },
      { status: 500 }
    );
  }
}
