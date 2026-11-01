import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { chatWithGemma, isGeminiConfigured } from '@/lib/gemini';
import { buildGraphContext } from '@/lib/graphify';
import fs from 'fs/promises';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repositoryId, conversationId, query, imageUrl } = body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: 'AI not configured. Please set GEMINI_API_KEY.' },
        { status: 503 }
      );
    }

    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
    }

    if (!conversation && repositoryId) {
      conversation = await prisma.conversation.create({
        data: {
          repositoryId,
          title: query.trim().slice(0, 60) + (query.trim().length > 60 ? '...' : ''),
        },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
    }

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or repository ID required' },
        { status: 404 }
      );
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: query,
        imageUrl: imageUrl || null,
      },
    });

    const messageHistory: Array<{ role: 'user' | 'model'; content: string }> = conversation.messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      content: msg.content,
    }));

    messageHistory.push({ role: 'user', content: query });

    let context = `Repository metadata:\n- Repository ID: ${repositoryId || conversation.repositoryId}\n`;
    let citations: string[] = [];

    const repository = await prisma.repository.findUnique({
      where: { id: conversation.repositoryId },
    });

    if (repository) {
      context += `- Name: ${repository.name}\n- GitHub URL: ${repository.githubUrl}\n- Branch: ${repository.branch}\n- Status: ${repository.indexingStatus}\n`;

      if (repository.graphPath) {
        try {
          const graphRaw = await fs.readFile(repository.graphPath, 'utf-8');
          const graph = JSON.parse(graphRaw);
          const graphContext = buildGraphContext(graph, query);
          context += `${graphContext.context}\n`;
          citations = graphContext.citations;
        } catch (error) {
          console.warn('Could not read repository graph:', error);
        }
      }
    }

    if (imageUrl) {
      context += `\nUploaded image reference: ${imageUrl}\nUse the image as additional context for architecture or debugging questions.`;
    }

    const aiResponse = await chatWithGemma(messageHistory, context, citations);

    const savedMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse.content,
        citations: JSON.stringify(aiResponse.citations || []),
      },
    });

    return NextResponse.json({
      message: {
        id: savedMessage.id,
        role: 'assistant',
        content: aiResponse.content,
        citations: aiResponse.citations,
      },
      conversationId: conversation.id,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process chat' },
      { status: 500 }
    );
  }
}
