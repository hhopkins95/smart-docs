import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';
import type { ClaudeConfig, Skill, Command, Agent, Hook, SkillMetadata, Frontmatter, ClaudeMdFile, ClaudeMdNode, ClaudeMdScope } from '@/types';

export class ClaudeConfigService {
  async getConfig(basePath: string, source: 'global' | 'project', includeContents: boolean = false): Promise<ClaudeConfig> {
    const [skills, commands, agents, hooks] = await Promise.all([
      this.getSkills(basePath, source, includeContents),
      this.getCommands(basePath, source),
      this.getAgents(basePath, source),
      this.getHooks(basePath, source),
    ]);

    return { skills, commands, agents, hooks };
  }

  async getSkills(basePath: string, source: 'global' | 'project' | 'plugin', includeContents: boolean = false): Promise<Skill[]> {
    const skillsDir = path.join(basePath, 'skills');
    const skills: Skill[] = [];

    try {
      const entries = await fs.readdir(skillsDir);

      for (const entry of entries) {
        const skillPath = path.join(skillsDir, entry);
        const stat = await fs.stat(skillPath);

        if (!stat.isDirectory()) continue;

        // Try to read skill metadata
        const metadata = await this.parseSkillMetadata(skillPath);

        // Get all files in the skill directory
        const files = await this.getFilesInDirectory(skillPath);

        // Optionally read file contents
        const fileContents = includeContents
          ? await this.readSkillFileContents(skillPath, files)
          : undefined;

        skills.push({
          name: entry,
          path: skillPath,
          source,
          metadata,
          files,
          fileContents,
        });
      }
    } catch {
      // Directory doesn't exist
    }

    return skills;
  }

