import siteConfigData from '@/config/site-config.json';

export type SeasonTheme = 'spring' | 'summer' | 'fall' | 'winter';

export interface SiteConfig {
  seasonal: {
    theme: SeasonTheme;
    banner: {
      visible: boolean;
      message: string;
      backgroundColor: string;
    };
    homePageMessage: string;
    farmStatus: {
      isOpen: boolean;
      customMessage: string;
    };
  };
  events: {
    active: boolean;
    name: string;
    slug: string;
    href: string;
    dates: string;
    shortDescription: string;
    insertAfter: string;
  };
  navigation: {
    showEventsTab: boolean;
    showLavender: boolean;
    showCidery: boolean;
  };
  themeColors: {
    spring: { primary: string; accent: string };
    summer: { primary: string; accent: string };
    fall: { primary: string; accent: string };
    winter: { primary: string; accent: string };
  };
  hours?: {
    seasonStart?: string;
    seasonEnd?: string;
    weekly: Partial<Record<'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat', [string, string]>>;
    note?: string;
  };
  contact: {
    address1: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    email: string;
    instagram: string;
    facebook: string;
    mapsUrl: string;
  };
}

/**
 * Get the site configuration
 * This can be called from Server Components or API routes
 */
export function getSiteConfig(): SiteConfig {
  return siteConfigData as unknown as SiteConfig;
}

/**
 * Get the current season's theme colors
 */
export function getCurrentThemeColors() {
  const config = getSiteConfig();
  return config.themeColors[config.seasonal.theme];
}

/**
 * Check if events tab should be shown in navigation
 */
export function shouldShowEventsTab(): boolean {
  const config = getSiteConfig();
  return config.navigation.showEventsTab && config.events.active;
}

/**
 * Get active event details (if any)
 */
export function getActiveEvent() {
  const config = getSiteConfig();
  if (!config.events.active) return null;
  return config.events;
}
