import videoData from '@/data/videos.json';

export interface HighlightVideo {
  youtubeId: string;
  title: string;
  orientation: 'portrait' | 'landscape';
}

// YouTube Data API v3. Set YOUTUBE_API_KEY in .env.local (and in Vercel) to
// pull the playlist live; without it, the site uses the fallback list in
// data/videos.json. We moved off the public RSS feed because YouTube made it
// unreliable (frequent 404/500s) and it capped at ~15 videos.
const API_KEY = process.env.YOUTUBE_API_KEY;

const OEMBED_URL = (youtubeId: string) =>
  `https://www.youtube.com/oembed?url=https://www.youtube.com/shorts/${youtubeId}&format=json`;

// How long to trust the playlist before re-fetching (seconds). The page
// inherits this as its revalidate window, so playlist edits show up within ~1h.
const PLAYLIST_TTL = 3600;
// Orientation never changes for a given video, so cache it for a day.
const ORIENTATION_TTL = 86400;

// Titles the API returns for videos that can't be shown publicly.
const UNAVAILABLE_TITLES = new Set(['Private video', 'Deleted video']);

interface PlaylistItem {
  snippet?: {
    title?: string;
    resourceId?: { videoId?: string };
  };
}

interface PlaylistResponse {
  items?: PlaylistItem[];
  nextPageToken?: string;
}

/**
 * Detect portrait (Shorts) vs landscape via YouTube's oEmbed endpoint, which
 * returns the player width/height when queried with the /shorts/ URL form.
 * Small cacheable JSON GET; defaults to landscape if the request fails.
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

/** Page through the Data API to collect every {id, title} in the playlist. */
async function fetchPlaylistItems(
  playlistId: string
): Promise<{ youtubeId: string; title: string }[]> {
  const videos: { youtubeId: string; title: string }[] = [];
  let pageToken = '';

  do {
    const url =
      `https://www.googleapis.com/youtube/v3/playlistItems` +
      `?part=snippet&maxResults=50&playlistId=${playlistId}` +
      `&key=${API_KEY}${pageToken ? `&pageToken=${pageToken}` : ''}`;

    const res = await fetch(url, { next: { revalidate: PLAYLIST_TTL } });
    if (!res.ok) throw new Error(`YouTube API ${res.status}`);

    const data = (await res.json()) as PlaylistResponse;
    for (const item of data.items ?? []) {
      const youtubeId = item.snippet?.resourceId?.videoId;
      const title = item.snippet?.title;
      if (youtubeId && title && !UNAVAILABLE_TITLES.has(title)) {
        videos.push({ youtubeId, title });
      }
    }
    pageToken = data.nextPageToken ?? '';
  } while (pageToken);

  return videos;
}

/**
 * Fetch the highlight videos from the configured YouTube playlist via the Data
 * API, using each video's real title and auto-detecting orientation. Falls back
 * to the static list in data/videos.json if no API key is set or the API fails.
 */
export async function getPlaylistVideos(): Promise<HighlightVideo[]> {
  const playlistId = videoData.playlistId;
  if (!API_KEY || !playlistId) return fallbackVideos();

  try {
    const items = await fetchPlaylistItems(playlistId);
    if (items.length === 0) return fallbackVideos();

    return Promise.all(
      items.map(async (v) => ({
        ...v,
        orientation: await detectOrientation(v.youtubeId),
      }))
    );
  } catch {
    return fallbackVideos();
  }
}
