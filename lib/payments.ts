import { randomUUID } from 'crypto';
import { getSquareClient, getSquarePublicConfig } from '@/lib/square';

/**
 * Shared Square card charge used by shop orders today and event
 * registrations later (Phase 6). The caller tokenizes the card in the
 * browser with the Square Web Payments SDK and passes the token as sourceId.
 */

export interface ChargeCardInput {
  sourceId: string;
  amountCents: number;
  buyerEmail?: string;
  /** Square order id to attach the payment to (optional). */
  squareOrderId?: string;
  /** Free-text note shown in the Square dashboard. */
  note?: string;
  /** Reuse an idempotency key to make a retry safe. */
  idempotencyKey?: string;
}

export interface ChargeCardResult {
  paymentId: string;
  status: string | undefined;
  receiptUrl: string | undefined;
}

// Partial shape of Square SDK error objects we read from
export interface SquareApiError {
  body?: { payment?: { status?: string } };
  errors?: Array<{ code?: string; detail?: string }>;
}

export async function chargeCard(input: ChargeCardInput): Promise<ChargeCardResult> {
  const client = getSquareClient();
  const { locationId } = getSquarePublicConfig();

  const result = await client.payments.create({
    sourceId: input.sourceId,
    idempotencyKey: input.idempotencyKey ?? randomUUID(),
    amountMoney: {
      amount: BigInt(Math.round(input.amountCents)),
      currency: 'USD',
    },
    locationId,
    ...(input.squareOrderId ? { orderId: input.squareOrderId } : {}),
    ...(input.buyerEmail ? { buyerEmailAddress: input.buyerEmail } : {}),
    ...(input.note ? { note: input.note } : {}),
  });

  if (!result.payment) {
    const detail = result.errors?.[0]?.detail || 'Payment was not successful';
    throw new Error(detail);
  }

  return {
    paymentId: result.payment.id || randomUUID(),
    status: result.payment.status,
    receiptUrl: result.payment.receiptUrl,
  };
}

/**
 * Turn a Square error into something a customer can read. Returns null when
 * the error is not a card decline (caller should treat it as a server error).
 */
export function describeDecline(error: unknown): string | null {
  const err = error as SquareApiError;
  if (!(err.body && err.body.payment && err.body.payment.status === 'FAILED')) return null;
  const code = err.errors?.[0]?.code;
  if (code === 'INSUFFICIENT_FUNDS') return 'Insufficient funds. Please try a different card.';
  if (code === 'CVV_FAILURE') return 'Invalid CVV. Please check your card details.';
  if (code === 'INVALID_EXPIRATION') return 'Invalid expiration date. Please check your card details.';
  return 'Your card was declined. Please try a different payment method.';
}
