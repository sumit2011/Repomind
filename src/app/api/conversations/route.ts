import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repositoryId, title } = body;

    if (!repositoryId) {
      return NextResponse.json(
        { error: 'Repository ID is required' },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.create({
      data: {
        repositoryId,
        title: title || 'New Conversation'
      }
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const conversations = await prisma.conversation.findMany({
      include: {
        repository: {
          select: {
            id: true,
            name: true,
            githubUrl: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Fetch conversations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
