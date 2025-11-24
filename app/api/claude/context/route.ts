import { NextResponse } from 'next/server';
import { getServices } from '@/server/services';
import { getServerConfig } from '@/server/config';
import type { ClaudeMdNode } from '@/types';

export async function GET() {
  try {
    const config = getServerConfig();
    const { claudeConfigService } = getServices();

    const nodes: ClaudeMdNode[] = await claudeConfigService.getClaudeMdFiles(
      config.homeDir,
      config.projectRoot,
      config.docsPath
    );

    return NextResponse.json(nodes);
  } catch (error) {
    console.error('Error getting CLAUDE.md files:', error);
    return NextResponse.json(
      { error: 'Failed to get CLAUDE.md files' },
      { status: 500 }
    );
  }
}
