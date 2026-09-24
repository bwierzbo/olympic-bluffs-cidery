import Link from 'next/link';
import Image from 'next/image';
import { getSiteConfig } from '@/lib/site-config';
import NewsletterForm from './NewsletterForm';

export default function SiteFooter() {
  const { contact } = getSiteConfig();
  const year = new Date().getFullYear();

  const col = 'flex flex-col gap-2 text-[13.5px]';
  const head = 'mb-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/55';
  const link = 'opacity-90 hover:opacity-100 hover:underline underline-offset-4';

  return (
    <footer className="bg-ink text-white">
      <div className="container-x grid grid-cols-2 gap-x-6 gap-y-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-3">
            <Image src="/images/logo-square.png" alt="" width={44} height={44} className="h-11 w-11 rounded-full bg-white/10" />
            <div className="leading-tight">
              <div className="font-serif text-xl">Olympic Bluffs</div>
              <div className="text-[9.5px] font-semibold uppercase tracking-[0.2em] opacity-75">
                Cidery &amp; Lavender Farm
              </div>
            </div>
          </div>
          <address className="mt-5 text-[13.5px] not-italic leading-relaxed opacity-90">
            {contact.address1}
            <br />
            {contact.city}, {contact.state} {contact.zip}
            <br />
            <a href={`tel:${contact.phone.replace(/\D/g, '')}`} className={link}>
              {contact.phone}
            </a>
            <br />
            <a href={`mailto:${contact.email}`} className={link}>
              {contact.email}
            </a>
          </address>
          <div className="mt-6">
            <div className={head}>Release days, bloom updates, festival news</div>
            <NewsletterForm />
          </div>
        </div>

        <div className={col}>
          <div className={head}>Visit</div>
          <Link href="/visit" className={link}>Hours &amp; directions</Link>
          <Link href="/farm" className={link}>The farm</Link>
          <Link href="/events" className={link}>Events &amp; classes</Link>
          <Link href="/events/lavender-festival" className={link}>Lavender Festival</Link>
          <Link href="/stay" className={link}>Stay at Salt &amp; Cedar</Link>
        </div>

        <div className={col}>
          <div className={head}>Shop</div>
          <Link href="/cider" className={link}>Cider</Link>
          <Link href="/lavender" className={link}>Lavender</Link>
          <Link href="/policies/shipping" className={link}>Shipping</Link>
          <Link href="/policies/returns" className={link}>Returns</Link>
        </div>

        <div className={col}>
          <div className={head}>Follow</div>
          <a href={contact.instagram} target="_blank" rel="noopener noreferrer" className={link}>Instagram</a>
          <a href={contact.facebook} target="_blank" rel="noopener noreferrer" className={link}>Facebook</a>
          <div className={`${head} mt-4`}>About</div>
          <Link href="/about" className={link}>Scott &amp; Ginger</Link>
          <Link href="/makers" className={link}>Makers</Link>
          <Link href="/visit#contact" className={link}>Contact</Link>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="container-x flex flex-wrap items-center justify-between gap-2 py-4 text-[11.5px] opacity-60">
          <span>© {year} Olympic Bluffs Cidery &amp; Lavender Farm</span>
          <span className="flex flex-wrap gap-x-3">
            <Link href="/policies/privacy" className="hover:underline">Privacy</Link>
            <Link href="/policies/terms" className="hover:underline">Terms</Link>
            <span>Cider ships via VinoShipper to select states · 21+</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
