import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { toPublicDTOs } from '@/lib/events/service';
import EventDetail from '@/components/events/EventDetail';
import type { PublicEventDTO } from '@/lib/events/types';
import { getSiteConfig } from '@/lib/site-config';
import LavenderFestival from '@/components/LavenderFestival';
import { Eyebrow, Section, SectionTitle } from '@/components/site/Section';

interface EventPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = 'force-dynamic';

/** A published or cancelled ticketed event from the admin (drafts stay hidden). */
async function findTicketedEvent(slug: string): Promise<PublicEventDTO | null> {
  const row = await prisma.event.findUnique({ where: { slug } }).catch(() => null);
  if (!row || row.status === 'draft') return null;
  return (await toPublicDTOs([row]))[0] ?? null;
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = getSiteConfig();
  if (config.events.active && config.events.slug === slug) return { title: `${config.events.name} · Olympic Bluffs` };
  const event = await findTicketedEvent(slug);
  if (!event) return { title: 'Event · Olympic Bluffs' };
  const summary = event.description.split(/\n\s*\n/)[0]?.slice(0, 160);
  return {
    title: `${event.title} · Olympic Bluffs`,
    description: summary || undefined,
    openGraph: event.image ? { images: [event.image] } : undefined,
  };
}

/**
 * /events/[slug] serves two kinds of page:
 *  - the Lavender Festival's annual page (site-config `events`; schedule and
 *    FAQ in components/LavenderFestival*.tsx), and
 *  - ticketed events created in the admin, with registration.
 */
export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const config = getSiteConfig();
  const event = config.events;

  if (!event.active || event.slug !== slug) {
    const ticketed = await findTicketedEvent(slug);
    if (!ticketed) notFound();
    return <EventDetail event={ticketed} />;
  }

  return (
    <>
      <LavenderFestival />

      <Section tone="alt">
        <Eyebrow>Plan your visit</Eyebrow>
        <SectionTitle className="max-w-[22ch]">Mark the weekend and come see the fields in bloom</SectionTitle>
        <p className="mt-4 max-w-[56ch] leading-relaxed text-ink-2">
          Hours, directions and what to expect are on the visit page. The boutique is stocked for the weekend, and
          everything we make from the harvest is in the lavender shop.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/visit" className="btn btn-primary">
            Plan your visit
          </Link>
          <Link href="/lavender" className="btn btn-secondary">
            The lavender shop
          </Link>
        </div>
      </Section>
    </>
  );
}
