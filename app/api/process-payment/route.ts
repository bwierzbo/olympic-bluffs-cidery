import { NextRequest, NextResponse } from 'next/server';
import { getSquareClient, getSquarePublicConfig } from '@/lib/square';
import { createOrder } from '@/lib/orders';
import { OrderItem } from '@/lib/types';
import { randomUUID } from 'crypto';
import { sendOrderConfirmation, sendFarmNotification } from '@/lib/email';
import { chargeCard, describeDecline, SquareApiError } from '@/lib/payments';

// Shape of an item from the checkout request body
interface CheckoutItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  variation?: { id: string; name: string };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceId, amount, customerInfo, fulfillmentMethod, shippingAddress, items } = body;

    // Validate required fields
    if (!sourceId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = getSquareClient();
    const { locationId } = getSquarePublicConfig();

    // Calculate amounts
    const shippingCost = fulfillmentMethod === 'shipping' ? 1995 : 0;
    const subtotal = amount - shippingCost;

    // 1. Create a Square Order first so it shows as "Online" in dashboard
    const squareOrderResult = await client.orders.create({
      order: {
        locationId,
        referenceId: `OB-${Date.now()}`,
        source: { name: 'Olympic Bluffs Website' },
        lineItems: items.map((item: CheckoutItem) => ({
          name: item.name,
          quantity: String(item.quantity),
          basePriceMoney: {
            amount: BigInt(item.price),
            currency: 'USD',
          },
          ...(item.variation ? { note: item.variation.name } : {}),
        })),
        ...(shippingCost > 0
          ? {
              serviceCharges: [
                {
                  name: 'Shipping',
                  amountMoney: { amount: BigInt(shippingCost), currency: 'USD' },
                  calculationPhase: 'TOTAL_PHASE' as const,
                },
              ],
            }
          : {}),
      },
      idempotencyKey: randomUUID(),
    });

    const squareOrderId = squareOrderResult.order?.id;

    // 2. Charge the card, attached to the Square Order (shared helper, also
    //    used by event registrations).
    const payment = await chargeCard({
      sourceId,
      amountCents: amount,
      squareOrderId,
      buyerEmail: customerInfo?.email,
    });

    {
      const paymentId = payment.paymentId;
      const orderId = squareOrderResult.order?.referenceId || `OB-${Date.now()}-${randomUUID().substring(0, 8)}`;

      // Transform cart items to order items
      const orderItems: OrderItem[] = items.map((item: CheckoutItem) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        variation: item.variation,
      }));

      // Save order to our database
      try {
        const order = await createOrder({
          id: orderId,
          items: orderItems,
          customerInfo,
          fulfillmentMethod,
          shippingAddress,
          subtotal,
          shippingCost,
          tax: 0,
          total: amount,
          paymentId,
        });

        console.log('Order created successfully:', orderId);

        // Send email notifications
        try {
          await Promise.all([
            sendOrderConfirmation(order),
            sendFarmNotification(order),
          ]);
          console.log('Email notifications sent successfully');
        } catch (emailError) {
          console.error('Failed to send email notifications:', emailError);
        }
      } catch (orderError) {
        console.error('Failed to save order:', orderError);
      }

      return NextResponse.json({
        success: true,
        orderId,
        payment: {
          id: payment.paymentId,
          status: payment.status,
          receiptUrl: payment.receiptUrl,
        },
      });
    }
  } catch (error: unknown) {
    const err = error as SquareApiError;
    console.error('Payment processing error:', error);

    // Declined card: return a user-friendly message
    const decline = describeDecline(error);
    if (decline) {
      return NextResponse.json({ success: false, error: decline }, { status: 400 });
    }

    // Extract error message from Square API error
    let errorMessage = 'Payment failed. Please try again.';
    if (err.errors && err.errors.length > 0) {
      errorMessage = err.errors[0].detail || errorMessage;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
