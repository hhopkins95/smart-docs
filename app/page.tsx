'use client';

import { useState } from 'react';
import DocsTab from './components/DocsTab';
import ClaudeConfigTab from './components/ClaudeConfigTab';
import PluginsTab from './components/PluginsTab';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'docs' | 'claude' | 'plugins'>('docs');

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold">Smart Docs</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            AI-native documentation viewer
          </p>
        </div>

        {/* Tabs */}
        <div className="flex px-6">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'docs'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('docs')}
          >
            📄 Docs
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'claude'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('claude')}
          >
            🤖 Claude Config
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'plugins'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('plugins')}
          >
            🔌 Plugins
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'docs' && <DocsTab />}
        {activeTab === 'claude' && <ClaudeConfigTab />}
        {activeTab === 'plugins' && <PluginsTab />}
      </main>
    </div>
  );
}
