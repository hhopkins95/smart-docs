'use client';

import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ClaudeConfig } from '@/types';

export default function ClaudeConfigTab() {
  const [globalConfig, setGlobalConfig] = useState<ClaudeConfig | null>(null);
  const [projectConfig, setProjectConfig] = useState<ClaudeConfig | null>(null);
  const [activeSection, setActiveSection] = useState<'global' | 'project'>('global');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const [globalRes, projectRes] = await Promise.all([
        fetch('/api/claude/global'),
        fetch('/api/claude/project'),
      ]);

      setGlobalConfig(await globalRes.json());
      setProjectConfig(await projectRes.json());
    } catch (error) {
      console.error('Failed to fetch configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSection = (config: ClaudeConfig) => {
    return (
      <div className="space-y-6">
        {/* Skills */}
        <div>
          <h3 className="text-xl font-bold mb-2">Skills ({config.skills.length})</h3>
          {config.skills.length === 0 ? (
            <p className="text-gray-500">No skills found</p>
          ) : (
            <div className="space-y-4">
              {config.skills.map((skill, idx) => (
                <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded p-4">
                  <h4 className="font-semibold">{skill.name}</h4>
                  {skill.metadata?.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {skill.metadata.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {skill.files.length} file(s)
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Commands */}
        <div>
          <h3 className="text-xl font-bold mb-2">Commands ({config.commands.length})</h3>
          {config.commands.length === 0 ? (
            <p className="text-gray-500">No commands found</p>
          ) : (
            <div className="space-y-4">
              {config.commands.map((command, idx) => (
                <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded p-4">
                  <h4 className="font-semibold">/{command.name}</h4>
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
          )}
        </div>

        {/* Agents */}
        <div>
          <h3 className="text-xl font-bold mb-2">Agents ({config.agents.length})</h3>
          {config.agents.length === 0 ? (
            <p className="text-gray-500">No agents found</p>
          ) : (
            <div className="space-y-4">
              {config.agents.map((agent, idx) => (
                <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded p-4">
                  <h4 className="font-semibold">{agent.name}</h4>
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
          )}
        </div>

        {/* Hooks */}
        <div>
          <h3 className="text-xl font-bold mb-2">Hooks ({config.hooks.length})</h3>
          {config.hooks.length === 0 ? (
            <p className="text-gray-500">No hooks found</p>
          ) : (
            <div className="space-y-4">
              {config.hooks.map((hook, idx) => (
                <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded p-4">
                  <h4 className="font-semibold">{hook.name}</h4>
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
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  const config = activeSection === 'global' ? globalConfig : projectConfig;

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex">
          <button
            className={`px-4 py-2 font-medium ${
              activeSection === 'global'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
            onClick={() => setActiveSection('global')}
          >
            Global (~/.claude)
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeSection === 'project'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
            onClick={() => setActiveSection('project')}
          >
            Project (./.claude)
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {config && renderSection(config)}
      </div>
    </div>
  );
}
