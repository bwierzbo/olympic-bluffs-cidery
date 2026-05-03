import { NextRequest, NextResponse } from 'next/server';
import { getSquareClient, getSquarePublicConfig } from '@/lib/square';
import { createOrder } from '@/lib/orders';
import { OrderItem } from '@/lib/types';
import { randomUUID } from 'crypto';
import { sendOrderConfirmation, sendFarmNotification } from '@/lib/email';

// Shape of an item from the checkout request body
interface CheckoutItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  variation?: { id: string; name: string };
}

// Partial shape of Square SDK error objects we read from
interface SquareApiError {
  body?: { payment?: { status?: string } };
  errors?: Array<{ code?: string; detail?: string }>;
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

    // 2. Create payment attached to the Square Order
    const result = await client.payments.create({
      sourceId,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: BigInt(Math.round(amount)),
        currency: 'USD',
      },
      locationId,
      orderId: squareOrderId,
      ...(customerInfo && {
        buyerEmailAddress: customerInfo.email,
      }),
    });

    if (result.payment) {
      const paymentId = result.payment.id || randomUUID();
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
          id: result.payment.id,
          status: result.payment.status,
          receiptUrl: result.payment.receiptUrl,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.errors?.[0]?.detail || 'Payment was not successful',
        },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    const err = error as SquareApiError;
    console.error('Payment processing error:', error);

    // Check if this is a declined payment (has payment object with FAILED status)
    if (err.body && err.body.payment && err.body.payment.status === 'FAILED') {
      // Payment was declined but processed - return as failed with user-friendly message
      const errorCode = err.errors?.[0]?.code;
      let userMessage = 'Your card was declined. Please try a different payment method.';

      // Customize message based on error code
      if (errorCode === 'INSUFFICIENT_FUNDS') {
        userMessage = 'Insufficient funds. Please try a different card.';
      } else if (errorCode === 'CVV_FAILURE') {
        userMessage = 'Invalid CVV. Please check your card details.';
      } else if (errorCode === 'INVALID_EXPIRATION') {
        userMessage = 'Invalid expiration date. Please check your card details.';
      }

      return NextResponse.json(
        {
          success: false,
          error: userMessage,
        },
        { status: 400 }
      );
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
