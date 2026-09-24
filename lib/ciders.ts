/**
 * Ciders come from VinoShipper, which is the single source of truth for what
 * is sold: name, description, cidermaker's note, ABV, price, image,
 * inventory, awards and ship-to restrictions are all read from its public
 * product feed. The owners edit those in their VinoShipper account.
 *
 * The only things kept locally (data/ciders.json) are presentation choices
 * the feed has no field for: a swatch color, an optional higher-resolution
 * transparent bottle render, and which cider is featured on the homepage. A
 * cider added in VinoShipper shows up on the site automatically.
 */
import overridesData from '@/data/ciders.json';

export const VINOSHIPPER_PRODUCER_ID = 5980;
const FEED_URL = `https://vinoshipper.com/api/v3/feeds/vs/${VINOSHIPPER_PRODUCER_ID}/products`;
const REVALIDATE_SECONDS = 600;

export interface Cider {
  slug: string;
  vinoshipperId: number;
  name: string;
  /** Short description from VinoShipper; null until the owners write one. */
  description: string | null;
  /** Tasting notes: VinoShipper's "winemaker note", comma-separated ("Earthy, Berry-forward"). */
  tastingNotes: string[];
  abv: string | null; // "6.9%"
  volume: string; // "750mL"
  price: number; // cents
  image: string;
  inventory: number;
  soldOut: boolean;
  almostSoldOut: boolean;
  awards: string[]; // "Silver, Northwest Cider Cup"
  varietal: string | null; // "Apple", "Pear"
  vintage: string | null; // null when "NV"
  /** VinoShipper's own product page */
  url: string;
  /** State codes the cider cannot ship to */
  notAvailableIn: string[];
  /** Multipack (six-pack, mixed case). Shown in its own band above the list. */
  isPack: boolean;
  /** What a pack contains, when VinoShipper lists it. */
  packContents: Array<{ name: string; qty: number }>;
  /** Bottles per pack (1 for a single bottle) */
  bottlesPerUnit: number;
  /** "6-bottle pack" for packs, null for singles */
  unitDescription: string | null;
  // presentation (local)
  swatch: string;
  featured: boolean;
}

interface Override {
  swatch?: string;
  image?: string;
  featured?: boolean;
}

interface OverridesFile {
  defaults: { swatch: string };
  overrides: Record<string, Override>;
}

// --- Feed types (only the fields we read) ---------------------------------

interface FeedProduct {
  id: number;
  name: string;
  displayName?: string | null;
  desc?: string | null;
  url?: string | null;
  img?: string | null;
  inventory?: number | null;
  soldOutWarning?: number | null;
  price?: number | null;
  status?: string | null;
  notAvailableIn?: string[] | null;
  awards?: Array<{ name?: string | null; score?: string | null }> | null;
  alcoholMeta?: {
    vintage?: string | null;
    abv?: number | null;
    varietal?: string | null;
    winemakerNote?: string | null;
  } | null;
  container?: { volumeDisplay?: string | null; countPerSoldUnit?: number | null; unitDescription?: string | null } | null;
  unitDescription?: string | null;
  pack?: boolean | null;
  productGroupMeta?: Record<string, unknown> | null;
  /** Shape not yet confirmed against a real pack; parsed defensively in packContentsOf(). */
  productGroupContents?: Array<Record<string, unknown>> | null;
}

export interface CiderCatalog {
  /** Single bottles */
  ciders: Cider[];
  /** Multipacks, featured above the list */
  packs: Cider[];
  /** State codes VinoShipper can ship this producer's products to */
  shipsTo: string[];
}

interface FeedResponse {
  products?: FeedProduct[];
  states?: Array<{ abbr?: string; name?: string }>;
}

// --------------------------------------------------------------------------

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function clean(s: string | null | undefined): string | null {
  const t = (s ?? '').trim();
  return t.length > 0 ? t : null;
}

/**
 * Contents of a multipack. VinoShipper's productGroupContents shape has not
 * been confirmed against a live pack yet, so this accepts the likely
 * spellings (name/product.name/displayName, qty/quantity/count) and falls
 * back to looking the product up by id in the same feed.
 */
function packContentsOf(p: FeedProduct, byId: Map<number, string>): Array<{ name: string; qty: number }> {
  const rows = p.productGroupContents ?? [];
  const out: Array<{ name: string; qty: number }> = [];
  for (const row of rows) {
    const r = row as Record<string, unknown>;
    const product = (r.product ?? r.item) as Record<string, unknown> | undefined;
    const idRaw = r.productId ?? r.id ?? product?.id;
    const id = typeof idRaw === 'number' ? idRaw : typeof idRaw === 'string' ? Number(idRaw) : NaN;
    const name =
      clean(r.name as string) ??
      clean(r.displayName as string) ??
      clean(product?.name as string) ??
      clean(product?.displayName as string) ??
      (Number.isFinite(id) ? byId.get(id) ?? null : null);
    const qtyRaw = r.qty ?? r.quantity ?? r.count ?? 1;
    const qty = typeof qtyRaw === 'number' ? qtyRaw : Number(qtyRaw) || 1;
    if (name) out.push({ name, qty });
  }
  return out;
}

