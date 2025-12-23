export default function PrivacyPage() {
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

        <div className="prose prose-sage max-w-none">
          <p className="text-lg text-gray-700 mb-6">
            Olympic Bluffs Cidery & Lavender Farm (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to
            protecting your privacy. This Privacy Policy explains how we collect, use, and
            safeguard your information when you visit our website and make purchases.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Information We Collect</h2>
          <p className="text-gray-700 mb-4">
            When you place an order, we collect the following information:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li><strong>Contact Information:</strong> Name, email address, phone number</li>
            <li><strong>Shipping Information:</strong> Mailing address (for shipped orders)</li>
            <li><strong>Payment Information:</strong> Processed securely through Square (we do not store your card details)</li>
            <li><strong>Order Information:</strong> Products purchased, order history</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">How We Use Your Information</h2>
          <p className="text-gray-700 mb-4">
            We use your information to:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li>Process and fulfill your orders</li>
            <li>Send order confirmations and shipping updates</li>
            <li>Respond to your inquiries and provide customer support</li>
            <li>Improve our website and services</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Payment Processing</h2>
          <p className="text-gray-700 mb-4">
            All payments are processed securely through <strong>Square</strong>. Your payment card
            information is encrypted and transmitted directly to Square. We never see or store
            your full card number. For more information about Square&apos;s security practices, visit{' '}
            <a
              href="https://squareup.com/us/en/legal/general/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sage-600 hover:text-sage-700 underline"
            >
              Square&apos;s Privacy Policy
            </a>.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Third-Party Services</h2>
          <p className="text-gray-700 mb-4">
            We use the following third-party services:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li><strong>Square:</strong> Payment processing and order management</li>
            <li><strong>USPS:</strong> Shipping and delivery services</li>
            <li><strong>Vercel:</strong> Website hosting and analytics</li>
          </ul>
          <p className="text-gray-700 mb-4">
            These services may have access to certain information as necessary to perform their
            functions but are obligated not to use it for other purposes.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Data Retention</h2>
          <p className="text-gray-700 mb-4">
            We retain your order information for as long as necessary to fulfill orders, provide
            customer service, and comply with legal requirements. You may request deletion of your
            personal information by contacting us.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Cookies</h2>
          <p className="text-gray-700 mb-4">
            Our website uses cookies to maintain your shopping cart and improve your browsing
            experience. These cookies are essential for the website to function properly.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Your Rights</h2>
          <p className="text-gray-700 mb-4">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li>Access the personal information we have about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your personal information</li>
            <li>Opt out of marketing communications</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Children&apos;s Privacy</h2>
          <p className="text-gray-700 mb-4">
            Our website is not intended for children under 13 years of age. We do not knowingly
            collect personal information from children.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Changes to This Policy</h2>
          <p className="text-gray-700 mb-4">
            We may update this Privacy Policy from time to time. Any changes will be posted on
            this page with an updated revision date.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Contact Us</h2>
          <p className="text-gray-700 mb-4">
            If you have questions about this Privacy Policy or your personal information, please
            contact us at{' '}
            <a href="mailto:info@olympicbluffs.com" className="text-sage-600 hover:text-sage-700 underline">
              info@olympicbluffs.com
            </a>.
          </p>

          <p className="text-sm text-gray-500 mt-8">
            Last updated: December 2024
          </p>
        </div>
      </div>
    </section>
  );
}
