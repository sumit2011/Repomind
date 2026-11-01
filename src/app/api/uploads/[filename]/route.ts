import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    const filePath = path.join(uploadsDir, filename);
    const file = await fs.readFile(filePath);

    const extension = path.extname(filename).toLowerCase();
    const contentType = extension === '.png'
      ? 'image/png'
      : extension === '.webp'
        ? 'image/webp'
        : extension === '.gif'
          ? 'image/gif'
          : 'image/jpeg';

    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('Serve upload error:', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