function toCider(p: FeedProduct, file: OverridesFile, taken: Set<string>, byId: Map<number, string>): Cider {
  const o = file.overrides[String(p.id)] ?? {};
  const name = clean(p.displayName) ?? clean(p.name) ?? `Cider ${p.id}`;
  let slug = slugify(name) || String(p.id);
  if (taken.has(slug)) slug = `${slug}-${p.id}`;
  taken.add(slug);

  const inventory = p.inventory ?? 0;
  const warnAt = p.soldOutWarning ?? 0;
  const isPack = Boolean(p.pack) || (p.productGroupContents?.length ?? 0) > 0;
  const bottlesPerUnit = Math.max(1, p.container?.countPerSoldUnit ?? 1);
  const abv = p.alcoholMeta?.abv;
  const vintage = clean(p.alcoholMeta?.vintage);

  return {
    slug,
    vinoshipperId: p.id,
    name,
    description: clean(p.desc),
    tastingNotes: (clean(p.alcoholMeta?.winemakerNote) ?? '')
      .split(/[,;\n]+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0),
    abv: typeof abv === 'number' ? `${abv}%` : null,
    volume: clean(p.container?.volumeDisplay) ?? (isPack ? `${bottlesPerUnit} bottles` : clean(p.unitDescription) ?? '750mL'),
    price: Math.round((p.price ?? 0) * 100),
    image: o.image ?? p.img ?? '/images/products/placeholder-cider.svg',
    inventory,
    soldOut: inventory <= 0,
    almostSoldOut: inventory > 0 && warnAt > 0 && inventory <= warnAt,
    awards: (p.awards ?? [])
      .map((a) => [clean(a.score), clean(a.name)].filter(Boolean).join(', '))
      .filter((a) => a.length > 0),
    varietal: clean(p.alcoholMeta?.varietal),
    vintage: vintage && vintage.toUpperCase() !== 'NV' ? vintage : null,
    url: p.url ?? `https://vinoshipper.com/shop/olympic_bluffs_cidery`,
    notAvailableIn: p.notAvailableIn ?? [],
    isPack,
    packContents: packContentsOf(p, byId),
    bottlesPerUnit,
    unitDescription: isPack ? `${bottlesPerUnit}-bottle pack` : null,
    swatch: o.swatch ?? file.defaults.swatch,
    featured: o.featured ?? false,
  };
}


/**
 * The live catalog. Cached by Next's fetch cache and refreshed every ten
 * minutes. Throws when VinoShipper cannot be reached; callers decide how to
 * degrade (the cider page shows a note, the homepage hides the band).
 */
export async function getCiderCatalog(): Promise<CiderCatalog> {
  const res = await fetch(FEED_URL, {
    headers: { Accept: 'application/json' },
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`VinoShipper feed responded ${res.status}`);
  const data = (await res.json()) as FeedResponse;
  const file = overridesData as unknown as OverridesFile;
  const taken = new Set<string>();
  const live = (data.products ?? []).filter((p) => (p.status ?? 'LIVE').toUpperCase() === 'LIVE');
  const byId = new Map(live.map((p) => [p.id, clean(p.displayName) ?? clean(p.name) ?? String(p.id)]));

  const all = live.map((p) => toCider(p, file, taken, byId));

  // Featured first, then the feed's own order.
  all.sort((a, b) => Number(b.featured) - Number(a.featured));

  const shipsTo = (data.states ?? []).map((st) => st.abbr).filter((c): c is string => Boolean(c));
  return {
    ciders: all.filter((c) => !c.isPack),
    packs: all.filter((c) => c.isPack),
    shipsTo,
  };
}

/** Single bottles and packs together (detail pages, lookups). */
export async function getAllProducts(): Promise<Cider[]> {
  const { ciders, packs } = await getCiderCatalog();
  return [...packs, ...ciders];
}

/** Single bottles only (the filtered list). */
export async function getCiders(): Promise<Cider[]> {
  return (await getCiderCatalog()).ciders;
}

export async function getPacks(): Promise<Cider[]> {
  return (await getCiderCatalog()).packs;
}

export async function getCider(slug: string): Promise<Cider | undefined> {
  return (await getAllProducts()).find((c) => c.slug === slug);
}

export async function getFeaturedCider(): Promise<Cider | undefined> {
  const ciders = await getCiders();
  return ciders.find((c) => c.featured) ?? ciders[0];
}

/** True for our local transparent bottle renders (`trans-*.png`). */
export function isCutout(image: string): boolean {
  return /\/trans-[^/]+\.png$/i.test(image);
}

export function formatPrice(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
}
