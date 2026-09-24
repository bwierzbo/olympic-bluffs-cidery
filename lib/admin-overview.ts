/** Shape of GET /api/admin/overview, shared with the admin home page. */
export interface AdminOverview {
  orders: {
    /** Paid, not yet started (status "confirmed") */
    toProcess: number;
    /** Being prepared */
    processing: number;
    /** Ready for pickup, waiting on the customer */
    readyForPickup: number;
    onHold: number;
    last7Days: number;
    revenueLast30DaysCents: number;
    recent: Array<{
      id: string;
      customerName: string;
      status: string;
      fulfillmentMethod: string;
      totalCents: number;
      createdAt: string;
    }>;
  };
  newsletter: {
    subscribed: number;
    newLast30Days: number;
    drafts: number;
    sending: number;
    lastSent: { id: string; subject: string; sentAt: string; sentCount: number } | null;
  };
  events: {
    upcoming: Array<{ title: string; dates: string; kind: string; link: string }>;
  };
  squareMode: 'sandbox' | 'production';
}
