import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

/** Farm photos the owners can pick for an event (files in /public/images). */
const IMAGES = [
  { src: '/images/farm/the-fields.jpeg', label: 'Lavender fields' },
  { src: '/images/home-lavender-hero.jpg', label: 'Lavender bundles' },
  { src: '/images/hours-lavender-basket.jpg', label: 'Lavender basket' },
  { src: '/images/farm/lavender-banner.jpg', label: 'Lavender rows' },
  { src: '/images/farm/lavender-boutique.jpeg', label: 'Lavender boutique' },
  { src: '/images/farm/orchard.jpeg', label: 'Orchard blossom' },
  { src: '/images/farm/keg.jpeg', label: 'Cidery taps' },
  { src: '/images/home-cidery-building.jpeg', label: 'Cidery building' },
  { src: '/images/farm/bluffs.jpeg', label: 'The bluffs' },
  { src: '/images/farm/apiary.jpg', label: 'Apple tree and apiary' },
  { src: '/images/saltandcedar/chairs.jpg', label: 'Chairs on the bluff' },
  { src: '/images/farm/salt-cedar-bnb.jpeg', label: 'Salt & Cedar' },
  { src: '/images/makers/rebelution-yoga.jpg', label: 'Yoga and cider' },
  { src: '/images/makers/goat-and-radish.jpg', label: 'Charcuterie board' },
];

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  return NextResponse.json({ images: IMAGES });
}
