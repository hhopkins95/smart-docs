'use client';

import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ClaudeConfig, Skill, Command, Agent, Hook } from '@/types';
import SourceBadge from './SourceBadge';

type DocumentType = 'skills' | 'commands' | 'agents' | 'hooks';

export default function ClaudeConfigTab() {
  const [config, setConfig] = useState<ClaudeConfig | null>(null);
  const [activeTab, setActiveTab] = useState<DocumentType>('skills');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/claude/all?includeContents=true');
      const data = await res.json();
      setConfig(data);
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupBySource = <T extends { source: 'global' | 'project' | 'plugin' }>(items: T[]) => {
    const grouped: {
      global: T[];
      project: T[];
      plugin: T[];
    } = {
      global: [],
      project: [],
      plugin: [],
    };

    items.forEach(item => {
      grouped[item.source].push(item);
    });

    return grouped;
  };

  const renderSkills = () => {
    if (!config) return null;

    const grouped = groupBySource(config.skills);
    const sources: Array<'global' | 'project' | 'plugin'> = ['global', 'project', 'plugin'];

    return (
      <div className="space-y-6">
        {sources.map(source => {
          const skills = grouped[source];
          if (skills.length === 0) return null;

          return (
            <div key={source}>
              <h3 className="text-lg font-semibold mb-3 capitalize">{source} Skills ({skills.length})</h3>
              <div className="space-y-4">
                {skills.map((skill, idx) => (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{skill.name}</h4>
                      <SourceBadge source={skill.source} />
                    </div>
                    {skill.metadata?.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {skill.metadata.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {skill.files.length} file(s)
                    </p>
                    {skill.files.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400">
                          View files
                        </summary>
                        <div className="mt-2 space-y-3">
                          {skill.files.map((filename, fileIdx) => (
                            <div key={fileIdx} className="border-t border-gray-200 dark:border-gray-600 pt-2">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {filename}
                              </p>
                              {skill.fileContents && skill.fileContents[filename] ? (
                                <SyntaxHighlighter
                                  language={getLanguageFromFilename(filename)}
                                  style={vscDarkPlus as any}
                                  className="text-xs"
                                >
                                  {skill.fileContents[filename]}
                                </SyntaxHighlighter>
                              ) : (
                                <p className="text-xs text-gray-500 italic">Content not loaded</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getLanguageFromFilename = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'md':
        return 'markdown';
      case 'js':
        return 'javascript';
      case 'ts':
        return 'typescript';
      case 'json':
        return 'json';
      case 'py':
        return 'python';
      case 'sh':
        return 'bash';
      case 'yml':
      case 'yaml':
        return 'yaml';
      default:
        return 'text';
    }
  };

  const renderCommands = () => {
    if (!config) return null;

    const grouped = groupBySource(config.commands);
    const sources: Array<'global' | 'project' | 'plugin'> = ['global', 'project', 'plugin'];

    return (
      <div className="space-y-6">
        {sources.map(source => {
          const commands = grouped[source];
          if (commands.length === 0) return null;

          return (
            <div key={source}>
              <h3 className="text-lg font-semibold mb-3 capitalize">{source} Commands ({commands.length})</h3>
              <div className="space-y-4">
                {commands.map((command, idx) => (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">/{command.name}</h4>
                      <SourceBadge source={command.source} />
                    </div>
                    {command.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {command.description}
                      </p>
                    )}
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400">
                        View content
                      </summary>
                      <SyntaxHighlighter
                        language="markdown"
                        style={vscDarkPlus as any}
                        className="mt-2 text-xs"
                      >
                        {command.content}
                      </SyntaxHighlighter>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAgents = () => {
    if (!config) return null;

    const grouped = groupBySource(config.agents);
    const sources: Array<'global' | 'project' | 'plugin'> = ['global', 'project', 'plugin'];

    return (
      <div className="space-y-6">
        {sources.map(source => {
          const agents = grouped[source];
          if (agents.length === 0) return null;

          return (
            <div key={source}>
              <h3 className="text-lg font-semibold mb-3 capitalize">{source} Agents ({agents.length})</h3>
              <div className="space-y-4">
                {agents.map((agent, idx) => (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{agent.name}</h4>
                      <SourceBadge source={agent.source} />
                    </div>
                    {agent.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {agent.description}
                      </p>
                    )}
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400">
                        View content
                      </summary>
                      <SyntaxHighlighter
                        language="markdown"
                        style={vscDarkPlus as any}
                        className="mt-2 text-xs"
                      >
                        {agent.content}
                      </SyntaxHighlighter>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderHooks = () => {
    if (!config) return null;

    const grouped = groupBySource(config.hooks);
    const sources: Array<'global' | 'project' | 'plugin'> = ['global', 'project', 'plugin'];

    return (
      <div className="space-y-6">
        {sources.map(source => {
          const hooks = grouped[source];
          if (hooks.length === 0) return null;

          return (
            <div key={source}>
              <h3 className="text-lg font-semibold mb-3 capitalize">{source} Hooks ({hooks.length})</h3>
              <div className="space-y-4">
                {hooks.map((hook, idx) => (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{hook.name}</h4>
                      <SourceBadge source={hook.source} />
                    </div>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400">
                        View content
                      </summary>
                      <SyntaxHighlighter
                        language="bash"
                        style={vscDarkPlus as any}
                        className="mt-2 text-xs"
                      >
                        {hook.content}
                      </SyntaxHighlighter>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'skills':
        return renderSkills();
      case 'commands':
        return renderCommands();
      case 'agents':
        return renderAgents();
      case 'hooks':
        return renderHooks();
    }
  };

  const tabs: Array<{ id: DocumentType; label: string }> = [
    { id: 'skills', label: 'Skills' },
    { id: 'commands', label: 'Commands' },
    { id: 'agents', label: 'Agents' },
    { id: 'hooks', label: 'Hooks' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`px-4 py-2 font-medium ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {config && (
                <span className="ml-2 text-xs">
                  ({config[tab.id].length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {config && renderContent()}
      </div>
    </div>
  );
}
