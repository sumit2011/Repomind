import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const repository = await prisma.repository.findUnique({
      where: { id },
    });

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    if (!repository.graphPath) {
      return NextResponse.json({ nodes: [], edges: [], metadata: { repository: repository.name } });
    }

    const graphJson = await fs.readFile(repository.graphPath, 'utf-8');
    const graph = JSON.parse(graphJson);

    return NextResponse.json(graph);
  } catch (error) {
    console.error('Graph fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch repository graph' }, { status: 500 });
  }
}
