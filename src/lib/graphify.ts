import path from 'path';
import fs from 'fs/promises';

export interface GraphNode {
  id: string;
  type: 'file' | 'module' | 'class' | 'function';
  label: string;
  file?: string;
  description?: string;
  language?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'contains' | 'imports' | 'depends_on' | 'calls';
}

export interface RepositoryGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    repository: string;
    generatedAt: string;
    fileCount: number;
    nodeCount: number;
    edgeCount: number;
  };
}

export interface GraphifyResult {
  success: boolean;
  graphPath?: string;
  error?: string;
}

const EXCLUDED_DIRS = new Set([
  '.git',
  '.next',
  'node_modules',
  'dist',
  'build',
  '.turbo',
  'coverage',
  '.venv',
  'vendor',
  '__pycache__',
]);

const SUPPORTED_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.cs', '.md', '.json'
]);

function normalizeRepoRelativePath(filePath: string, repoRoot: string) {
  return path.relative(repoRoot, filePath).split(path.sep).join('/');
}

async function walkRepository(repoPath: string, repoRoot: string, files: string[]) {
  const entries = await fs.readdir(repoPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.github') continue;
    if (EXCLUDED_DIRS.has(entry.name)) continue;

    const fullPath = path.join(repoPath, entry.name);

    if (entry.isDirectory()) {
      await walkRepository(fullPath, repoRoot, files);
      continue;
    }

    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (SUPPORTED_EXTENSIONS.has(ext) || entry.name === 'Dockerfile' || entry.name === 'Makefile') {
      files.push(fullPath);
    }
  }
}

