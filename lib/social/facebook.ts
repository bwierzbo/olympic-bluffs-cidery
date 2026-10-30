import type { SocialMediaItem } from './types';

/**
 * Facebook Page publisher. Uses a non-expiring Page token (FB_PAGE_TOKEN,
 * made from a long-lived user token) with pages_manage_posts. The Meta app
 * stays in development mode since it only touches our own Page.
 */
const VERSION = () => process.env.META_GRAPH_VERSION?.trim() || 'v26.0';

export function facebookConfigured(): boolean {
  return Boolean(process.env.FB_PAGE_ID && process.env.FB_PAGE_TOKEN);
}

interface FbPost {
  mediaType: string;
  imageUrl: string;
  videoUrl: string | null;
  media: SocialMediaItem[];
  permalink: string;
}

async function graphPost(path: string, params: Record<string, string>, host = 'graph.facebook.com'): Promise<{ id: string; post_id?: string }> {
  const body = new URLSearchParams({ ...params, access_token: process.env.FB_PAGE_TOKEN! });
  const res = await fetch(`https://${host}/${VERSION()}/${path}`, { method: 'POST', body, cache: 'no-store' });
  const data = (await res.json().catch(() => null)) as { id?: string; post_id?: string; error?: { message?: string } } | null;
  if (!res.ok || !data?.id) throw new Error(`Facebook: ${data?.error?.message ?? `HTTP ${res.status}`}`);
  return { id: data.id, post_id: data.post_id };
}

/** Publishes one Instagram post to the Page. Returns the Facebook post or video id. */
export async function publishToFacebook(post: FbPost, message: string): Promise<string> {
  const page = process.env.FB_PAGE_ID!;

  if (post.mediaType === 'VIDEO' && post.videoUrl) {
    // Facebook downloads the MP4 from our Blob copy and processes it in the background.
    const { id } = await graphPost(`${page}/videos`, { file_url: post.videoUrl, description: message }, 'graph-video.facebook.com');
    return id;
  }

  if (post.mediaType === 'CAROUSEL_ALBUM') {
    const images = post.media.filter((m) => m.type === 'IMAGE');
    // Facebook albums can't mix in videos, so point at the full post on Instagram.
    const text = post.media.some((m) => m.type === 'VIDEO') ? `${message}\n\n${post.permalink}`.trim() : message;
    if (images.length === 0) {
      const { id } = await graphPost(`${page}/feed`, { message: text, link: post.permalink });
      return id;
    }
    // Upload each photo unpublished, then attach them all to one feed post.
    // (Unpublished photos left behind by a failed attempt expire on their own.)
    const ids: string[] = [];
    for (const image of images) {
      ids.push((await graphPost(`${page}/photos`, { url: image.url, published: 'false' })).id);
    }
    const params: Record<string, string> = { message: text };
    ids.forEach((id, i) => {
      params[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id });
    });
    const { id } = await graphPost(`${page}/feed`, params);
    return id;
  }

  // IMAGE, or a video Instagram wouldn't hand over (posted as its cover photo with a link).
  const caption = post.mediaType === 'VIDEO' ? `${message}\n\n${post.permalink}`.trim() : message;
  const { id, post_id } = await graphPost(`${page}/photos`, { url: post.imageUrl, caption });
  return post_id ?? id;
}
