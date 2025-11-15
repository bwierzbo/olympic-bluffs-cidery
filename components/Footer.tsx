import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* About Section */}
          <div>
            <h3 className="text-xl font-bold text-amber-400 mb-4">
              Olympic Bluffs Cidery
            </h3>
            <p className="text-gray-300 text-sm">
              Crafting premium ciders with passion and tradition.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-amber-400 mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-300 hover:text-amber-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-300 hover:text-amber-400 transition-colors">
                  Our Ciders
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-amber-400 transition-colors">
                  Visit Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-amber-400 mb-4">
              Contact
            </h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>123 Cider Lane</li>
              <li>Port Townsend, WA 98368</li>
              <li>Phone: (360) 555-0123</li>
              <li>info@olympicbluffscidery.com</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-700 pt-8 text-center">
          <p className="text-sm text-gray-400">
            © {currentYear} Olympic Bluffs Cidery. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
