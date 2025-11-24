import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';
import type { ClaudeConfig, Skill, Command, Agent, Hook, SkillMetadata, Frontmatter } from '@/types';

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
}
