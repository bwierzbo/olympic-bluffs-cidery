import Image from 'next/image';
import { Eyebrow, Section, SectionTitle } from '@/components/site/Section';
import { getVisiblePosts } from '@/lib/social/feed';
import { getSiteConfig } from '@/lib/site-config';
import type { PublicSocialPost } from '@/lib/social/types';

/** Alt text from the caption: first line, hashtags dropped, kept short. */
function altText(post: PublicSocialPost): string {
  const text = post.caption.split('\n')[0].replace(/#[\p{L}\p{N}_]+/gu, '').replace(/\s+/g, ' ').trim();
  if (!text) return 'Instagram post from Olympic Bluffs';
  return text.length > 120 ? `${text.slice(0, 117)}…` : text;
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}

function CarouselIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="7" y="7" width="13" height="13" rx="2" />
      <path d="M4 16V6a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

/**
 * Homepage band of our latest Instagram posts, mirrored by the social cron
 * (lib/social/sync.ts). Renders nothing until there are posts, or if the
 * database is unreachable.
 */
export default async function InstagramFeed() {
  const posts = await getVisiblePosts({ limit: 8 }).catch((error) => {
    console.error('Homepage: Instagram feed unavailable', error);
    return [] as PublicSocialPost[];
  });
  if (posts.length === 0) return null;
  const { instagram } = getSiteConfig().contact;

  return (
    <Section tone="alt">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>From the farm</Eyebrow>
          <SectionTitle className="max-w-[22ch]">What&rsquo;s happening on the bluff</SectionTitle>
        </div>
        <a href={instagram} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
          Follow on Instagram
        </a>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        {posts.map((post) => (
          <li key={post.id}>
            <a
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-square overflow-hidden bg-paper"
            >
              <Image
                src={post.imageUrl}
                alt={altText(post)}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                quality={65}
                className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.04]"
              />
              {post.mediaType !== 'IMAGE' && (
                <span className="absolute right-2 top-2 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                  {post.mediaType === 'VIDEO' ? <PlayIcon /> : <CarouselIcon />}
                  <span className="sr-only">{post.mediaType === 'VIDEO' ? 'Video' : 'Album'}</span>
                </span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}
