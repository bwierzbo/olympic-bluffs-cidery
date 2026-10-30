import { put } from '@vercel/blob';
import type { IgMedia } from './instagram';
import type { SocialMediaItem } from './types';

/**
 * Copies a post's photos, videos and video covers into Vercel Blob
 * (social/<igId>/<n>.<ext>). Instagram's CDN URLs expire, and Facebook and
 * TikTok pull from these copies.
 */
const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
};

async function copyToBlob(postId: string, n: number, sourceUrl: string, kind: 'image' | 'video'): Promise<string> {
  const res = await fetch(sourceUrl, { cache: 'no-store' });
  if (!res.ok || !res.body) throw new Error(`Couldn't download ${kind} from Instagram (HTTP ${res.status})`);
  const contentType = res.headers.get('content-type')?.split(';')[0].trim() || (kind === 'video' ? 'video/mp4' : 'image/jpeg');
  const ext = EXT[contentType] ?? (kind === 'video' ? 'mp4' : 'jpg');
  const blob = await put(`social/${postId}/${n}.${ext}`, res.body, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
    // Videos can be tens of MB; multipart streams them in parts.
    multipart: kind === 'video',
  });
  return blob.url;
}

export interface MirroredPost {
  imageUrl: string;
  videoUrl: string | null;
  media: SocialMediaItem[];
}

/** Returns null when Instagram gave us nothing displayable (e.g. a video with no cover). */
export async function mirrorPost(post: IgMedia): Promise<MirroredPost | null> {
  const sources =
    post.media_type === 'CAROUSEL_ALBUM'
      ? (post.children?.data ?? [])
      : [{ id: post.id, media_type: post.media_type, media_url: post.media_url, thumbnail_url: post.thumbnail_url }];

  let n = 0;
  const media: SocialMediaItem[] = [];
  for (const child of sources) {
    if (child.media_type === 'VIDEO') {
      // media_url is omitted for videos Instagram won't hand out (e.g. licensed audio).
      const cover = child.thumbnail_url ? await copyToBlob(post.id, n++, child.thumbnail_url, 'image') : undefined;
      const url = child.media_url ? await copyToBlob(post.id, n++, child.media_url, 'video') : undefined;
      if (url) media.push({ type: 'VIDEO', url, cover });
      else if (cover) media.push({ type: 'IMAGE', url: cover });
    } else if (child.media_url) {
      media.push({ type: 'IMAGE', url: await copyToBlob(post.id, n++, child.media_url, 'image') });
    }
  }

  const first = media[0];
  const imageUrl = first?.type === 'VIDEO' ? first.cover : first?.url;
  if (!imageUrl) return null;
  const videoUrl = post.media_type === 'VIDEO' && first.type === 'VIDEO' ? first.url : null;
  return { imageUrl, videoUrl, media };
}
