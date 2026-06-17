import videoData from '@/data/videos.json';

export interface HighlightVideo {
  youtubeId: string;
  title: string;
  orientation: 'portrait' | 'landscape';
}

const FEED_URL = (playlistId: string) =>
  `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;

// Query oEmbed via the /shorts/ URL form: YouTube returns the true portrait
// dimensions for Shorts this way (113x200), while the /watch form always
// reports the 16:9 player (200x113) even for a Short. Regular videos still
// report landscape here, so height>width cleanly identifies a Short.
const OEMBED_URL = (youtubeId: string) =>
  `https://www.youtube.com/oembed?url=https://www.youtube.com/shorts/${youtubeId}&format=json`;

// How long to trust the playlist before re-fetching (seconds). The homepage
// inherits this as its revalidate window, so playlist edits show up within ~1h.
const PLAYLIST_TTL = 3600;
// Orientation never changes for a given video, so cache it for a day.
const ORIENTATION_TTL = 86400;

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** Pull {id, title} pairs out of the playlist RSS feed (one per <entry>). */
function parseFeed(xml: string): { youtubeId: string; title: string }[] {
  const entries = xml.split('<entry>').slice(1); // drop the feed header chunk
  const videos: { youtubeId: string; title: string }[] = [];
  for (const entry of entries) {
    const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title = entry.match(/<title>([^<]*)<\/title>/)?.[1];
    if (id && title) {
      videos.push({ youtubeId: id, title: decodeEntities(title.trim()) });
    }
  }
  return videos;
}

/**
 * Detect portrait (Shorts) vs landscape via YouTube's oEmbed endpoint, which
 * returns the player width/height. Small cacheable JSON GET; defaults to
 * landscape if the request fails.
 */
async function detectOrientation(
  youtubeId: string
): Promise<'portrait' | 'landscape'> {
  try {
    const res = await fetch(OEMBED_URL(youtubeId), {
      next: { revalidate: ORIENTATION_TTL },
    });
    if (!res.ok) return 'landscape';
    const data = (await res.json()) as { width?: number; height?: number };
    if (data.height && data.width && data.height > data.width) {
      return 'portrait';
    }
    return 'landscape';
  } catch {
    return 'landscape';
  }
}

function fallbackVideos(): HighlightVideo[] {
  return (videoData.fallbackVideos ?? []).map((v) => ({
    youtubeId: v.youtubeId,
    title: v.title,
    orientation: v.orientation === 'portrait' ? 'portrait' : 'landscape',
  }));
}

/**
 * Fetch the highlight videos from the configured YouTube playlist, using each
 * video's real YouTube title and auto-detecting orientation. Falls back to the
 * static list in data/videos.json if the playlist can't be reached.
 */
export async function getPlaylistVideos(): Promise<HighlightVideo[]> {
  const playlistId = videoData.playlistId;
  if (!playlistId) return fallbackVideos();

  try {
    const res = await fetch(FEED_URL(playlistId), {
      next: { revalidate: PLAYLIST_TTL },
    });
    if (!res.ok) return fallbackVideos();

    const parsed = parseFeed(await res.text());
    if (parsed.length === 0) return fallbackVideos();

    return Promise.all(
      parsed.map(async (v) => ({
        ...v,
        orientation: await detectOrientation(v.youtubeId),
      }))
    );
  } catch {
    return fallbackVideos();
  }
}
