'use client';

import { useState, useEffect } from 'react';
import type { Plugin } from '@/types';

export default function PluginsTab() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlugins();
  }, []);

  const fetchPlugins = async () => {
    try {
      const response = await fetch('/api/plugins/list');
      const data = await response.json();
      setPlugins(data.plugins);
    } catch (error) {
      console.error('Failed to fetch plugins:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlugin = async (pluginId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/plugins/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pluginId, enabled }),
      });

      if (response.ok) {
        // Update local state
        setPlugins(plugins.map(p =>
          p.id === pluginId ? { ...p, enabled } : p
        ));
      }
    } catch (error) {
      console.error('Failed to toggle plugin:', error);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  const globalPlugins = plugins.filter(p => p.source === 'global');
  const projectPlugins = plugins.filter(p => p.source === 'project');

  const renderPluginList = (pluginList: Plugin[]) => {
    if (pluginList.length === 0) {
      return <p className="text-gray-500">No plugins found</p>;
    }

    return (
      <div className="space-y-4">
        {pluginList.map((plugin) => (
          <div
            key={plugin.id}
            className="border border-gray-200 dark:border-gray-700 rounded p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{plugin.name}</h4>
                  <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                    v{plugin.version}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    plugin.source === 'global'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {plugin.source}
                  </span>
                </div>
                {plugin.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {plugin.description}
                  </p>
                )}
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  {plugin.skillCount > 0 && <span>Skills: {plugin.skillCount}</span>}
                  {plugin.commandCount > 0 && <span>Commands: {plugin.commandCount}</span>}
                  {plugin.agentCount > 0 && <span>Agents: {plugin.agentCount}</span>}
                  {plugin.hookCount > 0 && <span>Hooks: {plugin.hookCount}</span>}
                </div>
              </div>

              {plugin.source === 'global' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm">Enable</span>
                  <input
                    type="checkbox"
                    checked={plugin.enabled}
                    onChange={(e) => togglePlugin(plugin.id, e.target.checked)}
                    className="w-4 h-4"
                  />
                </label>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 overflow-y-auto">
      <div className="space-y-8">
        {/* Global Plugins */}
        <div>
          <h3 className="text-xl font-bold mb-4">
            Global Plugins ({globalPlugins.length})
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Global plugins installed in ~/.claude/plugins. You can enable/disable them for this project.
          </p>
          {renderPluginList(globalPlugins)}
        </div>

        {/* Project Plugins */}
        <div>
          <h3 className="text-xl font-bold mb-4">
            Project Plugins ({projectPlugins.length})
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Project-specific plugins in ./.claude/plugins. Always enabled for this project.
          </p>
          {renderPluginList(projectPlugins)}
        </div>
      </div>
    </div>
  );
}