function extractSymbols(fileContent: string): { functions: string[]; classes: string[]; imports: string[] } {
  const symbols = {
    functions: [] as string[],
    classes: [] as string[],
    imports: [] as string[]
  };

  const functionPatterns = [
    /export\s+(?:default\s+)?async\s+function\s+([A-Z_a-z][A-Za-z0-9_]*)/g,
    /export\s+(?:default\s+)?function\s+([A-Z_a-z][A-Za-z0-9_]*)/g,
    /(?:const|let|var)\s+([A-Z_a-z][A-Za-z0-9_]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g,
    /class\s+([A-Z_a-z][A-Za-z0-9_]*)/g,
    /function\s+([A-Z_a-z][A-Za-z0-9_]*)\s*\(/g,
    /def\s+([A-Z_a-z][A-Za-z0-9_]*)\s*\(/g,
  ];

  for (const pattern of functionPatterns) {
    for (const match of fileContent.matchAll(pattern)) {
      const identifier = match[1];
      if (!identifier) continue;
      if (identifier.startsWith('exports') || identifier.startsWith('module')) continue;
      if (pattern.source.includes('class')) {
        symbols.classes.push(identifier);
      } else {
        symbols.functions.push(identifier);
      }
    }
  }

  const importPatterns = [
    /import\s+(?:[^'";]+\s+from\s+)?['"]([^'"]+)['"]/g,
    /require\(['"]([^'"]+)['"]\)/g,
    /from\s+['"]([^'"]+)['"]/g,
  ];

  for (const pattern of importPatterns) {
    for (const match of fileContent.matchAll(pattern)) {
      const imported = match[1];
      if (!imported) continue;
      symbols.imports.push(imported);
    }
  }

  return symbols;
}

export async function runGraphify(repoPath: string, outputPath: string): Promise<GraphifyResult> {
  try {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    const files: string[] = [];
    await walkRepository(repoPath, repoPath, files);

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const fileNodeMap = new Map<string, string>();

    for (const file of files) {
      const relativePath = normalizeRepoRelativePath(file, repoPath);
      const fileNodeId = `file-${relativePath}`;

      fileNodeMap.set(relativePath, fileNodeId);
      nodes.push({
        id: fileNodeId,
        type: 'file',
        label: relativePath,
        file: relativePath,
        language: path.extname(file).slice(1) || 'text',
      });

      const content = await fs.readFile(file, 'utf-8');
      const { functions, classes, imports } = extractSymbols(content);

      const seenFunctionNames = new Set<string>();
      for (const fnName of functions) {
        if (seenFunctionNames.has(fnName)) continue;
        seenFunctionNames.add(fnName);

        const fnNodeId = `fn:${relativePath}:${fnName}`;
        nodes.push({
          id: fnNodeId,
          type: 'function',
          label: fnName,
          file: relativePath,
          description: `Function defined in ${relativePath}`,
        });

        edges.push({
          id: `edge:${fileNodeId}->${fnNodeId}`,
          source: fileNodeId,
          target: fnNodeId,
          type: 'contains',
        });
      }

      const seenClassNames = new Set<string>();
      for (const className of classes) {
        if (seenClassNames.has(className)) continue;
        seenClassNames.add(className);

        const classNodeId = `class:${relativePath}:${className}`;
        nodes.push({
          id: classNodeId,
          type: 'class',
          label: className,
          file: relativePath,
          description: `Class defined in ${relativePath}`,
        });

        edges.push({
          id: `edge:${fileNodeId}->${classNodeId}`,
          source: fileNodeId,
          target: classNodeId,
          type: 'contains',
        });
      }

      for (const importTarget of imports) {
        if (!importTarget.startsWith('.') && !importTarget.startsWith('/')) {
          continue;
        }

        const resolvedImport = importTarget.startsWith('.')
          ? path.resolve(path.dirname(file), importTarget)
          : path.resolve(repoPath, importTarget);

        if (!resolvedImport.startsWith(repoPath)) continue;

        const normalizedTarget = normalizeRepoRelativePath(resolvedImport, repoPath);
        const targetNodeId = fileNodeMap.get(normalizedTarget) ?? `file-${normalizedTarget}`;

        edges.push({
          id: `edge:${fileNodeId}->${targetNodeId}:${importTarget}`,
          source: fileNodeId,
          target: targetNodeId,
          type: 'imports',
        });
      }
    }

    const graph: RepositoryGraph = {
      nodes,
      edges,
      metadata: {
        repository: repoPath,
        generatedAt: new Date().toISOString(),
        fileCount: files.length,
        nodeCount: nodes.length,
        edgeCount: edges.length,
      },
    };

    await fs.writeFile(outputPath, JSON.stringify(graph, null, 2));

    return {
      success: true,
      graphPath: outputPath,
    };
  } catch (error) {
    console.error('Graphify error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function buildGraphContext(graph: RepositoryGraph | null, query: string): { context: string; citations: string[] } {
  if (!graph || !graph.nodes.length) {
    return {
      context: 'Repository graph not available yet. Use repository metadata and file names to guide the answer.',
      citations: [],
    };
  }

  const queryTerms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  const rankedNodes = graph.nodes
    .map((node) => {
      const searchable = `${node.label} ${node.file ?? ''} ${node.description ?? ''}`.toLowerCase();
      let score = 0;

      for (const term of queryTerms) {
        if (!term) continue;
        if (searchable.includes(term)) {
          score += 2;
        }
      }

      if (node.type === 'file') {
        score += 1;
      }

      return { node, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  if (!rankedNodes.length) {
    return {
      context: `Repository graph metadata: ${graph.metadata.fileCount} files analyzed; query does not exactly match available nodes. Use repository name and general project structure for an answer.`,
      citations: Array.from(new Set(graph.nodes.filter((node) => node.type === 'file').map((node) => node.file).filter(Boolean))).slice(0, 5) as string[],
    };
  }

  const citations = Array.from(new Set(rankedNodes.map(({ node }) => node.file).filter(Boolean))) as string[];

  const lines = rankedNodes.map(({ node }) => {
    const location = node.file ? ` (${node.file})` : '';
    return `- ${node.type}: ${node.label}${location}`;
  });

  return {
    context: `Relevant graph nodes for the query:\n${lines.join('\n')}`,
    citations,
  };
}

export async function checkGraphifyAvailable(): Promise<boolean> {
  return true;
}
