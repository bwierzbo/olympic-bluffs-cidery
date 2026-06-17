import VideoCarousel from '@/components/VideoCarousel';
import InstagramFeed from '@/components/InstagramFeed';
import { getPlaylistVideos } from '@/lib/youtube';

/**
 * "Follow Along" section for the On the Farm page — a live look at what's
 * recent: the Instagram feed (via Behold) plus the YouTube video highlights
 * (reused from the homepage playlist). Green background to sit between the
 * white farm grid above and the dark FAQ below.
 */
export default async function FarmMedia() {
  const videos = await getPlaylistVideos();

  return (
    <section className="bg-sage-500 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-wide text-white md:text-4xl">
            FOLLOW ALONG
          </h2>
          <p className="mx-auto max-w-2xl leading-relaxed text-sage-50">
            The latest from the farm — recent posts and video highlights.
          </p>
        </div>

        {/* Recent Instagram posts */}
        <InstagramFeed />

        {/* Video highlights from the YouTube playlist */}
        {videos.length > 0 && (
          <div className="mt-16">
            <h3 className="mb-8 text-center text-xl font-semibold tracking-wide text-white">
              Video Highlights
            </h3>
            <VideoCarousel videos={videos} onDark />
          </div>
        )}
      </div>
    </section>
  );
}
