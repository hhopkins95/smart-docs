'use client';

import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Plugin, ClaudeConfig } from '@/types';

export default function PluginsTab() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlugins, setExpandedPlugins] = useState<Record<string, ClaudeConfig>>({});
  const [loadingContents, setLoadingContents] = useState<Record<string, boolean>>({});

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

  const loadPluginContents = async (plugin: Plugin) => {
    if (expandedPlugins[plugin.id]) {
      // Already loaded, just toggle
      return;
    }

    setLoadingContents({ ...loadingContents, [plugin.id]: true });

    try {
      const response = await fetch('/api/plugins/contents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pluginPath: plugin.path }),
      });

      const config = await response.json();
      setExpandedPlugins({ ...expandedPlugins, [plugin.id]: config });
    } catch (error) {
      console.error('Failed to fetch plugin contents:', error);
    } finally {
      setLoadingContents({ ...loadingContents, [plugin.id]: false });
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  const globalPlugins = plugins.filter(p => p.source === 'global');

  return (
    <div className="p-6 overflow-y-auto">
      <div className="space-y-8">
        {/* Global Plugins */}
        <div>
          <h3 className="text-xl font-bold mb-4">
            Plugins ({globalPlugins.length})
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            All plugins are installed globally in ~/.claude/plugins. You can enable or disable them for this project below.
          </p>

          {globalPlugins.length === 0 ? (
            <p className="text-gray-500">No plugins found</p>
          ) : (
            <div className="space-y-4">
              {globalPlugins.map((plugin) => (
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
                        {plugin.marketplace && (
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded">
                            {plugin.marketplace}
                          </span>
                        )}
                      </div>
                      {plugin.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {plugin.description}
                        </p>
                      )}
                      {plugin.marketplaceUrl && (
                        <a
                          href={plugin.marketplaceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 dark:text-blue-400 mt-1 inline-block hover:underline"
                        >
                          View in marketplace →
                        </a>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        {plugin.skillCount > 0 && <span>Skills: {plugin.skillCount}</span>}
                        {plugin.commandCount > 0 && <span>Commands: {plugin.commandCount}</span>}
                        {plugin.agentCount > 0 && <span>Agents: {plugin.agentCount}</span>}
                        {plugin.hookCount > 0 && <span>Hooks: {plugin.hookCount}</span>}
                      </div>

                      {/* Expandable contents */}
                      <details
                        className="mt-3"
                        onToggle={(e) => {
                          if ((e.target as HTMLDetailsElement).open) {
                            loadPluginContents(plugin);
                          }
                        }}
                      >
                        <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400">
                          View contents
                        </summary>
                        <div className="mt-3">
                          {loadingContents[plugin.id] ? (
                            <p className="text-sm text-gray-500">Loading contents...</p>
                          ) : expandedPlugins[plugin.id] ? (
                            <div className="space-y-4">
                              {/* Skills */}
                              {expandedPlugins[plugin.id].skills.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-sm mb-2">Skills ({expandedPlugins[plugin.id].skills.length})</h5>
                                  <div className="space-y-2 pl-4">
                                    {expandedPlugins[plugin.id].skills.map((skill, idx) => (
                                      <div key={idx} className="text-sm">
                                        <span className="font-medium">{skill.name}</span>
                                        {skill.metadata?.description && (
                                          <span className="text-gray-600 dark:text-gray-400"> - {skill.metadata.description}</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Commands */}
                              {expandedPlugins[plugin.id].commands.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-sm mb-2">Commands ({expandedPlugins[plugin.id].commands.length})</h5>
                                  <div className="space-y-2 pl-4">
                                    {expandedPlugins[plugin.id].commands.map((command, idx) => (
                                      <div key={idx} className="text-sm">
                                        <span className="font-medium">/{command.name}</span>
                                        {command.description && (
                                          <span className="text-gray-600 dark:text-gray-400"> - {command.description}</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Agents */}
                              {expandedPlugins[plugin.id].agents.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-sm mb-2">Agents ({expandedPlugins[plugin.id].agents.length})</h5>
                                  <div className="space-y-2 pl-4">
                                    {expandedPlugins[plugin.id].agents.map((agent, idx) => (
                                      <div key={idx} className="text-sm">
                                        <span className="font-medium">{agent.name}</span>
                                        {agent.description && (
                                          <span className="text-gray-600 dark:text-gray-400"> - {agent.description}</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Hooks */}
                              {expandedPlugins[plugin.id].hooks.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-sm mb-2">Hooks ({expandedPlugins[plugin.id].hooks.length})</h5>
                                  <div className="space-y-2 pl-4">
                                    {expandedPlugins[plugin.id].hooks.map((hook, idx) => (
                                      <div key={idx} className="text-sm">
                                        <span className="font-medium">{hook.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </details>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-sm">Enable</span>
                      <input
                        type="checkbox"
                        checked={plugin.enabled}
                        onChange={(e) => togglePlugin(plugin.id, e.target.checked)}
                        className="w-4 h-4"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
