import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runGraphify } from '@/lib/graphify';
import { simpleGit } from 'simple-git';
import path from 'path';
import fs from 'fs/promises';

function isValidGitHubUrl(url: string): boolean {
  const githubUrlPattern = /^https?:\/\/(www\.)?github\.com\/[^\/]+\/[^\/]+\/?$/;
  return githubUrlPattern.test(url);
}

function extractRepoName(url: string): string {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (match) {
    return match[2].replace(/\.git$/, '');
  }
  return 'unknown';
}

function sanitizeLocalPath(rootDir: string, repoName: string) {
  const resolvedRoot = path.resolve(rootDir);
  const resolvedTarget = path.resolve(resolvedRoot, 'repos', repoName);

  if (!resolvedTarget.startsWith(resolvedRoot)) {
    throw new Error('Invalid repository path');
  }

  return resolvedTarget;
}

async function cloneRepository(repositoryId: string, localPath: string, githubUrl: string, branch: string) {
  try {
    await prisma.repository.update({
      where: { id: repositoryId },
      data: { indexingStatus: 'cloning', error: null }
    });

    await prisma.indexingJob.updateMany({
      where: { repositoryId },
      data: { status: 'running', progress: 10, error: null }
    });

    const dataDir = path.join(process.cwd(), 'data');
    const reposDir = path.join(dataDir, 'repos');
    await fs.mkdir(reposDir, { recursive: true });

    const git = simpleGit();
    await git.clone(githubUrl, localPath, ['--branch', branch, '--depth', '1']);

    await prisma.indexingJob.updateMany({
      where: { repositoryId },
      data: { progress: 45 }
    });

    const repoLanguage = await detectRepositoryLanguage(localPath);
    const outputPath = path.join(dataDir, 'graphs', `${path.basename(localPath)}.graph.json`);
    const graphResult = await runGraphify(localPath, outputPath);

    if (!graphResult.success || !graphResult.graphPath) {
      throw new Error(graphResult.error || 'Failed to generate repository graph');
    }

    await prisma.repository.update({
      where: { id: repositoryId },
      data: {
        indexingStatus: 'ready',
        localPath,
        graphPath: graphResult.graphPath,
        language: repoLanguage,
        error: null,
      }
    });

    await prisma.indexingJob.updateMany({
      where: { repositoryId },
      data: { status: 'completed', progress: 100, error: null }
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

async function detectRepositoryLanguage(repoPath: string): Promise<string | null> {
  try {
    const entries = await fs.readdir(repoPath, { withFileTypes: true });
    const files = entries.flatMap((entry) => {
      if (entry.isDirectory()) return []; 
      return [entry.name];
    });

    if (files.some((file) => ['package.json', 'next.config.ts', 'tailwind.config.js'].includes(file))) {
      return 'TypeScript';
    }

    if (files.some((file) => file.endsWith('.py'))) {
      return 'Python';
    }

    if (files.some((file) => file.endsWith('.go'))) {
      return 'Go';
    }

    if (files.some((file) => file.endsWith('.rs'))) {
      return 'Rust';
    }

    return files.length > 0 ? 'Mixed' : 'Unknown';
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { githubUrl, branch = 'main' } = body;

    if (!githubUrl || !isValidGitHubUrl(githubUrl)) {
      return NextResponse.json(
        { error: 'Invalid GitHub URL. Use format: https://github.com/owner/repo' },
        { status: 400 }
      );
    }

    const allowedHost = (process.env.GITHUB_ALLOWED_HOST || 'github.com').toLowerCase();
    const parsedUrl = new URL(githubUrl);
    if (parsedUrl.hostname.toLowerCase() !== allowedHost) {
      return NextResponse.json(
        { error: `Only ${allowedHost} repositories are allowed.` },
        { status: 400 }
      );
    }

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
    const dataDir = path.join(process.cwd(), 'data');
    const localPath = sanitizeLocalPath(dataDir, repoName);

    const repository = await prisma.repository.create({
      data: {
        name: repoName,
        githubUrl,
        branch,
        localPath,
        indexingStatus: 'validating',
      }
    });

    const indexingJob = await prisma.indexingJob.create({
      data: {
        repositoryId: repository.id,
        status: 'pending',
        progress: 0,
      }
    });

    cloneRepository(repository.id, localPath, githubUrl, branch).catch((error) => {
      console.error('Background clone failed:', error);
    });

    return NextResponse.json({ repository, indexingJob }, { status: 201 });
  } catch (error) {
    console.error('Repository creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create repository' },
      { status: 500 }
    );
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
