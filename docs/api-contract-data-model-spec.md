# API Contract & Data Model Spec -- Orders Ops Cockpit

**Author**: Backend/API Engineer
**Date**: 2026-02-26
**Status**: Draft -- pending team review

---

## Table of Contents

1. [Overview](#1-overview)
2. [Data Model Changes](#2-data-model-changes)
3. [API Endpoints](#3-api-endpoints)
4. [Authentication](#4-authentication)
5. [Error Contract](#5-error-contract)
6. [Migration Plan](#6-migration-plan)

---

## 1. Overview

This spec defines the API contract and data model for the Orders Ops Cockpit. It covers:

- New Prisma schema for audit log
- Enhanced order list endpoint with pagination, filtering, and sorting
- Status update endpoint with transition validation
- Bulk operations endpoint
- Admin authentication middleware
- Consistent error response contract

### Design Principles

- **Backward compatible**: Existing customer-facing endpoints (`GET /api/orders/[orderId]`, `POST /api/process-payment`) remain unchanged.
- **Admin endpoints namespaced**: All new ops cockpit endpoints live under `/api/admin/orders/*`.
- **Server-side filtering**: Pagination and filters execute in Postgres, not in the browser.
- **Audit by default**: Every status change creates an audit log entry.

---

## 2. Data Model Changes

### 2.1 Current Schema (as-is)

```prisma
model Order {
  id               String   @id
  items            Json
  customerInfo     Json
  fulfillmentMethod String
  shippingAddress  Json?
  subtotal         Int
  shippingCost     Int
  tax              Int
  total            Int
  paymentId        String
  status           String
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  statusHistory    Json

  @@index([status])
  @@index([createdAt])
  @@map("orders")
}
```

### 2.2 New: OrderAuditLog Model

A dedicated table for audit trail. This replaces the JSON `statusHistory` blob for new operations while keeping the existing field for backward compatibility.

```prisma
model OrderAuditLog {
  id          String   @id @default(uuid())
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  action      String   // "status_change", "tracking_added", "note_added", "bulk_status_change"
  actor       String   // "admin", "system", "customer" -- who performed the action
  fromStatus  String?  // previous status (null for non-status actions)
  toStatus    String?  // new status (null for non-status actions)
  note        String?  // optional note or reason
  metadata    Json?    // extra data (tracking number, bulk operation ID, etc.)
  createdAt   DateTime @default(now())

  @@index([orderId])
  @@index([createdAt])
  @@index([action])
  @@map("order_audit_log")
}
```

### 2.3 Order Model Updates

Add relation and new optional fields:

```prisma
model Order {
  // ... existing fields unchanged ...
  trackingNumber   String?  // tracking number for shipped orders
  adminNotes       String?  // internal notes (not shown to customer)
  auditLog         OrderAuditLog[]

  @@index([status])
  @@index([createdAt])
  @@index([fulfillmentMethod])  // NEW: for filtering
  @@index([paymentId])          // NEW: for Square lookups
  @@map("orders")
}
```

### 2.4 TypeScript Types

```typescript
// New types to add to lib/types.ts

export interface OrderAuditEntry {
  id: string;
  orderId: string;
  action: 'status_change' | 'tracking_added' | 'note_added' | 'bulk_status_change';
  actor: 'admin' | 'system' | 'customer';
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus | null;
  note: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string; // ISO date string
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface OrderListFilters {
  status?: OrderStatus | OrderStatus[];
  fulfillmentMethod?: FulfillmentMethod;
  search?: string;           // searches order ID, customer name, email, phone
  dateFrom?: string;         // ISO date
  dateTo?: string;           // ISO date
  sortBy?: 'createdAt' | 'updatedAt' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface BulkStatusUpdateRequest {
  orderIds: string[];
  status: OrderStatus;
  note?: string;
}

export interface BulkStatusUpdateResponse {
  succeeded: string[];       // order IDs that were updated
  failed: Array<{
    orderId: string;
    error: string;           // reason for failure
  }>;
}
```

---

## 3. API Endpoints

All admin endpoints require authentication (see Section 4).

### 3.1 List Orders (with pagination + filters)

**Replaces**: `GET /api/orders` (which returns all orders with no filters)

```
GET /api/admin/orders
```

**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | `1` | Page number (1-based) |
| `pageSize` | int | `25` | Items per page (max 100) |
| `status` | string | -- | Filter by status. Comma-separated for multiple: `confirmed,processing` |
| `fulfillment` | string | -- | Filter: `pickup` or `shipping` |
| `search` | string | -- | Search order ID, customer name, email, phone |
| `dateFrom` | string | -- | ISO date. Orders created on or after |
| `dateTo` | string | -- | ISO date. Orders created on or before |
| `sortBy` | string | `createdAt` | Sort field: `createdAt`, `updatedAt`, `total`, `status` |
| `sortOrder` | string | `desc` | Sort direction: `asc` or `desc` |
| `tab` | string | -- | Shorthand: `active` = statuses `confirmed,processing,ready,shipped`; `completed` = `completed,cancelled`. Overrides `status` if both provided. |

**Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "OB-1708900000-a1b2c3d4",
      "status": "confirmed",
      "fulfillmentMethod": "shipping",
      "customerInfo": {
        "firstName": "Jane",
        "lastName": "Doe",
        "email": "jane@example.com",
        "phone": "555-0100"
      },
      "total": 3500,
      "itemCount": 2,
      "trackingNumber": null,
      "createdAt": "2026-02-20T10:00:00.000Z",
      "updatedAt": "2026-02-20T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "totalItems": 47,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "counts": {
    "active": 12,
    "completed": 35
  }
}
```

**Notes**:
- The list response returns a **summary view** (no `items` array, no `shippingAddress`, no `statusHistory`). This keeps the payload small. Use the detail endpoint for full data.
- `itemCount` is a computed field: sum of quantities across all items.
- `counts` provides tab badge numbers without extra queries (always computed regardless of filters).

**Prisma query sketch**:

```typescript
const where: Prisma.OrderWhereInput = {};
if (statusFilter) where.status = { in: statusFilter };
if (fulfillment) where.fulfillmentMethod = fulfillment;
if (dateFrom || dateTo) {
  where.createdAt = {};
  if (dateFrom) where.createdAt.gte = new Date(dateFrom);
  if (dateTo) where.createdAt.lte = new Date(dateTo);
}
if (search) {
  where.OR = [
    { id: { contains: search, mode: 'insensitive' } },
    { customerInfo: { path: ['email'], string_contains: search } },
    { customerInfo: { path: ['firstName'], string_contains: search } },
    { customerInfo: { path: ['lastName'], string_contains: search } },
    { customerInfo: { path: ['phone'], string_contains: search } },
  ];
}

const [orders, totalItems] = await Promise.all([
  prisma.order.findMany({ where, orderBy, skip, take }),
  prisma.order.count({ where }),
]);
```

---

### 3.2 Get Order Detail

**Replaces**: `GET /api/orders/[orderId]` for admin use

```
GET /api/admin/orders/:orderId
```

**Response** `200 OK`:

```json
{
  "order": {
    "id": "OB-1708900000-a1b2c3d4",
    "items": [...],
    "customerInfo": {...},
    "fulfillmentMethod": "shipping",
    "shippingAddress": {...},
    "subtotal": 2500,
    "shippingCost": 1000,
    "tax": 0,
    "total": 3500,
    "paymentId": "sq_pay_abc123",
    "status": "confirmed",
    "trackingNumber": null,
    "adminNotes": null,
    "createdAt": "2026-02-20T10:00:00.000Z",
    "updatedAt": "2026-02-20T10:00:00.000Z",
    "auditLog": [
      {
        "id": "uuid-1",
        "action": "status_change",
        "actor": "system",
        "fromStatus": null,
        "toStatus": "confirmed",
        "note": "Order confirmed and payment received",
        "metadata": null,
        "createdAt": "2026-02-20T10:00:00.000Z"
      }
    ]
  }
}
```

**Notes**:
- Returns full order with nested `auditLog` (ordered by `createdAt` asc).
- The existing customer-facing `GET /api/orders/[orderId]` remains unchanged (no audit log, no admin notes).

---

### 3.3 Update Order Status

**Replaces**: `POST /api/orders/[orderId]/status`

```
POST /api/admin/orders/:orderId/status
```

**Request Body**:

```json
{
  "status": "processing",
  "note": "Starting to prepare order"
}
```

**Validation Rules**:
- Status must be a valid `OrderStatus` value.
- Status transition must be allowed (see transition map in the status model spec, Task #8).
- If transitioning to `shipped`, `trackingNumber` is accepted as optional metadata.

**Response** `200 OK`:

```json
{
  "success": true,
  "order": {
    "id": "OB-1708900000-a1b2c3d4",
    "status": "processing",
    "updatedAt": "2026-02-26T12:00:00.000Z"
  },
  "auditEntry": {
    "id": "uuid-2",
    "action": "status_change",
    "actor": "admin",
    "fromStatus": "confirmed",
    "toStatus": "processing",
    "note": "Starting to prepare order",
    "createdAt": "2026-02-26T12:00:00.000Z"
  },
  "emailSent": true
}
```

**Error** `422 Unprocessable Entity` (invalid transition):

```json
{
  "error": "Invalid status transition",
  "detail": "Cannot transition from 'completed' to 'processing'",
  "currentStatus": "completed",
  "requestedStatus": "processing",
  "allowedTransitions": ["cancelled"]
}
```

**Side Effects**:
1. Updates `orders.status` and `orders.updatedAt`.
2. Appends to `orders.statusHistory` JSON (backward compat).
3. Creates `OrderAuditLog` row.
4. Sends status email (non-blocking; failure logged but does not fail the request).

---

### 3.4 Update Tracking Number

```
POST /api/admin/orders/:orderId/tracking
```

**Request Body**:

```json
{
  "trackingNumber": "1Z999AA10123456784",
  "note": "Shipped via UPS Ground"
}
```

**Validation**:
- Order must exist.
- Order `fulfillmentMethod` must be `shipping`.
- `trackingNumber` must be a non-empty string.

**Response** `200 OK`:

```json
{
  "success": true,
  "order": {
    "id": "OB-1708900000-a1b2c3d4",
    "trackingNumber": "1Z999AA10123456784",
    "updatedAt": "2026-02-26T12:00:00.000Z"
  },
  "auditEntry": {
    "id": "uuid-3",
    "action": "tracking_added",
    "actor": "admin",
    "note": "Shipped via UPS Ground",
    "metadata": { "trackingNumber": "1Z999AA10123456784" },
    "createdAt": "2026-02-26T12:00:00.000Z"
  }
}
```

**Notes**:
- This does NOT automatically change status to `shipped`. The admin can set tracking and then update status separately, or do both in one flow from the UI.
- If status is currently `processing`, the UI may offer a combined "Ship + Add Tracking" action that calls both endpoints sequentially.

---

### 3.5 Add Admin Note

```
POST /api/admin/orders/:orderId/notes
```

**Request Body**:

```json
{
  "note": "Customer called about delivery window. Prefers morning."
}
```

**Response** `200 OK`:

```json
{
  "success": true,
  "auditEntry": {
    "id": "uuid-4",
    "action": "note_added",
    "actor": "admin",
    "note": "Customer called about delivery window. Prefers morning.",
    "createdAt": "2026-02-26T12:05:00.000Z"
  }
}
```

**Notes**:
- Creates an audit log entry only. The `adminNotes` field on the order is a convenience field for the "latest note" -- it gets overwritten by each new note. The full history is in the audit log.

---

### 3.6 Bulk Status Update

```
POST /api/admin/orders/bulk/status
```

**Request Body**:

```json
{
  "orderIds": ["OB-123-abc", "OB-456-def", "OB-789-ghi"],
  "status": "processing",
  "note": "Batch processing started"
}
```

**Validation**:
- `orderIds` must be a non-empty array, max 50 items.
- `status` must be a valid `OrderStatus`.
- Each order is validated individually for transition legality.

**Response** `200 OK` (partial success is possible):

```json
{
  "succeeded": ["OB-123-abc", "OB-456-def"],
  "failed": [
    {
      "orderId": "OB-789-ghi",
      "error": "Cannot transition from 'completed' to 'processing'"
    }
  ],
  "auditEntries": 2,
  "emailsSent": 2
}
```

**Implementation Notes**:
- Uses a database transaction for all updates (all-or-nothing per individual order, but partial success across the batch).
- Each successful update creates its own `OrderAuditLog` entry with `action: "bulk_status_change"` and `metadata: { bulkOperationId: "<uuid>" }` to group them.
- Emails are sent after all DB writes complete (non-blocking, fire-and-forget).

---

### 3.7 Get Audit Log for Order

```
GET /api/admin/orders/:orderId/audit
```

**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | `1` | Page number |
| `pageSize` | int | `50` | Items per page (max 100) |

**Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "uuid-1",
      "action": "status_change",
      "actor": "system",
      "fromStatus": null,
      "toStatus": "confirmed",
      "note": "Order confirmed and payment received",
      "metadata": null,
      "createdAt": "2026-02-20T10:00:00.000Z"
    },
    {
      "id": "uuid-2",
      "action": "status_change",
      "actor": "admin",
      "fromStatus": "confirmed",
      "toStatus": "processing",
      "note": null,
      "metadata": null,
      "createdAt": "2026-02-21T09:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalItems": 2,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

## 4. Authentication

### Current State

The admin password check (`POST /api/admin/verify`) only gates the UI. The order API routes have zero authentication -- anyone can call `GET /api/orders` or `POST /api/orders/[orderId]/status`.

### Proposed Approach

**Simple cookie-based session** for admin endpoints. No external auth provider needed for this small-team use case.

#### Flow:

1. `POST /api/admin/verify` -- unchanged, but now sets an `HttpOnly` cookie:
   ```
   Set-Cookie: admin_session=<signed-token>; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=28800
   ```
   Token: `HMAC-SHA256(timestamp + "admin", ADMIN_PASSWORD)` -- simple, no DB session table needed.

2. All `/api/admin/*` routes check for this cookie via a shared middleware function:
   ```typescript
   // lib/admin-auth.ts
   export function requireAdmin(request: NextRequest): boolean {
     const cookie = request.cookies.get('admin_session');
     if (!cookie) return false;
     return verifyAdminToken(cookie.value);
   }
   ```

3. If cookie is missing or invalid, return `401 Unauthorized`:
   ```json
   { "error": "Authentication required" }
   ```

4. `POST /api/admin/logout` -- clears the cookie.

**Existing customer-facing routes remain unauthenticated** (`GET /api/orders/[orderId]` for order tracking pages). Order IDs are unguessable (UUID component), so this is acceptable for the current scale.

---

## 5. Error Contract

All admin API endpoints use a consistent error response shape:

```typescript
interface ApiError {
  error: string;           // machine-readable error type
  detail?: string;         // human-readable description
  field?: string;          // which field caused the error (for validation)
  [key: string]: unknown;  // additional context (e.g., allowedTransitions)
}
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| `200` | Success |
| `400` | Bad request (malformed JSON, missing required fields) |
| `401` | Not authenticated |
| `404` | Order not found |
| `422` | Validation error (invalid status transition, business rule violation) |
| `500` | Internal server error |

### Example Error Responses

**400 Bad Request**:
```json
{
  "error": "VALIDATION_ERROR",
  "detail": "pageSize must be between 1 and 100",
  "field": "pageSize"
}
```

**401 Unauthorized**:
```json
{
  "error": "AUTH_REQUIRED",
  "detail": "Authentication required"
}
```

**422 Unprocessable Entity**:
```json
{
  "error": "INVALID_TRANSITION",
  "detail": "Cannot transition from 'completed' to 'processing'",
  "currentStatus": "completed",
  "requestedStatus": "processing",
  "allowedTransitions": ["cancelled"]
}
```

---

## 6. Migration Plan

### 6.1 Prisma Migration: Add OrderAuditLog + Order Fields

**Migration name**: `add_audit_log_and_order_fields`

SQL equivalent:

```sql
-- Add new columns to orders table
ALTER TABLE orders ADD COLUMN "trackingNumber" TEXT;
ALTER TABLE orders ADD COLUMN "adminNotes" TEXT;

-- Create audit log table
CREATE TABLE order_audit_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId" TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  "fromStatus" TEXT,
  "toStatus" TEXT,
  note TEXT,
  metadata JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_audit_order_id ON order_audit_log("orderId");
CREATE INDEX idx_audit_created_at ON order_audit_log("createdAt");
CREATE INDEX idx_audit_action ON order_audit_log(action);

-- New indexes on orders
CREATE INDEX idx_orders_fulfillment ON orders("fulfillmentMethod");
CREATE INDEX idx_orders_payment ON orders("paymentId");
```

### 6.2 Data Migration: Backfill Audit Log from statusHistory

After the schema migration, run a one-time script to convert existing `statusHistory` JSON entries into `OrderAuditLog` rows:

```typescript
// scripts/backfill-audit-log.ts
const orders = await prisma.order.findMany({
  select: { id: true, statusHistory: true },
});

for (const order of orders) {
  const history = order.statusHistory as OrderStatusUpdate[];
  let prevStatus: string | null = null;

  for (const entry of history) {
    await prisma.orderAuditLog.create({
      data: {
        orderId: order.id,
        action: 'status_change',
        actor: 'system', // historical entries attributed to system
        fromStatus: prevStatus,
        toStatus: entry.status,
        note: entry.note || null,
        createdAt: new Date(entry.timestamp),
      },
    });
    prevStatus = entry.status;
  }
}
```

### 6.3 Backward Compatibility

- The `statusHistory` JSON field is **kept** and continues to be appended to on status changes. This ensures existing customer-facing order tracking pages work without changes.
- The `OrderAuditLog` table is the authoritative source for the admin dashboard.
- The old `GET /api/orders` and `POST /api/orders/[orderId]/status` routes remain functional but are soft-deprecated. The admin UI will switch to the new `/api/admin/orders/*` routes.

---

## Appendix: File Mapping for Implementation

| Spec Section | New/Modified File |
|--------------|-------------------|
| Prisma schema | `prisma/schema.prisma` |
| Audit log types | `lib/types.ts` |
| Admin auth middleware | `lib/admin-auth.ts` (new) |
| Order data access (pagination, filters) | `lib/orders.ts` |
| List orders endpoint | `app/api/admin/orders/route.ts` (new) |
| Order detail endpoint | `app/api/admin/orders/[orderId]/route.ts` (new) |
| Status update endpoint | `app/api/admin/orders/[orderId]/status/route.ts` (new) |
| Tracking endpoint | `app/api/admin/orders/[orderId]/tracking/route.ts` (new) |
| Notes endpoint | `app/api/admin/orders/[orderId]/notes/route.ts` (new) |
| Bulk status endpoint | `app/api/admin/orders/bulk/status/route.ts` (new) |
| Audit log endpoint | `app/api/admin/orders/[orderId]/audit/route.ts` (new) |
| Backfill script | `scripts/backfill-audit-log.ts` (new) |
| Migration | `prisma/migrations/YYYYMMDD_add_audit_log_and_order_fields/` |
