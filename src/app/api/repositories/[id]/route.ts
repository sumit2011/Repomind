import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const repository = await prisma.repository.findUnique({
      where: { id },
      include: {
        indexingJobs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    return NextResponse.json({ repository });
  } catch (error) {
    console.error('Repository fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch repository' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const repository = await prisma.repository.delete({
      where: { id },
    });

    return NextResponse.json({ repository, deleted: true });
  } catch (error) {
    console.error('Repository delete error:', error);
    return NextResponse.json({ error: 'Failed to delete repository' }, { status: 500 });
  }
}
