import { revalidatePath } from 'next/cache';

/** Pages that show the Instagram grid: the homepage band and The Farm's "Follow along". */
export function refreshSocialPages() {
  try {
    revalidatePath('/');
    revalidatePath('/farm');
  } catch (error) {
    console.error('Could not refresh social pages:', error);
  }
}
