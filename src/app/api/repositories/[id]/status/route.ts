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
          take: 1
        }
      }
    });

    if (!repository) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }

    const latestJob = repository.indexingJobs[0];

    return NextResponse.json({
      status: repository.indexingStatus,
      progress: latestJob?.progress || 0,
      error: repository.error,
      jobStatus: latestJob?.status
    });
  } catch (error) {
    console.error('Status fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
