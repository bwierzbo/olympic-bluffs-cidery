import Link from 'next/link';

export default function CancelledPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
            <svg
              className="h-10 w-10 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>

          {/* Error Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Unsuccessful
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            We were unable to process your payment. Your cart has been saved and no
            charges were made.
          </p>

          {/* Common Issues */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 text-left">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Common Issues
            </h2>
            <ul className="space-y-2 text-gray-700 list-disc list-inside">
              <li>Incorrect card number or expiration date</li>
              <li>Insufficient funds</li>
              <li>Card declined by your bank</li>
              <li>Billing address doesn&apos;t match card on file</li>
              <li>Network or connection error</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products/checkout"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-sage-500 hover:bg-sage-600 transition-colors"
            >
              Try Again
            </Link>
            <Link
              href="/shop/lavender"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>

          {/* Support */}
          <div className="mt-8 p-4 bg-sage-50 border border-sage-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Need help?</strong> Contact us at{' '}
              <a
                href="mailto:scottatobcf@gmail.com"
                className="text-sage-600 hover:text-sage-700 font-medium"
              >
                scottatobcf@gmail.com
              </a>{' '}
              or{' '}
              <a
                href="mailto:gingeratobcf@gmail.com"
                className="text-sage-600 hover:text-sage-700 font-medium"
              >
                gingeratobcf@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
