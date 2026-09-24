-- Events and classes with registration (reserved for Phase 6)
CREATE TABLE "events" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "pricePerSeat" INTEGER NOT NULL,
    "maxSeatsPerOrder" INTEGER NOT NULL DEFAULT 4,
    "requires21" BOOLEAN NOT NULL DEFAULT false,
    "waitlistEnabled" BOOLEAN NOT NULL DEFAULT false,
    "registrationClosesAt" TIMESTAMP(3),
    "refundPolicy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");
CREATE INDEX "events_status_idx" ON "events"("status");
CREATE INDEX "events_startsAt_idx" ON "events"("startsAt");

CREATE TABLE "event_registrations" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "seats" INTEGER NOT NULL,
    "amountPaid" INTEGER NOT NULL,
    "paymentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "checkedInAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "event_registrations_eventId_idx" ON "event_registrations"("eventId");
CREATE INDEX "event_registrations_email_idx" ON "event_registrations"("email");
CREATE INDEX "event_registrations_status_idx" ON "event_registrations"("status");

ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Newsletter: subscribers, campaigns, per-recipient deliveries
CREATE TABLE "newsletter_subscribers" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'subscribed',
    "source" TEXT,
    "unsubscribeToken" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "unsubscribedAt" TIMESTAMP(3),

    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "newsletter_subscribers_email_key" ON "newsletter_subscribers"("email");
CREATE UNIQUE INDEX "newsletter_subscribers_unsubscribeToken_key" ON "newsletter_subscribers"("unsubscribeToken");
CREATE INDEX "newsletter_subscribers_status_idx" ON "newsletter_subscribers"("status");

CREATE TABLE "newsletter_campaigns" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "subject" TEXT NOT NULL DEFAULT '',
    "previewText" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "aiBrief" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "newsletter_campaigns_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "newsletter_campaigns_status_idx" ON "newsletter_campaigns"("status");
CREATE INDEX "newsletter_campaigns_createdAt_idx" ON "newsletter_campaigns"("createdAt");

CREATE TABLE "newsletter_deliveries" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "campaignId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resendId" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsletter_deliveries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "newsletter_deliveries_campaignId_subscriberId_key" ON "newsletter_deliveries"("campaignId", "subscriberId");
CREATE INDEX "newsletter_deliveries_campaignId_status_idx" ON "newsletter_deliveries"("campaignId", "status");
ALTER TABLE "newsletter_deliveries" ADD CONSTRAINT "newsletter_deliveries_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "newsletter_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "newsletter_deliveries" ADD CONSTRAINT "newsletter_deliveries_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "newsletter_subscribers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
