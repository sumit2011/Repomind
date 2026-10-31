import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { chatWithGemma, isGeminiConfigured } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repositoryId, conversationId, query, imageUrl } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Check if Gemini is configured
    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: 'AI not configured. Please set GEMINI_API_KEY.' },
        { status: 503 }
      );
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      });
    }

    if (!conversation && repositoryId) {
      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          repositoryId,
          title: query.slice(0, 50) + (query.length > 50 ? '...' : '')
        },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      });
    }

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or repository ID required' },
        { status: 404 }
      );
    }

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: query,
        imageUrl
      }
    });

    // Build message history for AI
    const messageHistory = conversation.messages.map((msg: any) => ({
      role: msg.role as 'user' | 'model',
      content: msg.content
    }));

    // Add current query
    messageHistory.push({ role: 'user', content: query });

    // Get repository context (placeholder - will implement graph retrieval in Phase 3)
    let context = '';
    if (conversation.repositoryId) {
      const repository = await prisma.repository.findUnique({
        where: { id: conversation.repositoryId }
      });
      
      if (repository && repository.indexingStatus === 'ready') {
        context = `Repository: ${repository.name}\nGitHub URL: ${repository.githubUrl}\nBranch: ${repository.branch}\n\nNote: Graph-based context retrieval will be implemented in Phase 3. Currently using basic repository metadata.`;
      }
    }

    // Get AI response
    const aiResponse = await chatWithGemma(messageHistory, context);

    // Save AI response
    const savedMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse.content,
        citations: JSON.stringify(aiResponse.citations || [])
      }
    });

    return NextResponse.json({
      message: {
        id: savedMessage.id,
        role: 'assistant',
        content: aiResponse.content,
        citations: aiResponse.citations
      },
      conversationId: conversation.id
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process chat' },
      { status: 500 }
    );
  }
}
