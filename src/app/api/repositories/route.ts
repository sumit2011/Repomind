import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { simpleGit } from 'simple-git';
import path from 'path';
import fs from 'fs/promises';

// Validate GitHub URL format
function isValidGitHubUrl(url: string): boolean {
  const githubUrlPattern = /^https?:\/\/(www\.)?github\.com\/[^\/]+\/[^\/]+\/?$/;
  return githubUrlPattern.test(url);
}

// Extract repo name from URL
function extractRepoName(url: string): string {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (match) {
    return match[2];
  }
  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { githubUrl, branch = 'main' } = body;

    // Validate URL
    if (!githubUrl || !isValidGitHubUrl(githubUrl)) {
      return NextResponse.json(
        { error: 'Invalid GitHub URL. Use format: https://github.com/owner/repo' },
        { status: 400 }
      );
    }

    // Check if repository already exists
    const existingRepo = await prisma.repository.findFirst({
      where: { githubUrl }
    });

    if (existingRepo) {
      return NextResponse.json(
        { error: 'Repository already connected', repository: existingRepo },
        { status: 409 }
      );
    }

    const repoName = extractRepoName(githubUrl);
    const dataDir = process.env.DATA_DIR || './data';
    const localPath = path.join(dataDir, 'repos', repoName);

    // Create repository record
    const repository = await prisma.repository.create({
      data: {
        name: repoName,
        githubUrl,
        branch,
        localPath,
        indexingStatus: 'validating'
      }
    });

    // Create indexing job
    const indexingJob = await prisma.indexingJob.create({
      data: {
        repositoryId: repository.id,
        status: 'pending',
        progress: 0
      }
    });

    // Start cloning process asynchronously
    cloneRepository(repository.id, localPath, githubUrl, branch).catch(error => {
      console.error('Cloning error:', error);
    });

    return NextResponse.json({ repository, indexingJob }, { status: 201 });
  } catch (error) {
    console.error('Repository creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create repository' },
      { status: 500 }
    );
  }
}

async function cloneRepository(repositoryId: string, localPath: string, githubUrl: string, branch: string) {
  try {
    // Update status to cloning
    await prisma.repository.update({
      where: { id: repositoryId },
      data: { indexingStatus: 'cloning' }
    });

    await prisma.indexingJob.updateMany({
      where: { repositoryId },
      data: { status: 'running', progress: 10 }
    });

    // Ensure data directory exists
    const dataDir = process.env.DATA_DIR || './data';
    await fs.mkdir(path.join(dataDir, 'repos'), { recursive: true });

    // Clone repository
    await simpleGit().clone(githubUrl, localPath, ['--branch', branch, '--depth', '1']);

    await prisma.indexingJob.updateMany({
      where: { repositoryId },
      data: { progress: 50 }
    });

    // For Phase 2, we'll mark as ready without Graphify integration
    // Phase 3 will add actual Graphify processing
    await prisma.repository.update({
      where: { id: repositoryId },
      data: { 
        indexingStatus: 'ready',
        localPath
      }
    });

    await prisma.indexingJob.updateMany({
      where: { repositoryId },
      data: { status: 'completed', progress: 100 }
    });

  } catch (error) {
    console.error('Cloning error:', error);
    await prisma.repository.update({
      where: { id: repositoryId },
      data: { 
        indexingStatus: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    await prisma.indexingJob.updateMany({
      where: { repositoryId },
      data: { 
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}

export async function GET() {
  try {
    const repositories = await prisma.repository.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ repositories });
  } catch (error) {
    console.error('Fetch repositories error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}
