import { NextResponse } from 'next/server';
import { getServices } from '@/server/services';
import { getServerConfig } from '@/server/config';
import * as path from 'path';
import type { ClaudeConfig, Skill, Command, Agent, Hook } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeContents = searchParams.get('includeContents') === 'true';

    const config = getServerConfig();
    const { claudeConfigService, pluginDiscovery, pluginManager } = getServices();

    // Fetch global and project configs
    const globalPath = path.join(config.homeDir, '.claude');
    const projectPath = path.join(config.projectRoot, '.claude');

    const [globalConfig, projectConfig] = await Promise.all([
      claudeConfigService.getConfig(globalPath, 'global'),
      claudeConfigService.getConfig(projectPath, 'project'),
    ]);

    // Discover and filter enabled plugins
    const plugins = await pluginDiscovery.discoverPlugins([
      { path: path.join(config.homeDir, '.claude'), source: 'global' },
      { path: path.join(config.projectRoot, '.claude'), source: 'project' },
    ]);

    const states = await pluginManager.getPluginStates(config.projectRoot);
    const enabledPlugins = plugins.filter(plugin => {
      const enabled = states[plugin.id] !== undefined ? states[plugin.id] : true;
      return enabled;
    });

    // Load configs from all enabled plugins
    const pluginConfigs: ClaudeConfig[] = await Promise.all(
      enabledPlugins.map(plugin =>
        claudeConfigService.getConfig(plugin.path, 'plugin')
      )
    );

    // Aggregate all skills, commands, agents, and hooks
    const allSkills: Skill[] = [
      ...globalConfig.skills,
      ...projectConfig.skills,
      ...pluginConfigs.flatMap(c => c.skills),
    ];

    const allCommands: Command[] = [
      ...globalConfig.commands,
      ...projectConfig.commands,
      ...pluginConfigs.flatMap(c => c.commands),
    ];

    const allAgents: Agent[] = [
      ...globalConfig.agents,
      ...projectConfig.agents,
      ...pluginConfigs.flatMap(c => c.agents),
    ];

    const allHooks: Hook[] = [
      ...globalConfig.hooks,
      ...projectConfig.hooks,
      ...pluginConfigs.flatMap(c => c.hooks),
    ];

    // If includeContents is requested, load file contents for skills
    if (includeContents) {
      for (const skill of allSkills) {
        if (!skill.fileContents) {
          skill.fileContents = await claudeConfigService.readSkillFileContents(
            skill.path,
            skill.files
          );
        }
      }
    }

    const aggregatedConfig: ClaudeConfig = {
      skills: allSkills,
      commands: allCommands,
      agents: allAgents,
      hooks: allHooks,
    };

    return NextResponse.json(aggregatedConfig);
  } catch (error) {
    console.error('Error getting aggregated Claude config:', error);
    return NextResponse.json(
      { error: 'Failed to get aggregated Claude config' },
      { status: 500 }
    );
  }
}
