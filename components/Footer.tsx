import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-sage-600 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Social Media Icons */}
        <div className="flex justify-center gap-6 mb-8">
          <a
            href="https://www.instagram.com/olympicbluffscideryandlavender/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-sage-100 transition-colors"
            aria-label="Instagram"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
          <a
            href="https://www.facebook.com/olympicbluffscidery"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-sage-100 transition-colors"
            aria-label="Facebook"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/images/logo-square.png"
            alt="Olympic Bluffs Cidery & Lavender Farm"
            width={80}
            height={80}
            className="h-20 w-20"
          />
        </div>

        {/* Navigation Links */}
        <nav className="flex justify-center gap-8 mb-4">
          <Link href="/" className="text-white hover:text-sage-100 transition-colors text-sm font-medium">
            Home
          </Link>
          <Link href="/shop/lavender" className="text-white hover:text-sage-100 transition-colors text-sm font-medium">
            Shop Lavender
          </Link>
          <Link href="/shop/cidery" className="text-white hover:text-sage-100 transition-colors text-sm font-medium">
            Shop Cider
          </Link>
          <Link href="/about" className="text-white hover:text-sage-100 transition-colors text-sm font-medium">
            More
          </Link>
        </nav>

        {/* Policy Links */}
        <nav className="flex justify-center flex-wrap gap-x-4 gap-y-2 mb-6">
          <Link href="/policies/shipping" className="text-sage-200 hover:text-white transition-colors text-xs">
            Shipping
          </Link>
          <span className="text-sage-300">|</span>
          <Link href="/policies/returns" className="text-sage-200 hover:text-white transition-colors text-xs">
            Returns
          </Link>
          <span className="text-sage-300">|</span>
          <Link href="/policies/privacy" className="text-sage-200 hover:text-white transition-colors text-xs">
            Privacy
          </Link>
          <span className="text-sage-300">|</span>
          <Link href="/policies/terms" className="text-sage-200 hover:text-white transition-colors text-xs">
            Terms
          </Link>
        </nav>

        {/* Address */}
        <div className="text-center mb-4">
          <p className="text-white text-sm">
            1025 Finn Hall Road, Port Angeles, WA 98362
          </p>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p className="text-xs text-sage-300">
            Olympic Bluffs Cidery @2020
          </p>
        </div>
      </div>
    </footer>
  );
}
