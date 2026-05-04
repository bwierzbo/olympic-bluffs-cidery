import nodemailer from 'nodemailer';
import { Order } from './types';

/**
 * Email notification helper using Gmail SMTP
 */

// Farm is in Port Angeles, WA — Pacific time year-round.
const FARM_TIME_ZONE = 'America/Los_Angeles';

// Map US state codes to IANA time zones. State-level granularity only —
// covers the ~99% case for direct-to-consumer shipping. Falls back to
// Pacific when state is missing or unrecognized (e.g. pickup orders).
const STATE_TIME_ZONES: Record<string, string> = {
  // Pacific
  WA: 'America/Los_Angeles', OR: 'America/Los_Angeles',
  CA: 'America/Los_Angeles', NV: 'America/Los_Angeles',
  // Mountain (MST/MDT)
  MT: 'America/Denver', WY: 'America/Denver', UT: 'America/Denver',
  CO: 'America/Denver', NM: 'America/Denver', ID: 'America/Denver',
  // Arizona — MST year-round, no DST
  AZ: 'America/Phoenix',
  // Central
  TX: 'America/Chicago', OK: 'America/Chicago', KS: 'America/Chicago',
  NE: 'America/Chicago', SD: 'America/Chicago', ND: 'America/Chicago',
  MN: 'America/Chicago', IA: 'America/Chicago', MO: 'America/Chicago',
  AR: 'America/Chicago', LA: 'America/Chicago', MS: 'America/Chicago',
  AL: 'America/Chicago', WI: 'America/Chicago', IL: 'America/Chicago',
  // Eastern
  NY: 'America/New_York', NJ: 'America/New_York', CT: 'America/New_York',
  RI: 'America/New_York', MA: 'America/New_York', NH: 'America/New_York',
  VT: 'America/New_York', ME: 'America/New_York', PA: 'America/New_York',
  MD: 'America/New_York', DC: 'America/New_York', DE: 'America/New_York',
  VA: 'America/New_York', WV: 'America/New_York', NC: 'America/New_York',
  SC: 'America/New_York', GA: 'America/New_York', FL: 'America/New_York',
  OH: 'America/New_York', MI: 'America/New_York', IN: 'America/New_York',
  KY: 'America/New_York', TN: 'America/New_York',
  // Outside the lower 48
  AK: 'America/Anchorage',
  HI: 'Pacific/Honolulu',
};

