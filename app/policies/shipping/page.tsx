export default function ShippingPage() {
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shipping Policy</h1>

        <div className="prose prose-sage max-w-none">
          <p className="text-lg text-gray-700 mb-6">
            We ship our lavender products across the United States using USPS.
            Below you will find all the details about our shipping process.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Processing Time</h2>
          <p className="text-gray-700 mb-4">
            Orders are typically processed within <strong>3-5 business days</strong>. During busy
            seasons (holidays, lavender harvest), processing may take slightly longer. You will
            receive a confirmation email once your order has shipped.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Shipping Rates</h2>
          <div className="bg-sage-50 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-700 font-medium">Flat Rate Shipping (USPS)</span>
              <span className="text-sage-700 font-semibold">$20.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Farm Pickup</span>
              <span className="text-sage-700 font-semibold">FREE</span>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Delivery Time</h2>
          <p className="text-gray-700 mb-4">
            After your order ships, typical delivery times are:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li><strong>West Coast:</strong> 2-4 business days</li>
            <li><strong>Midwest:</strong> 4-6 business days</li>
            <li><strong>East Coast:</strong> 5-7 business days</li>
          </ul>
          <p className="text-gray-700 mb-4">
            Please note these are estimates and actual delivery times may vary based on USPS operations.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Farm Pickup</h2>
          <p className="text-gray-700 mb-4">
            Skip shipping costs by picking up your order at our farm! When you select "Pickup at Farm"
            during checkout, we will email you when your order is ready for pickup.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-gray-700 font-medium mb-2">Pickup Location:</p>
            <p className="text-gray-600">
              Olympic Bluffs Cidery & Lavender Farm<br />
              1025 Finn Hall Road<br />
              Port Angeles, WA 98362
            </p>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Shipping Restrictions</h2>
          <p className="text-gray-700 mb-4">
            We currently ship to addresses within the <strong>United States only</strong>.
            We do not ship to PO Boxes for larger items.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Note:</strong> Cider products are available for farm pickup only and cannot be shipped.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Order Tracking</h2>
          <p className="text-gray-700 mb-4">
            Once your order ships, you will receive an email with tracking information.
            You can use this to monitor your package through the USPS website.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Lost or Damaged Packages</h2>
          <p className="text-gray-700 mb-4">
            If your package is lost or arrives damaged, please contact us at{' '}
            <a href="mailto:info@olympicbluffs.com" className="text-sage-600 hover:text-sage-700 underline">
              info@olympicbluffs.com
            </a>{' '}
            and we will work with you to resolve the issue.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Questions?</h2>
          <p className="text-gray-700 mb-4">
            If you have any questions about shipping, please email us at{' '}
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
