import { revalidatePath, revalidateTag } from 'next/cache';
import { TICKETED_EVENTS_TAG } from './cache-tags';

/**
 * The homepage, Events and Visit pages are pre-rendered, and the header's
 * next-event pill is in the root layout. After anything that changes what
 * the public sees about events (publish, edit, cancel, a seat sold), refresh
 * the cached event data and the whole site's cached pages so the change
 * shows immediately.
 */
export function refreshPublicEventPages() {
  try {
    revalidateTag(TICKETED_EVENTS_TAG, { expire: 0 });
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('Could not refresh event pages:', error);
  }
}
