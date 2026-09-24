import Link from 'next/link';

/**
 * VinoShipper's Add to Cart control for one cider. The injector (loaded by
 * <VinoShipperLoader />) replaces the placeholder div with a quantity
 * selector and button wired to its cart. Styled in globals.css under
 * `.vs-add-to-cart`.
 *
 * When `enabled` is false (online cider sales switched off in site-config),
 * or the cider has no VinoShipper id, a link to the tasting room is shown
 * instead so the card never renders an empty slot.
 */
export default function AddToCart({
  productId,
  enabled = true,
  quantity = false,
  units = 'Bottles',
}: {
  productId: number | null;
  enabled?: boolean;
  /** Show VinoShipper's quantity selector next to the button. */
  quantity?: boolean;
  units?: string;
}) {
  if (!enabled || productId === null) {
    return (
      <Link href="/visit" className="btn btn-secondary !px-4 !py-2">
        Tasting room
      </Link>
    );
  }
  return (
    <div
      className="vs-add-to-cart vs-horizontal"
      data-vs-product-id={productId}
      data-vs-include-qty={quantity ? 'true' : 'false'}
      data-vs-product-units={units}
    />
  );
}
