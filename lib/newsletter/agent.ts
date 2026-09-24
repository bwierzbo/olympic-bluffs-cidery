import { ToolLoopAgent, Output, tool } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { SITE_URL } from '@/lib/site-url';
import { getSiteConfig } from '@/lib/site-config';
import { getCiderCatalog, formatPrice, type Cider } from '@/lib/ciders';
import { getLavenderProducts } from '@/lib/lavender-products';
import { eventLink, formatEventDateRange } from '@/lib/content';
import { getAllUpcomingEvents } from '@/lib/events/listing';
import { getHoursConfig, getWeekSummary, getTodayHours } from '@/lib/hours';
import { NEWSLETTER_AI_FALLBACK_MODEL, NEWSLETTER_AI_MODEL } from './config';
import type { DraftRequest, DraftResult } from './types';

/**
 * Newsletter drafting agent. It looks up live facts (ciders and packs from
 * VinoShipper, lavender products from Square, events, hours, past issues)
 * with tools, then returns a subject, preview line and Markdown body in the
 * owners' voice. It never sends anything; a person reviews and sends.
 */

const INSTRUCTIONS = `You write the email newsletter for Olympic Bluffs Cidery & Lavender Farm, a 21-acre farm on the bluffs outside Port Angeles, Washington, run by Scott and Ginger.

Voice
- First person plural, as Scott and Ginger ("we"). Warm, plain, specific. Short paragraphs.
- Specifics over adjectives: name the cider, the date, the hours, the price. No "artisanal", "curated", "elevate", "nestled", "delve", "journey".
- Sentence case for headings and the subject, but keep proper names exactly as the tools spell them (The Dry Side, Yoga + Cider, Soundwave, Salt & Cedar). No emoji. No exclamation marks except at most one.

Facts
- Use the tools to look up anything factual: ciders, packs, prices, what is sold out, events and dates, hours, lavender products. Call the relevant tools before writing.
- Never invent a price, date, time, event, product, award or tasting note. If the brief mentions something you cannot confirm with a tool, write around it and add a note asking the owners to check it.
- Do not mention sold-out products as available.
- Link to pages on the site with absolute URLs exactly as the tools return them. Never make up URLs.

Format
- subject: under 60 characters, specific, no clickbait, no emoji.
- previewText: one sentence, under 110 characters, that complements (not repeats) the subject.
- body: Markdown only. Use a short opening paragraph, then "## " section headings if there is more than one topic, "- " bullets for lists, **bold** sparingly, [link text](url) links. You may include at most two images using image URLs returned by the tools: ![alt text](url). No HTML. Do not add a greeting line like "Hi friends" unless the brief asks; do not add a sign-off footer, address or unsubscribe text (the template adds those). End with a one-line sign-off: "— Scott & Ginger".
- Headings: sentence case with a capital first letter ("## Yoga and cider in October"), never all lowercase.
- Write in sentences. Use bullets only for genuine lists of several items, never for "label: value" facts like price or availability.
- Every link is a Markdown link with descriptive text ([Plan your visit](https://…)); never paste a bare URL.
- Aim for 120–300 words unless the brief asks otherwise.
- notes: short checklist items for the owners: anything you could not verify, assumptions you made, or placeholders. Only mention what is actually in the draft. Empty list if none.`;

function ciderFacts(c: Cider) {
  return {
    name: c.name,
    kind: c.isPack ? `${c.unitDescription ?? 'pack'}` : 'single bottle',
    url: `${SITE_URL}/cider/${c.slug}`,
    price: formatPrice(c.price),
    abv: c.abv,
    description: c.description,
    tastingNotes: c.tastingNotes,
    awards: c.awards,
    availability: c.soldOut ? 'sold out' : c.almostSoldOut ? 'almost sold out' : 'in stock',
    image: c.image.startsWith('http') ? c.image : `${SITE_URL}${c.image}`,
    featuredOnHomepage: c.featured,
  };
}