  async readSkillFileContents(skillPath: string, files: string[]): Promise<Record<string, string>> {
    const contents: Record<string, string> = {};

    for (const file of files) {
      try {
        const filePath = path.join(skillPath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        contents[file] = content;
      } catch {
        // File can't be read, skip
      }
    }

    return contents;
  }

  private async parseSkillMetadata(skillPath: string): Promise<SkillMetadata | null> {
    // Try to read skill.md, SKILL.md, or README.md
    const possibleFiles = ['skill.md', 'SKILL.md', 'README.md', 'readme.md'];

    for (const filename of possibleFiles) {
      try {
        const filePath = path.join(skillPath, filename);
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = matter(content);
        const frontmatter = parsed.data as Frontmatter;

        return {
          name: frontmatter.name || path.basename(skillPath),
          description: frontmatter.description || this.extractFirstParagraph(parsed.content),
          tags: frontmatter.tags,
        };
      } catch {
        // File doesn't exist, try next
      }
    }

    return null;
  }

  private extractFirstParagraph(content: string): string {
    const lines = content.trim().split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        return trimmed;
      }
    }
    return '';
  }

  private async getFilesInDirectory(dirPath: string, relativePath: string = ''): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relPath = relativePath ? path.join(relativePath, entry.name) : entry.name;

        if (entry.isFile()) {
          files.push(relPath);
        } else if (entry.isDirectory()) {
          // Recursively get files from subdirectories
          const subFiles = await this.getFilesInDirectory(fullPath, relPath);
          files.push(...subFiles);
        }
      }
    } catch {}

    return files;
  }

  async getCommands(basePath: string, source: 'global' | 'project' | 'plugin'): Promise<Command[]> {
    const commandsDir = path.join(basePath, 'commands');
    const commands: Command[] = [];

    try {
      const files = await fs.readdir(commandsDir);

      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const filePath = path.join(commandsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = matter(content);
        const frontmatter = parsed.data as Frontmatter;

        commands.push({
          name: file.replace(/\.md$/, ''),
          path: filePath,
          source,
          content: parsed.content,
          description: frontmatter.description || this.extractFirstLine(parsed.content),
        });
      }
    } catch {
      // Directory doesn't exist
    }

    return commands;
  }

  async getAgents(basePath: string, source: 'global' | 'project' | 'plugin'): Promise<Agent[]> {
    const agentsDir = path.join(basePath, 'agents');
    const agents: Agent[] = [];

    try {
      const files = await fs.readdir(agentsDir);

      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const filePath = path.join(agentsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = matter(content);
        const frontmatter = parsed.data as Frontmatter;

        agents.push({
          name: file.replace(/\.md$/, ''),
          path: filePath,
          source,
          content: parsed.content,
          description: frontmatter.description || this.extractFirstLine(parsed.content),
        });
      }
    } catch {
      // Directory doesn't exist
    }

    return agents;
  }

  async getHooks(basePath: string, source: 'global' | 'project' | 'plugin'): Promise<Hook[]> {
    const hooksDir = path.join(basePath, 'hooks');
    const hooks: Hook[] = [];

    try {
      const files = await fs.readdir(hooksDir);

      for (const file of files) {
        if (!file.endsWith('.sh')) continue;

        const filePath = path.join(hooksDir, file);
        const content = await fs.readFile(filePath, 'utf-8');

        hooks.push({
          name: file.replace(/\.sh$/, ''),
          path: filePath,
          source,
          content,
        });
      }
    } catch {
      // Directory doesn't exist
    }

    return hooks;
  }

  private extractFirstLine(content: string): string {
    const line = content.trim().split('\n')[0];
    return line.trim();
  }

  async getMarketplacePluginConfig(marketplacePath: string, pluginName: string, skillPaths: string[], includeContents: boolean = false): Promise<ClaudeConfig> {
    const skills: Skill[] = [];

    for (const skillPath of skillPaths) {
      const fullSkillPath = path.join(marketplacePath, skillPath);

      try {
        const stat = await fs.stat(fullSkillPath);
        if (!stat.isDirectory()) continue;

        // Read skill metadata from SKILL.md or skill.md
        const metadata = await this.parseSkillMetadata(fullSkillPath);

        // Get all files in the skill directory
        const files = await this.getFilesInDirectory(fullSkillPath);

        // Optionally read file contents
        const fileContents = includeContents
          ? await this.readSkillFileContents(fullSkillPath, files)
          : undefined;

        skills.push({
          name: path.basename(skillPath),
          path: fullSkillPath,
          source: 'plugin',
          metadata,
          files,
          fileContents,
        });
      } catch (error) {
        // Skip skills that can't be read
        console.warn(`Failed to load skill ${skillPath}:`, error);
      }
    }

    return {
      skills,
      commands: [], // Marketplace plugins don't have commands
      agents: [],   // Marketplace plugins don't have agents
      hooks: [],    // Marketplace plugins don't have hooks
    };
  }

  async getClaudeMdFiles(homeDir: string, projectRoot: string, docsPath: string): Promise<ClaudeMdNode[]> {
    const nodes: ClaudeMdNode[] = [];

    // 1. Check for global CLAUDE.md
    const globalClaudePath = path.join(homeDir, '.claude', 'CLAUDE.md');
    const globalFile = await this.readClaudeMdFile(globalClaudePath, 'global', 0, '~/.claude');
    if (globalFile) {
      nodes.push({
        type: 'directory',
        name: 'Global (~/.claude)',
        path: path.join(homeDir, '.claude'),
        children: [{
          type: 'file',
          name: 'CLAUDE.md',
          path: globalClaudePath,
          file: globalFile,
        }],
      });
    }

    // 2. Check for project CLAUDE.md
    const projectClaudePath = path.join(projectRoot, '.claude', 'CLAUDE.md');
    const projectFile = await this.readClaudeMdFile(projectClaudePath, 'project', 1, './.claude');
    if (projectFile) {
      nodes.push({
        type: 'directory',
        name: 'Project (./.claude)',
        path: path.join(projectRoot, '.claude'),
        children: [{
          type: 'file',
          name: 'CLAUDE.md',
          path: projectClaudePath,
          file: projectFile,
        }],
      });
    }

    // 3. Recursively search for nested CLAUDE.md files in the docs directory
    const nestedNodes = await this.findNestedClaudeMdFiles(docsPath, projectRoot, 2);
    if (nestedNodes.length > 0) {
      nodes.push({
        type: 'directory',
        name: 'Documentation Context',
        path: docsPath,
        children: nestedNodes,
      });
    }

    return nodes;
  }

  private async readClaudeMdFile(
    filePath: string,
    scope: ClaudeMdScope,
    level: number,
    displayPath: string
  ): Promise<ClaudeMdFile | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = matter(content);
      const frontmatter = parsed.data as Frontmatter;

      return {
        name: 'CLAUDE.md',
        path: filePath,
        relativePath: displayPath,
        scope,
        level,
        content: parsed.content,
        frontmatter: Object.keys(frontmatter).length > 0 ? frontmatter : null,
        directoryPath: path.dirname(filePath),
      };
    } catch {
      return null;
    }
  }

  private async findNestedClaudeMdFiles(
    dirPath: string,
    projectRoot: string,
    level: number
  ): Promise<ClaudeMdNode[]> {
    const nodes: ClaudeMdNode[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Skip hidden files/directories and node_modules
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue;
        }

        if (entry.isDirectory()) {
          // Check if this directory contains a .claude/CLAUDE.md
          const claudeDir = path.join(fullPath, '.claude');
          const claudeMdPath = path.join(claudeDir, 'CLAUDE.md');

          try {
            await fs.access(claudeMdPath);
            const relativePath = path.relative(projectRoot, claudeMdPath);
            const file = await this.readClaudeMdFile(claudeMdPath, 'nested', level, relativePath);

            if (file) {
              nodes.push({
                type: 'directory',
                name: entry.name,
                path: fullPath,
                children: [{
                  type: 'file',
                  name: 'CLAUDE.md',
                  path: claudeMdPath,
                  file,
                }],
              });
            }
          } catch {
            // No CLAUDE.md in this directory, continue
          }

          // Recursively search subdirectories
          const childNodes = await this.findNestedClaudeMdFiles(fullPath, projectRoot, level + 1);
          if (childNodes.length > 0) {
            // If we already added this directory (because it has CLAUDE.md), add children to it
            const existingNode = nodes.find(n => n.path === fullPath);
            if (existingNode && existingNode.children) {
              existingNode.children.push(...childNodes);
            } else {
              // Otherwise create a new directory node
              nodes.push({
                type: 'directory',
                name: entry.name,
                path: fullPath,
                children: childNodes,
              });
            }
          }
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }

    return nodes;
  }
}