function getCustomerTimeZone(order: Order): string {
  const state = order.shippingAddress?.state?.toUpperCase();
  if (!state) return FARM_TIME_ZONE; // Pickup or missing → show farm-local
  return STATE_TIME_ZONES[state] ?? FARM_TIME_ZONE;
}

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
  const customerTz = getCustomerTimeZone(order);

  const text = `
Olympic Bluffs Cidery & Lavender Farm
Order Confirmation

Hi ${order.customerInfo.firstName},

Thank you for your order! We're so glad you chose Olympic Bluffs.

Order Number: ${order.id}
Order Date: ${new Date(order.createdAt).toLocaleDateString('en-US', { timeZone: customerTz })}

ITEMS:
${itemsList}

Subtotal: $${(order.subtotal / 100).toFixed(2)}
${order.shippingCost > 0 ? `Shipping: $${(order.shippingCost / 100).toFixed(2)}` : 'Shipping: FREE (Pickup)'}
${order.tax > 0 ? `Tax: $${(order.tax / 100).toFixed(2)}` : ''}
Total: $${(order.total / 100).toFixed(2)}

${order.fulfillmentMethod === 'pickup' ? 'Pickup at Olympic Bluffs Cidery & Lavender Farm\n1025 Finn Hall Road, Port Angeles, WA 98362' : `Shipping to:\n${order.shippingAddress?.fullName}\n${order.shippingAddress?.addressLine1}\n${order.shippingAddress?.city}, ${order.shippingAddress?.state} ${order.shippingAddress?.postalCode}`}

Track your order: ${trackingUrl}

Questions? Email us at info@olympicbluffs.com

Thank you for supporting our family farm!
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f3f1; font-family: Georgia, 'Times New Roman', serif; color: #3a3a3a;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">

    <!-- Header -->
    <div style="background-color: #6b7566; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
      <h1 style="margin: 0; font-size: 26px; color: #ffffff; font-weight: 400; letter-spacing: 1px;">OLYMPIC BLUFFS</h1>
      <p style="margin: 6px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.75); letter-spacing: 2px; text-transform: uppercase;">Cidery & Lavender Farm</p>
    </div>

    <!-- Main Content -->
    <div style="background-color: #ffffff; padding: 40px 35px;">

      <!-- Greeting -->
      <p style="font-size: 17px; margin: 0 0 5px 0; color: #6b7566; font-weight: 600;">Thank you, ${order.customerInfo.firstName}!</p>
      <p style="font-size: 15px; margin: 0 0 30px 0; color: #666; line-height: 1.6;">Your order has been confirmed. Here's a summary of what you ordered.</p>

      <!-- Order Number -->
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
        <tr>
          <td style="background-color: #f8f7f5; padding: 18px 20px; border-radius: 8px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td>
                  <span style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Order Number</span><br>
                  <span style="font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold; color: #3a3a3a;">${order.id}</span>
                </td>
                <td align="right">
                  <span style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Date</span><br>
                  <span style="font-size: 14px; color: #3a3a3a;">${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: customerTz })}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Divider -->
      <div style="border-top: 1px solid #e8e6e3; margin: 0 0 25px 0;"></div>

      <!-- Items -->
      <p style="font-size: 13px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0;">Items Ordered</p>
      ${order.items
        .map(
          (item, i) => `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: ${i < order.items.length - 1 ? '12' : '0'}px;">
          <tr>
            <td style="padding: 12px 0; ${i < order.items.length - 1 ? 'border-bottom: 1px solid #f0eeeb;' : ''}">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td>
                    <span style="font-size: 15px; font-weight: 600; color: #3a3a3a;">${item.name}</span>
                    ${item.variation ? `<br><span style="font-size: 13px; color: #888;">${item.variation.name}</span>` : ''}
                    <br><span style="font-size: 13px; color: #888;">Qty: ${item.quantity}</span>
                  </td>
                  <td align="right" valign="top" style="font-size: 15px; font-weight: 600; color: #3a3a3a;">$${((item.price * item.quantity) / 100).toFixed(2)}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `
        )
        .join('')}

      <!-- Totals -->
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 20px; border-top: 2px solid #e8e6e3; padding-top: 15px;">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #666;">Subtotal</td>
          <td align="right" style="padding: 8px 0; font-size: 14px; color: #3a3a3a;">$${(order.subtotal / 100).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #666;">Shipping</td>
          <td align="right" style="padding: 8px 0; font-size: 14px; ${order.shippingCost > 0 ? 'color: #3a3a3a;' : 'color: #6b7566; font-weight: 600;'}">${order.shippingCost > 0 ? `$${(order.shippingCost / 100).toFixed(2)}` : 'FREE'}</td>
        </tr>
        ${order.tax > 0 ? `
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #666;">Tax</td>
          <td align="right" style="padding: 8px 0; font-size: 14px; color: #3a3a3a;">$${(order.tax / 100).toFixed(2)}</td>
        </tr>
        ` : ''}
        <tr>
          <td colspan="2" style="padding-top: 12px; border-top: 2px solid #e8e6e3;"></td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-size: 18px; font-weight: bold; color: #3a3a3a;">Total</td>
          <td align="right" style="padding: 4px 0; font-size: 18px; font-weight: bold; color: #3a3a3a;">$${(order.total / 100).toFixed(2)}</td>
        </tr>
      </table>

      <!-- Divider -->
      <div style="border-top: 1px solid #e8e6e3; margin: 30px 0 25px 0;"></div>

      <!-- Fulfillment -->
      <p style="font-size: 13px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">${order.fulfillmentMethod === 'pickup' ? 'Pickup Details' : 'Shipping To'}</p>
      <div style="background-color: #f8f7f5; padding: 20px; border-radius: 8px; border-left: 3px solid #6b7566;">
        ${
          order.fulfillmentMethod === 'pickup'
            ? `
          <p style="margin: 0 0 4px 0; font-weight: 600; font-size: 15px;">Olympic Bluffs Cidery & Lavender Farm</p>
          <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">1025 Finn Hall Road<br>Port Angeles, WA 98362</p>
          <p style="margin: 12px 0 0 0; font-size: 13px; color: #888; font-style: italic;">We'll notify you when your order is ready for pickup.</p>
        `
            : `
          <p style="margin: 0 0 4px 0; font-weight: 600; font-size: 15px;">${order.shippingAddress?.fullName}</p>
          <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">
            ${order.shippingAddress?.addressLine1}<br>
            ${order.shippingAddress?.addressLine2 ? `${order.shippingAddress.addressLine2}<br>` : ''}
            ${order.shippingAddress?.city}, ${order.shippingAddress?.state} ${order.shippingAddress?.postalCode}
          </p>
          <p style="margin: 12px 0 0 0; font-size: 13px; color: #888; font-style: italic;">You'll receive tracking information once your order ships.</p>
        `
        }
      </div>

      <!-- Track Order Button -->
      <div style="text-align: center; margin: 35px 0 10px 0;">
        <a href="${trackingUrl}" style="display: inline-block; background-color: #6b7566; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; letter-spacing: 0.5px;">Track Your Order</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8f7f5; padding: 25px 35px; border-radius: 0 0 12px 12px; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #888;">Questions about your order?</p>
      <a href="mailto:info@olympicbluffs.com" style="font-size: 14px; color: #6b7566; text-decoration: none; font-weight: 600;">info@olympicbluffs.com</a>
      <div style="border-top: 1px solid #e8e6e3; margin: 20px 0 15px 0;"></div>
      <p style="margin: 0; font-size: 12px; color: #aaa;">Olympic Bluffs Cidery & Lavender Farm</p>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #aaa;">1025 Finn Hall Road, Port Angeles, WA 98362</p>
    </div>

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
  timeStyle: 'short',
  timeZone: FARM_TIME_ZONE,
  timeZoneName: 'short',
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
      <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">${new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short', timeZone: FARM_TIME_ZONE, timeZoneName: 'short' })}</p>
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
          <p>Questions? Email us at <a href="mailto:info@olympicbluffs.com" style="color: #6b7566;">info@olympicbluffs.com</a></p>
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
          <p>Questions? Email us at <a href="mailto:info@olympicbluffs.com" style="color: #6b7566;">info@olympicbluffs.com</a></p>
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
          <p>Questions? Email us at <a href="mailto:info@olympicbluffs.com" style="color: #6b7566;">info@olympicbluffs.com</a></p>
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
