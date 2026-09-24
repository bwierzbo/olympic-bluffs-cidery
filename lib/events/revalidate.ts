import { revalidatePath } from 'next/cache';

/**
 * The homepage, Events and Visit pages are pre-rendered, and the header's
 * next-event pill is in the root layout. After anything that changes what
 * the public sees about events (publish, edit, cancel, a seat sold), refresh
 * the whole site's cached pages so the change shows immediately.
 */
export function refreshPublicEventPages() {
  try {
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('Could not refresh event pages:', error);
  }
}