const tools = {
  getCiders: tool({
    description:
      'Current ciders and multipacks for sale online (from VinoShipper): name, price, ABV, description, tasting notes, awards, availability, page URL and bottle image URL.',
    inputSchema: z.object({}),
    execute: async () => {
      const { ciders, packs, shipsTo } = await getCiderCatalog();
      return {
        packs: packs.map(ciderFacts),
        ciders: ciders.map(ciderFacts),
        shipsToStates: shipsTo,
        shopUrl: `${SITE_URL}/cider`,
      };
    },
  }),
  getLavenderProducts: tool({
    description: 'Lavender shop products for sale online (from Square): name, price, category, description, page URL, image URL.',
    inputSchema: z.object({}),
    execute: async () => {
      const products = await getLavenderProducts();
      return {
        shopUrl: `${SITE_URL}/lavender`,
        products: products.map((p) => ({
          name: p.name,
          price: formatPrice(p.price),
          category: p.category ?? null,
          description: (p.description || '').slice(0, 300),
          inStock: p.inStock,
          url: `${SITE_URL}/products/${p.id}`,
          image: p.image && p.image.startsWith('http') ? p.image : null,
        })),
      };
    },
  }),
  getEvents: tool({
    description: 'Upcoming events at the farm: title, dates, times, location, price, summary and the link for details or tickets.',
    inputSchema: z.object({}),
    execute: async () => ({
      eventsUrl: `${SITE_URL}/events`,
      events: (await getAllUpcomingEvents()).map((e) => {
        const link = eventLink(e);
        return {
          title: e.title,
          dates: formatEventDateRange(e),
          time: e.timeLabel,
          location: e.location,
          price: e.price != null ? `${formatPrice(e.price)} per person` : null,
          summary: e.summary,
          link: link.external ? link.href : `${SITE_URL}${link.href}`,
          ticketsSoldElsewhere: e.registration === 'external',
          registerOnOurSite: e.registration === 'internal',
          seatsLeft: e.seatsLeft ?? null,
          soldOut: e.soldOut ?? false,
        };
      }),
    }),
  }),
  getFarmHoursAndContact: tool({
    description: 'Farm and tasting room hours, season dates, whether the farm is open today, and address/phone/email.',
    inputSchema: z.object({}),
    execute: async () => {
      const { contact, seasonal } = getSiteConfig();
      const hours = getHoursConfig();
      const today = getTodayHours();
      return {
        weeklyHours: getWeekSummary(),
        seasonStart: hours.seasonStart ?? null,
        seasonEnd: hours.seasonEnd ?? null,
        inSeasonNow: today.inSeason,
        note: hours.note ?? null,
        currentBanner: seasonal.banner.visible ? seasonal.banner.message : null,
        address: `${contact.address1}, ${contact.city}, ${contact.state} ${contact.zip}`,
        phone: contact.phone,
        email: contact.email,
        visitUrl: `${SITE_URL}/visit`,
      };
    },
  }),
  getFarmStory: tool({
    description: 'Background facts about the farm and its owners, for context and color.',
    inputSchema: z.object({}),
    execute: async () => ({
      owners: 'Scott and Ginger, both US Air Force veterans',
      history: 'First visited the Olympic Peninsula during the 2015 lavender festival; moved here full time in 2020.',
      farm: '21 acres on the high bluffs east of Port Angeles, with views of the Strait of Juan de Fuca and the Olympic Mountains.',
      planted: '480 semi-dwarf cider apple trees, about 3,400 lavender plants, an apiary of Italian honeybees, and an acre of ancient grains (wheat and rye) grown with the WSU Breadlab.',
      lavenderBloom: 'Lavender blooms mid-June through August; the Lavender Festival is in July.',
      stay: `Salt & Cedar Bed and Breakfast opened November 2024 next to the farm (${SITE_URL}/stay).`,
      cidery: 'Ciders are pressed, fermented and bottled on site; the tasting room is in the cidery building.',
    }),
  }),
  getPastNewsletters: tool({
    description: 'The most recent sent newsletters (subject and body), to match voice and avoid repeating the same news.',
    inputSchema: z.object({}),
    execute: async () => {
      const past = await prisma.newsletterCampaign.findMany({
        where: { status: 'sent' },
        orderBy: { sentAt: 'desc' },
        take: 3,
        select: { subject: true, body: true, sentAt: true },
      });
      return past.map((p) => ({ subject: p.subject, sentAt: p.sentAt?.toISOString() ?? null, body: p.body.slice(0, 3000) }));
    },
  }),
};

