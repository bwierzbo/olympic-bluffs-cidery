import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * Photo upload for events. Stores the file in the site's public Vercel Blob
 * store (BLOB_READ_WRITE_TOKEN) and returns its URL for the event's image.
 */
const MAX_BYTES = 10 * 1024 * 1024;
const TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'Photo storage isn’t connected.' }, { status: 503 });
  }
  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a photo to upload.' }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: 'Use a JPG, PNG or WebP photo.' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'That photo is over 10 MB. Try a smaller one.' }, { status: 400 });

  const base = (file.name || 'photo').replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'photo';
  const blob = await put(`events/${base}.${ext}`, file, {
    access: 'public',
    addRandomSuffix: true,
    contentType: file.type,
  });
  return NextResponse.json({ url: blob.url });
}
