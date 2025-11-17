import { NextRequest, NextResponse } from 'next/server';
import { squareClient } from '@/lib/square';
import { randomUUID } from 'crypto';

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

    // Create payment with Square
    const result = await squareClient.payments.create({
      sourceId,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: BigInt(amount),
        currency: 'USD',
      },
      locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
      // Optional: Add buyer information
      ...(customerInfo && {
        buyerEmailAddress: customerInfo.email,
      }),
    });

    if (result.payment) {
      // Payment successful
      const orderId = result.payment.id || randomUUID();

      // Here you could:
      // - Save order to database
      // - Send confirmation email
      // - Update inventory
      // - Log the order details

      console.log('Payment successful:', {
        orderId,
        amount,
        customerInfo,
        fulfillmentMethod,
        items,
      });

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
      // Payment failed
      return NextResponse.json(
        {
          success: false,
          error: result.errors?.[0]?.detail || 'Payment was not successful',
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Payment processing error:', error);

    // Extract error message from Square API error
    let errorMessage = 'Payment failed. Please try again.';
    if (error.errors && error.errors.length > 0) {
      errorMessage = error.errors[0].detail || errorMessage;
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
