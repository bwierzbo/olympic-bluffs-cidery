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
        amount: BigInt(Math.round(amount)), // Convert to BigInt, ensure it's an integer
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

    // Check if this is a declined payment (has payment object with FAILED status)
    if (error.body && error.body.payment && error.body.payment.status === 'FAILED') {
      // Payment was declined but processed - return as failed with user-friendly message
      const errorCode = error.errors?.[0]?.code;
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
