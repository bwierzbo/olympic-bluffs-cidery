import { OrderStatus, FulfillmentMethod } from './types';

/**
 * Allowed status transitions per the status model spec.
 * Terminal statuses (completed, cancelled) have no outgoing transitions.
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  confirmed:  ['processing', 'on_hold', 'cancelled'],
  processing: ['ready', 'shipped', 'on_hold', 'cancelled'],
  ready:      ['completed', 'on_hold', 'cancelled'],
  shipped:    ['completed', 'on_hold', 'cancelled'],
  on_hold:    ['confirmed', 'processing', 'cancelled'],
  completed:  [],
  cancelled:  [],
};

/** Terminal statuses that cannot be transitioned out of. */
const TERMINAL_STATUSES: OrderStatus[] = ['completed', 'cancelled'];

/** Statuses that require a note when transitioning to them. */
const NOTE_REQUIRED_STATUSES: OrderStatus[] = ['on_hold', 'cancelled'];

export interface TransitionValidationResult {
  valid: boolean;
  errorCode?: 'INVALID_TRANSITION' | 'FULFILLMENT_MISMATCH' | 'NOTE_REQUIRED';
  detail?: string;
  allowedTransitions?: OrderStatus[];
}

/**
 * Validate whether a status transition is allowed.
 *
 * Checks:
 * 1. Current status is not terminal
 * 2. Target status is in the allowed transitions list
 * 3. Fulfillment-type rules: `ready` only for pickup, `shipped` only for shipping
 * 4. Note is required for `on_hold` and `cancelled`
 */
export function validateTransition(
  order: { status: string; fulfillmentMethod: string },
  newStatus: OrderStatus,
  note?: string,
): TransitionValidationResult {
  const currentStatus = order.status as OrderStatus;

  // Terminal states allow no transitions
  if (TERMINAL_STATUSES.includes(currentStatus)) {
    return {
      valid: false,
      errorCode: 'INVALID_TRANSITION',
      detail: `Cannot transition from terminal status '${currentStatus}'`,
      allowedTransitions: [],
    };
  }

  // Check allowed transitions for current status
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(newStatus)) {
    return {
      valid: false,
      errorCode: 'INVALID_TRANSITION',
      detail: `Cannot transition from '${currentStatus}' to '${newStatus}'`,
      allowedTransitions: getAllowedTransitions(order),
    };
  }

  // Fulfillment-type validation
  if (newStatus === 'ready' && order.fulfillmentMethod !== 'pickup') {
    return {
      valid: false,
      errorCode: 'FULFILLMENT_MISMATCH',
      detail: "'ready' status is only for pickup orders",
    };
  }
  if (newStatus === 'shipped' && order.fulfillmentMethod !== 'shipping') {
    return {
      valid: false,
      errorCode: 'FULFILLMENT_MISMATCH',
      detail: "'shipped' status is only for shipping orders",
    };
  }

  // Note required for on_hold and cancelled
  if (NOTE_REQUIRED_STATUSES.includes(newStatus) && (!note || !note.trim())) {
    return {
      valid: false,
      errorCode: 'NOTE_REQUIRED',
      detail: `A note is required when transitioning to '${newStatus}'`,
    };
  }

  return { valid: true };
}

/**
 * Get the list of valid next statuses for an order,
 * filtered by the order's fulfillment method.
 */
export function getAllowedTransitions(
  order: { status: string; fulfillmentMethod: string },
): OrderStatus[] {
  const currentStatus = order.status as OrderStatus;
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];

  return allowed.filter((status) => {
    if (status === 'ready' && order.fulfillmentMethod !== 'pickup') return false;
    if (status === 'shipped' && order.fulfillmentMethod !== 'shipping') return false;
    return true;
  });
}

/**
 * Check whether a given status is terminal (no further transitions possible).
 */
export function isTerminalStatus(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/**
 * Check whether a transition to the given status requires a note.
 */
export function isNoteRequired(status: OrderStatus): boolean {
  return NOTE_REQUIRED_STATUSES.includes(status);
}
