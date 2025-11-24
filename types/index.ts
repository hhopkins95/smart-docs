// ========== Configuration ==========
export interface ServerConfig {
  docsPath: string;
  projectRoot: string;
  homeDir: string;
}

// Claude Code settings.json structure
export interface Settings {
  enabledPlugins?: Record<string, boolean>;
}

// ========== Plugins ==========
export interface PluginManifest {
  name: string;
  displayName?: string;
  description?: string;
  version: string;
  author?: string;
  repository?: string;
}

export interface MarketplacePlugin {
  name: string;
  description?: string;
  source: string;
  strict?: boolean;
  skills?: string[];
  commands?: string[];
  agents?: string[];
  hooks?: string[];
}

export interface MarketplaceManifest {
  name: string;
  owner?: {
    name: string;
    email: string;
  };
  metadata?: {
    description?: string;
    version?: string;
  };
  plugins: MarketplacePlugin[];
}

export interface Plugin {
  id: string;                    // e.g., "example-skills@anthropic-agent-skills"
  name: string;
  description?: string;
  version: string;
  source: 'global' | 'project';
  path: string;
  enabled: boolean;
  // Counts of what's inside
  skillCount: number;
  commandCount: number;
  agentCount: number;
  hookCount: number;
}

// ========== Skills ==========
export interface SkillMetadata {
  name: string;
  description?: string;
  tags?: string[];
}

export interface Skill {
  name: string;
  path: string;
  source: 'global' | 'project';
  metadata: SkillMetadata | null;
  // Files within the skill
  files: string[];              // Relative paths within skill directory
}

// ========== Commands ==========
export interface Command {
  name: string;                  // e.g., "review" from review.md
  path: string;
  source: 'global' | 'project';
  content: string;
  description?: string;          // First line or from frontmatter
}

// ========== Agents ==========
export interface Agent {
  name: string;
  path: string;
  source: 'global' | 'project';
  content: string;
  description?: string;
}

// ========== Hooks ==========
export interface Hook {
  name: string;
  path: string;
  source: 'global' | 'project';
  content: string;
}

// ========== Claude Config (aggregates all Claude Code components) ==========
export interface ClaudeConfig {
  skills: Skill[];
  commands: Command[];
  agents: Agent[];
  hooks: Hook[];
}

// ========== Markdown Docs ==========
export interface Frontmatter {
  title?: string;
  description?: string;
  [key: string]: any;
}

export interface MarkdownFile {
  path: string;                  // Relative to docs root
  name: string;
  title: string;                 // From frontmatter or filename
}

export interface MarkdownContent {
  path: string;
  frontmatter: Frontmatter | null;
  content: string;
}

export interface FileTreeNode {
  type: 'file' | 'directory';
  name: string;
  path: string;
  children?: FileTreeNode[];
}

// ========== Events ==========
export type FileEventType = 'add' | 'change' | 'unlink';

export interface FileChangeEvent {
  area: 'docs' | 'claude' | 'plugins';
  type: FileEventType;
  path: string;
}
