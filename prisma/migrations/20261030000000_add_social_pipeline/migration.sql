-- Social pipeline: Instagram posts mirrored for the website feed, their
-- Facebook/TikTok cross-post deliveries, and rotating tokens/watcher state.
CREATE TABLE "social_posts" (
    "id" TEXT NOT NULL,
    "caption" TEXT NOT NULL DEFAULT '',
    "mediaType" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "videoUrl" TEXT,
    "media" JSONB NOT NULL,
    "permalink" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_posts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "social_posts_postedAt_idx" ON "social_posts"("postedAt");

CREATE TABLE "social_deliveries" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "postId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "remoteId" TEXT,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_deliveries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "social_deliveries_postId_platform_key" ON "social_deliveries"("postId", "platform");
CREATE INDEX "social_deliveries_status_idx" ON "social_deliveries"("status");
ALTER TABLE "social_deliveries" ADD CONSTRAINT "social_deliveries_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "social_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_settings_pkey" PRIMARY KEY ("key")
);
