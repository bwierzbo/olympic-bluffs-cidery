-- Event registration: seat holds during payment, refunds, reminders.
ALTER TABLE "events" ADD COLUMN "imageAlt" TEXT;
ALTER TABLE "events" ADD COLUMN "cancelledAt" TIMESTAMP(3);

ALTER TABLE "event_registrations" ADD COLUMN "holdExpiresAt" TIMESTAMP(3);
ALTER TABLE "event_registrations" ADD COLUMN "refundId" TEXT;
ALTER TABLE "event_registrations" ADD COLUMN "reminderSentAt" TIMESTAMP(3);
ALTER TABLE "event_registrations" ADD COLUMN "cancelledAt" TIMESTAMP(3);
