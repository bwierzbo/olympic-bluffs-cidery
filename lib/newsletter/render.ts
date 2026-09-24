import { Marked } from 'marked';
import { SITE_URL } from '@/lib/site-url';
import { getSiteConfig } from '@/lib/site-config';

/**
 * Turns a newsletter (subject, preview line, Markdown body) into email-safe
 * HTML and a plain-text alternative. Styles are inlined because many mail
 * clients ignore <style> blocks. Raw HTML in the Markdown is escaped, not
 * rendered, so a draft can never inject markup.
 */

const C = {
  ground: '#f5f4ef',
  paper: '#ffffff',
  ink: '#1f2a22',
  ink2: '#55605a',
  ink3: '#8a9189',
  line: '#e3e2da',
  sage: '#5e6b5a',
  amber: '#b7752c',
};
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function absolute(url: string): string {
  if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
  if (url.startsWith('/')) return `${SITE_URL}${url}`;
  return url;
}

const marked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    // Never pass raw HTML through.
    html({ text }) {
      return escapeHtml(text);
    },
  },
});

const STYLES: Array<[RegExp, string]> = [
  [/<h1>/g, `<h1 style="margin:28px 0 12px;font-family:${SERIF};font-weight:400;font-size:30px;line-height:1.15;color:${C.ink};">`],
  [/<h2>/g, `<h2 style="margin:28px 0 10px;font-family:${SERIF};font-weight:400;font-size:24px;line-height:1.2;color:${C.ink};">`],
  [/<h3>/g, `<h3 style="margin:22px 0 8px;font-family:${SERIF};font-weight:400;font-size:19px;line-height:1.25;color:${C.ink};">`],
  [/<p>/g, `<p style="margin:0 0 16px;font-family:${SANS};font-size:16px;line-height:1.6;color:${C.ink};">`],
  [/<ul>/g, `<ul style="margin:0 0 16px;padding-left:22px;font-family:${SANS};font-size:16px;line-height:1.6;color:${C.ink};">`],
  [/<ol>/g, `<ol style="margin:0 0 16px;padding-left:22px;font-family:${SANS};font-size:16px;line-height:1.6;color:${C.ink};">`],
  [/<li>/g, `<li style="margin:0 0 6px;">`],
  [/<blockquote>/g, `<blockquote style="margin:0 0 16px;padding:4px 0 4px 16px;border-left:3px solid ${C.amber};color:${C.ink2};font-family:${SERIF};font-style:italic;font-size:18px;">`],
  [/<hr>/g, `<hr style="border:0;border-top:1px solid ${C.line};margin:28px 0;">`],
  [/<strong>/g, `<strong style="font-weight:600;">`],
];

export function markdownToEmailHtml(markdown: string): string {
  let html = marked.parse(markdown || '', { async: false }) as string;
  for (const [re, rep] of STYLES) html = html.replace(re, rep);
  html = html.replace(/<a href="([^"]*)"/g, (_m, href: string) => `<a href="${absolute(href)}" style="color:${C.sage};text-decoration:underline;"`);
  html = html.replace(
    /<img src="([^"]*)"/g,
    (_m, src: string) => `<img src="${absolute(src)}" width="536" style="display:block;width:100%;max-width:536px;height:auto;border:0;margin:8px 0 16px;"`
  );
  return html;
}

export function markdownToText(markdown: string): string {
  return (markdown || '')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, t: string, u: string) => `${t} (${absolute(u)})`)
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|\W)\*([^*]+)\*(?=\W|$)/g, '$1$2')
    .replace(/^>\s?/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export interface RenderInput {
  subject: string;
  previewText: string;
  body: string;
  /** Recipient's unsubscribe page. Omit for previews. */
  unsubscribeUrl?: string;
}

export function renderNewsletter({ subject, previewText, body, unsubscribeUrl }: RenderInput): { html: string; text: string } {
  const { contact } = getSiteConfig();
  const address = `${contact.address1}, ${contact.city}, ${contact.state} ${contact.zip}`;
  const unsub = unsubscribeUrl ?? `${SITE_URL}/newsletter/unsubscribe`;
  const content = markdownToEmailHtml(body);
  // Pad the preview line so clients don't pull body text into the inbox preview.
  const pad = '&#847;&zwnj;&nbsp;'.repeat(60);

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${C.ground};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(previewText)}${pad}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ground};">
  <tr><td align="center" style="padding:28px 12px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
      <tr><td style="padding:0 32px 18px;">
        <a href="${SITE_URL}" style="text-decoration:none;color:${C.ink};">
          <span style="font-family:${SERIF};font-size:24px;color:${C.ink};">Olympic Bluffs</span><br>
          <span style="font-family:${SANS};font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${C.ink2};">Cidery &amp; Lavender Farm</span>
        </a>
      </td></tr>
      <tr><td style="background:${C.paper};padding:32px 32px 16px;border:1px solid ${C.line};">
        ${content}
      </td></tr>
      <tr><td style="padding:22px 32px;font-family:${SANS};font-size:12px;line-height:1.6;color:${C.ink3};">
        Olympic Bluffs Cidery &amp; Lavender Farm · ${escapeHtml(address)}<br>
        You’re getting this because you signed up at <a href="${SITE_URL}" style="color:${C.ink3};">olympicbluffs.com</a>.
        <a href="${unsub}" style="color:${C.ink3};">Unsubscribe</a>.
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = `${markdownToText(body)}

--
Olympic Bluffs Cidery & Lavender Farm
${address}
${SITE_URL}

Unsubscribe: ${unsub}`;

  return { html, text };
}

export function unsubscribePageUrl(token: string): string {
  return `${SITE_URL}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

/** RFC 8058 one-click endpoint (POST). */
export function unsubscribeOneClickUrl(token: string): string {
  return `${SITE_URL}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

/**
 * Transactional email (event confirmations, reminders, refunds): same look as
 * the newsletter but no unsubscribe footer, since these are replies to
 * something the person did.
 */
export function renderTransactionalEmail({
  title,
  previewText,
  body,
}: {
  title: string;
  previewText: string;
  body: string;
}): { html: string; text: string } {
  const { contact } = getSiteConfig();
  const address = `${contact.address1}, ${contact.city}, ${contact.state} ${contact.zip}`;
  const content = markdownToEmailHtml(body);
  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${C.ground};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(previewText)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ground};">
  <tr><td align="center" style="padding:28px 12px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
      <tr><td style="padding:0 32px 18px;">
        <a href="${SITE_URL}" style="text-decoration:none;color:${C.ink};">
          <span style="font-family:${SERIF};font-size:24px;color:${C.ink};">Olympic Bluffs</span><br>
          <span style="font-family:${SANS};font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${C.ink2};">Cidery &amp; Lavender Farm</span>
        </a>
      </td></tr>
      <tr><td style="background:${C.paper};padding:32px 32px 16px;border:1px solid ${C.line};">${content}</td></tr>
      <tr><td style="padding:22px 32px;font-family:${SANS};font-size:12px;line-height:1.6;color:${C.ink3};">
        Olympic Bluffs Cidery &amp; Lavender Farm · ${escapeHtml(address)} · ${escapeHtml(contact.phone)}<br>
        Questions? Reply to this email.
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
  const text = `${markdownToText(body)}

--
Olympic Bluffs Cidery & Lavender Farm
${address} · ${contact.phone}
${SITE_URL}`;
  return { html, text };
}
