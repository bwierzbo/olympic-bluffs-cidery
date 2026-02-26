import nodemailer from 'nodemailer';
import { Order } from './types';

/**
 * Email notification helper using Gmail SMTP
 */

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text: string;
}

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/**
 * Send an email
 */
async function sendEmail(template: EmailTemplate): Promise<boolean> {
  try {
    // Skip if credentials not configured
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD ||
        process.env.GMAIL_APP_PASSWORD === 'YOUR_16_CHAR_APP_PASSWORD_HERE') {
      console.log('Email not configured, skipping send to:', template.to);
      console.log('Subject:', template.subject);
      return false;
    }

    await transporter.sendMail({
      from: `"Olympic Bluffs" <${process.env.GMAIL_USER}>`,
      to: template.to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    console.log(`✓ Email sent to ${template.to}: ${template.subject}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Generate order confirmation email
 */
export function generateOrderConfirmationEmail(order: Order): EmailTemplate {
  const itemsList = order.items
    .map(
      item =>
        `${item.name} ${item.variation ? `(${item.variation.name})` : ''} - Qty: ${item.quantity} - $${((item.price * item.quantity) / 100).toFixed(2)}`
    )
    .join('\n');

  const trackingUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/orders/${order.id}`;

  const text = `
Order Confirmation - Olympic Bluffs Cidery & Lavender Farm

Thank you for your order!

Order Number: ${order.id}
Order Date: ${new Date(order.createdAt).toLocaleDateString()}

ITEMS:
${itemsList}

TOTALS:
Subtotal: $${(order.subtotal / 100).toFixed(2)}
${order.shippingCost > 0 ? `Shipping: $${(order.shippingCost / 100).toFixed(2)}` : 'Shipping: FREE (Pickup)'}
${order.tax > 0 ? `Tax: $${(order.tax / 100).toFixed(2)}` : ''}
Total: $${(order.total / 100).toFixed(2)}

FULFILLMENT:
${order.fulfillmentMethod === 'pickup' ? 'Pickup at Olympic Bluffs Cidery & Lavender Farm' : `Shipping to:\n${order.shippingAddress?.addressLine1}\n${order.shippingAddress?.city}, ${order.shippingAddress?.state} ${order.shippingAddress?.postalCode}`}

Track your order: ${trackingUrl}

Questions? Contact us at the farm or visit our website.

Thank you for supporting Olympic Bluffs!
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #6b7566; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">Order Confirmation</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">Olympic Bluffs Cidery & Lavender Farm</p>
  </div>

  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-top: 0;">Thank you for your order!</p>

    <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #666; font-size: 14px;">Order Number</p>
      <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 18px; font-weight: bold;">${order.id}</p>
      <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    <h2 style="font-size: 18px; margin: 30px 0 15px 0;">Order Items</h2>
    <div style="background-color: white; padding: 20px; border-radius: 8px;">
      ${order.items
        .map(
          item => `
        <div style="padding: 10px 0; border-bottom: 1px solid #eee;">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <strong>${item.name}</strong>
              ${item.variation ? `<div style="font-size: 14px; color: #666;">${item.variation.name}</div>` : ''}
              <div style="font-size: 14px; color: #666;">Quantity: ${item.quantity}</div>
            </div>
            <div style="font-weight: bold;">$${((item.price * item.quantity) / 100).toFixed(2)}</div>
          </div>
        </div>
      `
        )
        .join('')}

      <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #eee;">
        <div style="display: flex; justify-content: space-between; margin: 8px 0;">
          <span>Subtotal</span>
          <span>$${(order.subtotal / 100).toFixed(2)}</span>
        </div>
        ${
          order.shippingCost > 0
            ? `<div style="display: flex; justify-content: space-between; margin: 8px 0;">
          <span>Shipping</span>
          <span>$${(order.shippingCost / 100).toFixed(2)}</span>
        </div>`
            : '<div style="display: flex; justify-content: space-between; margin: 8px 0;"><span>Shipping</span><span style="color: #6b7566; font-weight: bold;">FREE</span></div>'
        }
        ${
          order.tax > 0
            ? `<div style="display: flex; justify-content: space-between; margin: 8px 0;">
          <span>Tax</span>
          <span>$${(order.tax / 100).toFixed(2)}</span>
        </div>`
            : ''
        }
        <div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 2px solid #eee; font-size: 18px; font-weight: bold;">
          <span>Total</span>
          <span>$${(order.total / 100).toFixed(2)}</span>
        </div>
      </div>
    </div>

    <h2 style="font-size: 18px; margin: 30px 0 15px 0;">${order.fulfillmentMethod === 'pickup' ? 'Pickup Information' : 'Shipping Information'}</h2>
    <div style="background-color: white; padding: 20px; border-radius: 8px;">
      ${
        order.fulfillmentMethod === 'pickup'
          ? `
        <p style="margin: 0;"><strong>Pickup Location:</strong></p>
        <p style="margin: 5px 0 0 0;">Olympic Bluffs Cidery & Lavender Farm</p>
        <p style="margin: 15px 0 0 0; color: #666; font-size: 14px;">
          We'll notify you when your order is ready for pickup!
        </p>
      `
          : `
        <p style="margin: 0;"><strong>Shipping To:</strong></p>
        <p style="margin: 5px 0 0 0;">
          ${order.shippingAddress?.fullName}<br>
          ${order.shippingAddress?.addressLine1}<br>
          ${order.shippingAddress?.addressLine2 ? `${order.shippingAddress.addressLine2}<br>` : ''}
          ${order.shippingAddress?.city}, ${order.shippingAddress?.state} ${order.shippingAddress?.postalCode}
        </p>
        <p style="margin: 15px 0 0 0; color: #666; font-size: 14px;">
          You'll receive tracking information once your order ships.
        </p>
      `
      }
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${trackingUrl}" style="display: inline-block; background-color: #6b7566; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Track Your Order
      </a>
    </div>

    <p style="text-align: center; color: #666; font-size: 14px; margin: 20px 0 0 0;">
      Questions about your order? <a href="/contact" style="color: #6b7566;">Contact us</a>
    </p>
  </div>

  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
    <p>Thank you for supporting Olympic Bluffs Cidery & Lavender Farm</p>
  </div>
</body>
</html>
  `.trim();

  return {
    to: order.customerInfo.email,
    subject: `Order Confirmation - ${order.id}`,
    html,
    text,
  };
}

/**
 * Generate farm notification email
 */
export function generateFarmNotificationEmail(order: Order): EmailTemplate {
  const itemsList = order.items
    .map(
      item =>
        `• ${item.name} ${item.variation ? `(${item.variation.name})` : ''} (x${item.quantity}) - $${((item.price * item.quantity) / 100).toFixed(2)}`
    )
    .join('\n');

  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/orders`;

  const text = `
NEW ORDER RECEIVED

Order Details:
━━━━━━━━━━━━━━━━━━━━━━
Order ID: ${order.id}
Date: ${new Date(order.createdAt).toLocaleString('en-US', {
  dateStyle: 'long',
  timeStyle: 'short'
})}

Customer Information:
━━━━━━━━━━━━━━━━━━━━━━
Name: ${order.customerInfo.firstName} ${order.customerInfo.lastName}
Email: ${order.customerInfo.email}
Phone: ${order.customerInfo.phone}

Fulfillment Method: ${order.fulfillmentMethod.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━
${order.fulfillmentMethod === 'shipping' ? `
Ship To:
${order.shippingAddress?.fullName}
${order.shippingAddress?.addressLine1}
${order.shippingAddress?.addressLine2 || ''}
${order.shippingAddress?.city}, ${order.shippingAddress?.state} ${order.shippingAddress?.postalCode}
━━━━━━━━━━━━━━━━━━━━━━
` : ''}
Items to Prepare:
━━━━━━━━━━━━━━━━━━━━━━
${itemsList}

Order Total: $${(order.total / 100).toFixed(2)}
${order.shippingCost > 0 ? `(includes $${(order.shippingCost / 100).toFixed(2)} shipping)` : ''}
━━━━━━━━━━━━━━━━━━━━━━

Manage orders: ${adminUrl}
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="background-color: #6b7566; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; margin: -30px -30px 30px -30px;">
      <h1 style="margin: 0; font-size: 24px;">🎉 NEW ORDER</h1>
    </div>

    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 0; color: #666; font-size: 14px;">Order Number</p>
      <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 18px; font-weight: bold;">${order.id}</p>
      <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">${new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</p>
    </div>

    <h2 style="font-size: 18px; margin: 30px 0 15px 0; color: #6b7566;">Customer Information</h2>
    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 5px 0;"><strong>Name:</strong> ${order.customerInfo.firstName} ${order.customerInfo.lastName}</p>
      <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${order.customerInfo.email}">${order.customerInfo.email}</a></p>
      <p style="margin: 5px 0;"><strong>Phone:</strong> ${order.customerInfo.phone}</p>
    </div>

    <h2 style="font-size: 18px; margin: 30px 0 15px 0; color: #6b7566;">Fulfillment</h2>
    <div style="background-color: ${order.fulfillmentMethod === 'pickup' ? '#e8f5e9' : '#e3f2fd'}; padding: 20px; border-radius: 8px; border-left: 4px solid ${order.fulfillmentMethod === 'pickup' ? '#4caf50' : '#2196f3'}; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 18px; font-weight: bold;">${order.fulfillmentMethod === 'pickup' ? '📦 PICKUP' : '🚚 SHIPPING'}</p>
      ${order.fulfillmentMethod === 'shipping' ? `
        <p style="margin: 15px 0 0 0;"><strong>Ship To:</strong></p>
        <p style="margin: 5px 0 0 0; line-height: 1.6;">
          ${order.shippingAddress?.fullName}<br>
          ${order.shippingAddress?.addressLine1}<br>
          ${order.shippingAddress?.addressLine2 ? `${order.shippingAddress.addressLine2}<br>` : ''}
          ${order.shippingAddress?.city}, ${order.shippingAddress?.state} ${order.shippingAddress?.postalCode}
        </p>
      ` : ''}
    </div>

    <h2 style="font-size: 18px; margin: 30px 0 15px 0; color: #6b7566;">Items to Prepare</h2>
    <div style="background-color: #fff9e6; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
      ${order.items
        .map(
          item => `
        <div style="padding: 10px 0; border-bottom: 1px solid #eee;">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div style="flex: 1;">
              <strong style="font-size: 16px;">${item.name}</strong>
              ${item.variation ? `<div style="font-size: 14px; color: #666;">${item.variation.name}</div>` : ''}
              <div style="font-size: 14px; color: #666;">Quantity: <strong>${item.quantity}</strong></div>
            </div>
            <div style="font-weight: bold; font-size: 16px;">$${((item.price * item.quantity) / 100).toFixed(2)}</div>
          </div>
        </div>
      `
        )
        .join('')}

      <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #333;">
        <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
          <span>Total Paid:</span>
          <span style="color: #6b7566;">$${(order.total / 100).toFixed(2)}</span>
        </div>
        ${order.shippingCost > 0 ? `<div style="font-size: 14px; color: #666; text-align: right; margin-top: 5px;">includes $${(order.shippingCost / 100).toFixed(2)} shipping</div>` : ''}
      </div>
    </div>

    <div style="text-align: center; margin: 30px 0 20px 0;">
      <a href="${adminUrl}" style="display: inline-block; background-color: #6b7566; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Manage Orders
      </a>
    </div>

    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
      <p>Olympic Bluffs Cidery & Lavender Farm</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return {
    to: process.env.GMAIL_USER || 'info@olympicbluffs.com',
    subject: `NEW ORDER - ${order.id}`,
    html,
    text,
  };
}

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmation(order: Order): Promise<boolean> {
  const email = generateOrderConfirmationEmail(order);
  return await sendEmail(email);
}

/**
 * Send order notification to farm
 */
export async function sendFarmNotification(order: Order): Promise<boolean> {
  const email = generateFarmNotificationEmail(order);
  return await sendEmail(email);
}

/**
 * Generate "Processing" status update email
 */
function generateProcessingEmail(order: Order): EmailTemplate {
  const trackingUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/orders/${order.id}`;

  const text = `
Hi ${order.customerInfo.firstName},

Great news! Your order is now being processed and prepared with care.

Order Number: ${order.id}
Status: 📦 Processing

${order.fulfillmentMethod === 'pickup'
  ? "We'll send you another email when your order is ready for pickup at the farm."
  : "We'll send you tracking information once your order ships."
}

Track your order: ${trackingUrl}

Thank you for supporting Olympic Bluffs Cidery & Lavender Farm!
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #6b7566; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
      .status-badge { display: inline-block; background-color: #3b82f6; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 20px 0; }
      .order-id { font-family: monospace; background-color: #e5e7eb; padding: 8px 12px; border-radius: 4px; display: inline-block; }
      .footer { text-align: center; margin-top: 30px; color: #6b7566; font-size: 14px; }
      .button { display: inline-block; background-color: #6b7566; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>We're Preparing Your Order! 📦</h1>
      </div>
      <div class="content">
        <p>Hi ${order.customerInfo.firstName},</p>

        <p>Great news! Your order is now being processed and prepared with care.</p>

        <p><strong>Order Number:</strong> <span class="order-id">${order.id}</span></p>

        <div class="status-badge">📦 Processing</div>

        <p>${order.fulfillmentMethod === 'pickup'
          ? "We'll send you another email when your order is ready for pickup at the farm."
          : "We'll send you tracking information once your order ships."
        }</p>

        <p>
          <a href="${trackingUrl}" class="button">
            Track Your Order
          </a>
        </p>

        <div class="footer">
          <p>Thank you for supporting Olympic Bluffs Cidery & Lavender Farm!</p>
          <p>Questions? Reply to this email or visit our contact page.</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `.trim();

  return {
    to: order.customerInfo.email,
    subject: `Your Order is Being Prepared - ${order.id}`,
    html,
    text,
  };
}

/**
 * Generate "Ready for Pickup" email
 */
function generateReadyForPickupEmail(order: Order): EmailTemplate {
  const trackingUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/orders/${order.id}`;

  const text = `
Hi ${order.customerInfo.firstName},

Wonderful news! Your order is ready for pickup.

Order Number: ${order.id}
Status: 🎉 Ready for Pickup

Pickup Location:
Olympic Bluffs Cidery & Lavender Farm
1025 Finn Hall Road, Port Angeles, WA 98362

Pickup Hours:
Please call (571) 439-1311 for pickup hours

What to bring:
• Your order number: ${order.id}
• Valid ID (if purchasing age-restricted items)

We can't wait to see you at the farm!

View order details: ${trackingUrl}

Thank you for supporting Olympic Bluffs Cidery & Lavender Farm!
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #6b7566; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
      .status-badge { display: inline-block; background-color: #8b5cf6; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 20px 0; }
      .order-id { font-family: monospace; background-color: #e5e7eb; padding: 8px 12px; border-radius: 4px; display: inline-block; }
      .pickup-info { background-color: white; border-left: 4px solid #6b7566; padding: 20px; margin: 20px 0; }
      .footer { text-align: center; margin-top: 30px; color: #6b7566; font-size: 14px; }
      .button { display: inline-block; background-color: #6b7566; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Your Order is Ready! 🎉</h1>
      </div>
      <div class="content">
        <p>Hi ${order.customerInfo.firstName},</p>

        <p>Wonderful news! Your order is ready for pickup.</p>

        <p><strong>Order Number:</strong> <span class="order-id">${order.id}</span></p>

        <div class="status-badge">🎉 Ready for Pickup</div>

        <div class="pickup-info">
          <h3 style="margin-top: 0;">Pickup Location:</h3>
          <p style="margin: 10px 0;">
            <strong>Olympic Bluffs Cidery & Lavender Farm</strong><br>
            1025 Finn Hall Road, Port Angeles, WA 98362
          </p>

          <h3 style="margin-top: 20px;">Pickup Hours:</h3>
          <p style="margin: 10px 0;">
            Please call (571) 439-1311 for pickup hours
          </p>

          <p style="margin-top: 20px;"><strong>What to bring:</strong></p>
          <ul>
            <li>Your order number: <strong>${order.id}</strong></li>
            <li>Valid ID (if purchasing age-restricted items)</li>
          </ul>
        </div>

        <p>We can't wait to see you at the farm!</p>

        <p>
          <a href="${trackingUrl}" class="button">
            View Order Details
          </a>
        </p>

        <div class="footer">
          <p>Thank you for supporting Olympic Bluffs Cidery & Lavender Farm!</p>
          <p>Questions? Reply to this email or call us at (571) 439-1311.</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `.trim();

  return {
    to: order.customerInfo.email,
    subject: `Your Order is Ready for Pickup! - ${order.id}`,
    html,
    text,
  };
}

/**
 * Generate "Shipped" email
 */
function generateShippedEmail(order: Order, trackingNumber?: string): EmailTemplate {
  const trackingUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/orders/${order.id}`;

  const text = `
Hi ${order.customerInfo.firstName},

Your order is on its way!

Order Number: ${order.id}
Status: 🚚 Shipped

Shipping Address:
${order.shippingAddress?.fullName}
${order.shippingAddress?.addressLine1}
${order.shippingAddress?.addressLine2 || ''}
${order.shippingAddress?.city}, ${order.shippingAddress?.state} ${order.shippingAddress?.postalCode}

${trackingNumber ? `Tracking Number: ${trackingNumber}\n\nUse this tracking number to monitor your shipment's progress.\n` : ''}
Your order should arrive within 5-7 business days.

Track your order: ${trackingUrl}

Thank you for supporting Olympic Bluffs Cidery & Lavender Farm!
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #6b7566; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
      .status-badge { display: inline-block; background-color: #6366f1; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 20px 0; }
      .order-id { font-family: monospace; background-color: #e5e7eb; padding: 8px 12px; border-radius: 4px; display: inline-block; }
      .shipping-info { background-color: white; border-left: 4px solid #6b7566; padding: 20px; margin: 20px 0; }
      .tracking-number { font-family: monospace; font-size: 18px; font-weight: bold; color: #6b7566; background-color: #e8eae8; padding: 10px; border-radius: 4px; display: inline-block; margin: 10px 0; }
      .footer { text-align: center; margin-top: 30px; color: #6b7566; font-size: 14px; }
      .button { display: inline-block; background-color: #6b7566; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Your Order Has Shipped! 🚚</h1>
      </div>
      <div class="content">
        <p>Hi ${order.customerInfo.firstName},</p>

        <p>Your order is on its way!</p>

        <p><strong>Order Number:</strong> <span class="order-id">${order.id}</span></p>

        <div class="status-badge">🚚 Shipped</div>

        <div class="shipping-info">
          <h3 style="margin-top: 0;">Shipping Address:</h3>
          <p style="margin: 10px 0;">
            ${order.shippingAddress?.fullName}<br>
            ${order.shippingAddress?.addressLine1}<br>
            ${order.shippingAddress?.addressLine2 ? order.shippingAddress.addressLine2 + '<br>' : ''}
            ${order.shippingAddress?.city}, ${order.shippingAddress?.state} ${order.shippingAddress?.postalCode}
          </p>

          ${trackingNumber ? `
            <h3 style="margin-top: 20px;">Tracking Number:</h3>
            <div class="tracking-number">${trackingNumber}</div>
            <p style="margin: 10px 0; font-size: 14px; color: #666;">
              Use this tracking number to monitor your shipment's progress.
            </p>
          ` : ''}
        </div>

        <p>Your order should arrive within 5-7 business days.</p>

        <p>
          <a href="${trackingUrl}" class="button">
            Track Your Order
          </a>
        </p>

        <div class="footer">
          <p>Thank you for supporting Olympic Bluffs Cidery & Lavender Farm!</p>
          <p>Questions about your shipment? Reply to this email.</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `.trim();

  return {
    to: order.customerInfo.email,
    subject: `Your Order Has Shipped - ${order.id}`,
    html,
    text,
  };
}

/**
 * Generate "Completed" thank you email
 */
function generateCompletedEmail(order: Order): EmailTemplate {
  const trackingUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/orders/${order.id}`;

  const text = `
Hi ${order.customerInfo.firstName},

We hope you're enjoying your purchase from Olympic Bluffs!

Order Number: ${order.id}
Status: ✅ Completed

Your order has been marked as complete. We truly appreciate your support of our family farm.

We'd love to hear about your experience! If you have a moment, please consider:
• Sharing your experience on social media and tagging us
• Leaving a review on our website
• Telling your friends about us

Shop again: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/shop/lavender

Thank you for supporting Olympic Bluffs Cidery & Lavender Farm!
We hope to see you again soon.
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #6b7566; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
      .status-badge { display: inline-block; background-color: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 20px 0; }
      .order-id { font-family: monospace; background-color: #e5e7eb; padding: 8px 12px; border-radius: 4px; display: inline-block; }
      .footer { text-align: center; margin-top: 30px; color: #6b7566; font-size: 14px; }
      .button { display: inline-block; background-color: #6b7566; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Thank You! ✅</h1>
      </div>
      <div class="content">
        <p>Hi ${order.customerInfo.firstName},</p>

        <p>We hope you're enjoying your purchase from Olympic Bluffs!</p>

        <p><strong>Order Number:</strong> <span class="order-id">${order.id}</span></p>

        <div class="status-badge">✅ Completed</div>

        <p>Your order has been marked as complete. We truly appreciate your support of our family farm.</p>

        <p>We'd love to hear about your experience! If you have a moment, please consider:</p>
        <ul>
          <li>Sharing your experience on social media and tagging us</li>
          <li>Leaving a review on our website</li>
          <li>Telling your friends about us</li>
        </ul>

        <p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/shop/lavender" class="button">
            Shop Again
          </a>
        </p>

        <div class="footer">
          <p><strong>Thank you for supporting Olympic Bluffs Cidery & Lavender Farm!</strong></p>
          <p>We hope to see you again soon.</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `.trim();

  return {
    to: order.customerInfo.email,
    subject: `Thank You for Your Order - ${order.id}`,
    html,
    text,
  };
}

/**
 * Send "Processing" status email to customer
 */
export async function sendProcessingEmail(order: Order): Promise<boolean> {
  const email = generateProcessingEmail(order);
  return await sendEmail(email);
}

/**
 * Send "Ready for Pickup" email to customer
 */
export async function sendReadyForPickupEmail(order: Order): Promise<boolean> {
  const email = generateReadyForPickupEmail(order);
  return await sendEmail(email);
}

/**
 * Send "Shipped" email to customer
 */
export async function sendShippedEmail(order: Order, trackingNumber?: string): Promise<boolean> {
  const email = generateShippedEmail(order, trackingNumber);
  return await sendEmail(email);
}

/**
 * Send "Completed" thank you email to customer
 */
export async function sendCompletedEmail(order: Order): Promise<boolean> {
  const email = generateCompletedEmail(order);
  return await sendEmail(email);
}
