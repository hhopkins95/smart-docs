import { NextRequest, NextResponse } from 'next/server';
import { getServices } from '@/server/services';
import { getServerConfig } from '@/server/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pluginId, enabled } = body;

    if (!pluginId || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const config = getServerConfig();
    const { pluginManager } = getServices();

    await pluginManager.togglePlugin(config.projectRoot, pluginId, enabled);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error toggling plugin:', error);
    return NextResponse.json(
      { error: 'Failed to toggle plugin' },
      { status: 500 }
    );
  }
}
