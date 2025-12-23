import { CartItem } from './types';
import productWeights from '@/config/product-weights.json';

// Shipping rate tiers (weight in ounces, cost in cents)
export const SHIPPING_TIERS = [
  { maxOz: 8, label: 'Under 8oz', cost: 500 },      // $5.00
  { maxOz: 16, label: '8oz - 1lb', cost: 700 },    // $7.00
  { maxOz: 32, label: '1 - 2 lbs', cost: 1000 },   // $10.00
  { maxOz: 48, label: '2 - 3 lbs', cost: 1300 },   // $13.00
  { maxOz: 80, label: '3 - 5 lbs', cost: 1600 },   // $16.00
  { maxOz: Infinity, label: 'Over 5 lbs', cost: 2000 }, // $20.00
];

const DEFAULT_WEIGHT = (productWeights as any)._defaultWeight || 4; // 4 oz default
const weights = (productWeights as any).weights as Record<string, number>;

/**
 * Get the weight of a product in ounces
 * Checks config file first, falls back to product.weight, then default
 */
export function getProductWeight(productName: string, productWeight?: number): number {
  // Check for exact match in config
  if (weights[productName]) {
    return weights[productName];
  }

  // Check for partial match (product name contains key)
  for (const [key, weight] of Object.entries(weights)) {
    if (productName.toLowerCase().includes(key.toLowerCase())) {
      return weight;
    }
  }

  // Use product's own weight if set
  if (productWeight) {
    return productWeight;
  }

  // Fall back to default
  return DEFAULT_WEIGHT;
}

/**
 * Calculate total weight of cart items in ounces
 */
export function calculateCartWeight(items: CartItem[]): number {
  return items.reduce((total, item) => {
    const weight = getProductWeight(item.product.name, item.product.weight);
    return total + (weight * item.quantity);
  }, 0);
}

/**
 * Get shipping cost in cents based on total weight
 */
export function calculateShippingCost(weightOz: number): number {
  for (const tier of SHIPPING_TIERS) {
    if (weightOz <= tier.maxOz) {
      return tier.cost;
    }
  }
  return SHIPPING_TIERS[SHIPPING_TIERS.length - 1].cost;
}

/**
 * Get shipping tier info for display
 */
export function getShippingTier(weightOz: number): { label: string; cost: number } {
  for (const tier of SHIPPING_TIERS) {
    if (weightOz <= tier.maxOz) {
      return { label: tier.label, cost: tier.cost };
    }
  }
  const lastTier = SHIPPING_TIERS[SHIPPING_TIERS.length - 1];
  return { label: lastTier.label, cost: lastTier.cost };
}

/**
 * Format weight for display
 */
export function formatWeight(weightOz: number): string {
  if (weightOz < 16) {
    return `${weightOz} oz`;
  }
  const lbs = weightOz / 16;
  if (lbs === Math.floor(lbs)) {
    return `${lbs} lb${lbs > 1 ? 's' : ''}`;
  }
  return `${lbs.toFixed(1)} lbs`;
}

/**
 * Calculate shipping for cart items (convenience function)
 */
export function getCartShipping(items: CartItem[]): {
  weightOz: number;
  weightFormatted: string;
  tier: string;
  cost: number;
  costFormatted: string;
} {
  const weightOz = calculateCartWeight(items);
  const tier = getShippingTier(weightOz);

  return {
    weightOz,
    weightFormatted: formatWeight(weightOz),
    tier: tier.label,
    cost: tier.cost,
    costFormatted: `$${(tier.cost / 100).toFixed(2)}`,
  };
}
