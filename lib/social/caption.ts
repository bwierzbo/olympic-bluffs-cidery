/** Opt-out tag: a post with this in its caption stays on Instagram and the website only. */
const IG_ONLY = /(^|\s)#igonly\b/i;

export function isIgOnly(caption: string): boolean {
  return IG_ONLY.test(caption);
}

/** Caption for Facebook/TikTok: drops #igonly and points "link in bio" at the website. */
export function crossPostCaption(caption: string): string {
  return caption
    .replace(/(^|[ \t])#igonly\b/gi, '$1')
    .replace(/link in (?:our |my )?bio/gi, 'olympicbluffs.com')
    .replace(/[ \t]+$/gm, '')
    .trim();
}
