import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/orders';
import { OrderStatus } from '@/lib/types';
import {
  sendProcessingEmail,
  sendReadyForPickupEmail,
  sendShippedEmail,
  sendCompletedEmail,
} from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();
    const { status, note, trackingNumber } = body;

    // Validate status
    const validStatuses: OrderStatus[] = [
      'pending',
      'confirmed',
      'processing',
      'ready',
      'shipped',
      'completed',
      'cancelled',
    ];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update order status
    const updatedOrder = await updateOrderStatus(orderId, status, note);

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Send follow-up email based on new status
    try {
      switch (status) {
        case 'processing':
          await sendProcessingEmail(updatedOrder);
          break;
        case 'ready':
          await sendReadyForPickupEmail(updatedOrder);
          break;
        case 'shipped':
          await sendShippedEmail(updatedOrder, trackingNumber);
          break;
        case 'completed':
          await sendCompletedEmail(updatedOrder);
          break;
        // No email for 'pending', 'confirmed', or 'cancelled' (handled elsewhere)
      }
      console.log(`Follow-up email sent for status: ${status}`);
    } catch (emailError) {
      console.error('Failed to send follow-up email:', emailError);
      // Continue - status was updated successfully
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
