import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { sendOrderConfirmation, sendFarmNotification } from '@/lib/email';
import { Order } from '@/lib/types';

export async function POST(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { customerEmail } = await request.json();

  if (!customerEmail || typeof customerEmail !== 'string') {
    return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
  }

  const testOrder: Order = {
    id: 'TEST-' + Date.now().toString(36).toUpperCase(),
    items: [
      {
        productId: 'lavender-sachet',
        name: 'Lavender Sachet',
        price: 800,
        quantity: 2,
      },
      {
        productId: 'lavender-soap',
        name: 'Lavender Goat Milk Soap',
        price: 1200,
        quantity: 1,
        variation: { id: 'bar', name: 'Full Bar' },
      },
    ],
    customerInfo: {
      firstName: 'Test',
      lastName: 'Customer',
      email: customerEmail,
      phone: '(555) 123-4567',
    },
    fulfillmentMethod: 'pickup',
    subtotal: 2800,
    shippingCost: 0,
    tax: 250,
    total: 3050,
    paymentId: 'test-payment-id',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    statusHistory: [],
  };

  const results = {
    customerEmail: { sent: false, error: '' },
    farmEmail: { sent: false, error: '' },
  };

  try {
    results.customerEmail.sent = await sendOrderConfirmation(testOrder);
    if (!results.customerEmail.sent) {
      results.customerEmail.error = 'Email not configured or send failed';
    }
  } catch (e) {
    results.customerEmail.error = e instanceof Error ? e.message : 'Unknown error';
  }

  try {
    results.farmEmail.sent = await sendFarmNotification(testOrder);
    if (!results.farmEmail.sent) {
      results.farmEmail.error = 'Email not configured or send failed';
    }
  } catch (e) {
    results.farmEmail.error = e instanceof Error ? e.message : 'Unknown error';
  }

  return NextResponse.json(results);
}
