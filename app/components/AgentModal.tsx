'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Agent } from '@/types';
import Modal from './Modal';
import SourceBadge from './SourceBadge';

interface AgentModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AgentModal({ agent, isOpen, onClose }: AgentModalProps) {
  if (!agent) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={agent.name}>
      <div className="space-y-4">
        {/* Header info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <SourceBadge source={agent.source} />
          </div>
          {agent.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {agent.description}
            </p>
          )}
        </div>

        {/* Content */}
        <div>
          <SyntaxHighlighter
            language="markdown"
            style={vscDarkPlus as any}
            className="text-xs rounded"
          >
            {agent.content}
          </SyntaxHighlighter>
        </div>
      </div>
    </Modal>
  );
}