const draftSchema = z.object({
  subject: z.string().describe('Email subject, under 60 characters'),
  previewText: z.string().describe('Inbox preview line, under 110 characters'),
  body: z.string().describe('Markdown body'),
  notes: z.array(z.string()).describe('Things the owners should check before sending'),
});

function makeAgent(model: string) {
  return new ToolLoopAgent({
    model,
    instructions: INSTRUCTIONS,
    tools,
    output: Output.object({ schema: draftSchema }),
  });
}

const agents = new Map<string, ReturnType<typeof makeAgent>>();
function agentFor(model: string) {
  let agent = agents.get(model);
  if (!agent) {
    agent = makeAgent(model);
    agents.set(model, agent);
  }
  return agent;
}

/** The primary model was refused for account reasons (plan, credits, access), not because of the prompt. */
function isAccessError(error: unknown): boolean {
  const e = error as { statusCode?: number; message?: string };
  const msg = (e?.message ?? '').toLowerCase();
  return e?.statusCode === 403 || e?.statusCode === 402 || msg.includes('free tier') || msg.includes('credits');
}

export async function draftNewsletter(req: DraftRequest): Promise<DraftResult> {
  const today = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const parts = [`Today is ${today}.`, `Brief from the owners:\n${req.brief.trim()}`];
  if (req.current && (req.current.subject || req.current.body)) {
    parts.push(
      `Current draft:\nSubject: ${req.current.subject}\nPreview: ${req.current.previewText}\n\n${req.current.body}`,
      `Revise the current draft. ${req.instruction?.trim() || 'Improve it while keeping what works.'} Keep facts that are still accurate; re-check anything you change with the tools.`
    );
  }

  const prompt = parts.join('\n\n');
  let usedFallback = false;
  let result;
  try {
    result = await agentFor(NEWSLETTER_AI_MODEL).generate({ prompt });
  } catch (error) {
    if (!isAccessError(error) || NEWSLETTER_AI_FALLBACK_MODEL === NEWSLETTER_AI_MODEL) throw error;
    console.warn(`Newsletter draft: ${NEWSLETTER_AI_MODEL} unavailable, using ${NEWSLETTER_AI_FALLBACK_MODEL}`);
    result = await agentFor(NEWSLETTER_AI_FALLBACK_MODEL).generate({ prompt });
    usedFallback = true;
  }
  const usage = result.totalUsage;
  console.info(
    `Newsletter draft usage: model=${usedFallback ? NEWSLETTER_AI_FALLBACK_MODEL : NEWSLETTER_AI_MODEL} steps=${result.steps.length} ` +
      `input=${usage.inputTokens ?? '?'} cachedInput=${usage.inputTokenDetails?.cacheReadTokens ?? 0} ` +
      `output=${usage.outputTokens ?? '?'} reasoning=${usage.outputTokenDetails?.reasoningTokens ?? 0}`
  );
  const output = result.output;
  const notes = output.notes.map((n) => n.trim()).filter(Boolean);
  if (usedFallback) {
    notes.push('Drafted with the backup AI model because the main one isn’t enabled on the AI Gateway account.');
  }
  return {
    subject: output.subject.trim(),
    previewText: output.previewText.trim(),
    body: output.body.trim(),
    notes,
  };
}
