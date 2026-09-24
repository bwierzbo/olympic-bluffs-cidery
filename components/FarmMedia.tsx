import VideoCarousel from '@/components/VideoCarousel';
import InstagramFeed from '@/components/InstagramFeed';
import { Eyebrow, Section, SectionTitle } from '@/components/site/Section';
import { getPlaylistVideos } from '@/lib/youtube';

/**
 * "Follow along" band at the foot of The Farm page: the Instagram feed (via
 * Behold) plus the YouTube video highlights from the homepage playlist.
 * Sits on the light alternate ground, so both children render in ink.
 */
export default async function FarmMedia() {
  const videos = await getPlaylistVideos();

  return (
    <Section tone="alt">
      <Eyebrow>From the farm this week</Eyebrow>
      <SectionTitle>Follow along</SectionTitle>
      <p className="mt-3 max-w-[56ch] leading-relaxed text-ink-2">
        Recent posts and video highlights from the fields, the orchard and the cidery.
      </p>

      <div className="mt-10">
        <InstagramFeed />
      </div>

      {videos.length > 0 && (
        <div className="mt-16">
          <h3 className="mb-8 text-center font-serif text-2xl">Video highlights</h3>
          <VideoCarousel videos={videos} />
        </div>
      )}
    </Section>
  );
}
