export type SocialMediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
export type SocialPlatform = 'facebook' | 'tiktok';
export type DeliveryStatus = 'pending' | 'publishing' | 'done' | 'failed' | 'skipped';

/** One photo or video in a post, in Instagram's order. URLs point at our Blob copies. */
export interface SocialMediaItem {
  type: 'IMAGE' | 'VIDEO';
  url: string;
  /** Cover image for a video. */
  cover?: string;
}

/** Shape served by /api/social/feed (and used by the homepage feed). */
export interface PublicSocialPost {
  id: string;
  caption: string;
  mediaType: SocialMediaType;
  imageUrl: string;
  videoUrl: string | null;
  media: SocialMediaItem[];
  permalink: string;
  postedAt: string;
}

export interface AdminDeliveryDTO {
  id: string;
  platform: SocialPlatform;
  status: DeliveryStatus;
  remoteId: string | null;
  error: string | null;
  attempts: number;
  updatedAt: string;
}

export interface AdminSocialPostDTO extends PublicSocialPost {
  hidden: boolean;
  deliveries: AdminDeliveryDTO[];
}

export interface ConnectionStatus {
  configured: boolean;
  /** Plain-language detail, e.g. which env var is missing or the account mode. */
  detail: string;
  expiresAt: string | null;
}

export interface AdminSocialDTO {
  instagram: ConnectionStatus & { lastSyncAt: string | null; lastSyncError: string | null; watchSince: string | null };
  facebook: ConnectionStatus;
  tiktok: ConnectionStatus & { mode: 'inbox' | 'direct'; appConfigured: boolean };
  posts: AdminSocialPostDTO[];
}

export interface SyncResult {
  fetched: number;
  imported: number;
  updated: number;
  published: number;
  failed: number;
  errors: string[];
}
