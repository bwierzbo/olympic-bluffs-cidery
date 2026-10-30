import type { SocialPost } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { PublicSocialPost, SocialMediaItem, SocialMediaType } from './types';

export function toPublicPost(post: SocialPost): PublicSocialPost {
  return {
    id: post.id,
    caption: post.caption,
    mediaType: post.mediaType as SocialMediaType,
    imageUrl: post.imageUrl,
    videoUrl: post.videoUrl,
    media: post.media as unknown as SocialMediaItem[],
    permalink: post.permalink,
    postedAt: post.postedAt.toISOString(),
  };
}

/** "#sequimlavender" matches that tag exactly, not #sequimlavenderfestival. */
function hasTag(caption: string, tag: string): boolean {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`#${escaped}(?![\\p{L}\\p{N}_])`, 'iu').test(caption);
}

/** Latest visible posts for the website and the partner JSON feed. */
export async function getVisiblePosts({ limit, tag }: { limit: number; tag?: string }): Promise<PublicSocialPost[]> {
  const cleanTag = tag?.replace(/^#/, '').trim();
  const posts = await prisma.socialPost.findMany({
    where: { hidden: false, ...(cleanTag ? { caption: { contains: `#${cleanTag}`, mode: 'insensitive' } } : {}) },
    orderBy: { postedAt: 'desc' },
    // Over-fetch when filtering, since the SQL match is looser than hasTag.
    take: cleanTag ? limit * 4 : limit,
  });
  const filtered = cleanTag ? posts.filter((p) => hasTag(p.caption, cleanTag)) : posts;
  return filtered.slice(0, limit).map(toPublicPost);
}
