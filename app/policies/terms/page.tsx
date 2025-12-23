export default function TermsPage() {
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>

        <div className="prose prose-sage max-w-none">
          <p className="text-lg text-gray-700 mb-6">
            Welcome to Olympic Bluffs Cidery & Lavender Farm. By accessing our website and
            making purchases, you agree to be bound by these Terms of Service.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-700 mb-4">
            By using this website, you confirm that you are at least 18 years old and agree to
            comply with these terms. If you do not agree with any part of these terms, please
            do not use our website.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Products and Descriptions</h2>
          <p className="text-gray-700 mb-4">
            We strive to display our products as accurately as possible. However, colors and
            appearances may vary slightly due to photography and screen settings. All product
            descriptions are provided in good faith and are as accurate as possible.
          </p>
          <p className="text-gray-700 mb-4">
            Our handcrafted products may have slight variations, which is part of their
            artisanal nature and not considered a defect.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Pricing and Payment</h2>
          <p className="text-gray-700 mb-4">
            All prices are listed in US dollars and are subject to change without notice.
            We reserve the right to correct pricing errors. Payment is required at the time
            of order and is processed securely through Square.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Order Acceptance</h2>
          <p className="text-gray-700 mb-4">
            Your order is an offer to purchase our products. We reserve the right to refuse or
            cancel any order for any reason, including but not limited to:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li>Product unavailability</li>
            <li>Errors in product or pricing information</li>
            <li>Suspected fraudulent activity</li>
          </ul>
          <p className="text-gray-700 mb-4">
            If we cancel your order, you will receive a full refund.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Shipping and Delivery</h2>
          <p className="text-gray-700 mb-4">
            Please refer to our{' '}
            <a href="/policies/shipping" className="text-sage-600 hover:text-sage-700 underline">
              Shipping Policy
            </a>{' '}
            for information about shipping rates, delivery times, and restrictions.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Returns and Refunds</h2>
          <p className="text-gray-700 mb-4">
            Please refer to our{' '}
            <a href="/policies/returns" className="text-sage-600 hover:text-sage-700 underline">
              Returns & Refunds Policy
            </a>{' '}
            for information about our return process.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Intellectual Property</h2>
          <p className="text-gray-700 mb-4">
            All content on this website, including text, images, logos, and graphics, is the
            property of Olympic Bluffs Cidery & Lavender Farm and is protected by copyright
            and trademark laws. You may not reproduce, distribute, or use our content without
            written permission.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. User Conduct</h2>
          <p className="text-gray-700 mb-4">
            You agree not to use our website for any unlawful purpose or in any way that could
            damage, disable, or impair the website. You also agree not to attempt to gain
            unauthorized access to any part of the website.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9. Limitation of Liability</h2>
          <p className="text-gray-700 mb-4">
            To the fullest extent permitted by law, Olympic Bluffs Cidery & Lavender Farm shall
            not be liable for any indirect, incidental, special, or consequential damages arising
            from your use of this website or purchase of our products.
          </p>
          <p className="text-gray-700 mb-4">
            Our liability for any claim related to a purchase shall not exceed the amount you
            paid for the product.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10. Indemnification</h2>
          <p className="text-gray-700 mb-4">
            You agree to indemnify and hold harmless Olympic Bluffs Cidery & Lavender Farm from
            any claims, damages, or expenses arising from your use of the website or violation
            of these terms.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">11. Governing Law</h2>
          <p className="text-gray-700 mb-4">
            These Terms of Service shall be governed by and construed in accordance with the
            laws of the <strong>State of Washington</strong>, without regard to its conflict
            of law provisions.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">12. Changes to Terms</h2>
          <p className="text-gray-700 mb-4">
            We reserve the right to modify these Terms of Service at any time. Changes will be
            effective immediately upon posting to the website. Your continued use of the website
            after changes are posted constitutes acceptance of the modified terms.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">13. Contact Information</h2>
          <p className="text-gray-700 mb-4">
            If you have any questions about these Terms of Service, please contact us at{' '}
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
