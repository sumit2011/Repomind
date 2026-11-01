import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
    }

    const mimeType = file.type || '';
    if (!allowedMimeTypes.has(mimeType)) {
      return NextResponse.json({ error: 'Unsupported file type. Please upload PNG, JPEG, WEBP, or GIF.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Image file is too large. Maximum size is 5MB.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : mimeType === 'image/gif' ? 'gif' : 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const filepath = path.join(uploadsDir, filename);

    await fs.writeFile(filepath, buffer);

    return NextResponse.json({
      url: `/api/uploads/${filename}`,
      filename,
      mimeType,
      size: buffer.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to process uploaded image' }, { status: 500 });
  }
}
