-- Add new columns to orders table
ALTER TABLE "orders" ADD COLUMN "trackingNumber" TEXT;
ALTER TABLE "orders" ADD COLUMN "adminNotes" TEXT;

-- Create audit log table
CREATE TABLE "order_audit_log" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "orderId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_audit_log_pkey" PRIMARY KEY ("id")
);

-- Indexes on audit log
CREATE INDEX "order_audit_log_orderId_idx" ON "order_audit_log"("orderId");
CREATE INDEX "order_audit_log_createdAt_idx" ON "order_audit_log"("createdAt");
CREATE INDEX "order_audit_log_action_idx" ON "order_audit_log"("action");

-- New indexes on orders
CREATE INDEX "orders_fulfillmentMethod_idx" ON "orders"("fulfillmentMethod");
CREATE INDEX "orders_paymentId_idx" ON "orders"("paymentId");

-- Foreign key
ALTER TABLE "order_audit_log" ADD CONSTRAINT "order_audit_log_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
