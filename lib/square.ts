import { SquareClient, SquareEnvironment } from 'square';

// Initialize Square client for server-side operations
export const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN || '',
  environment:
    process.env.SQUARE_ENVIRONMENT === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

// Square configuration for client-side
export const squareConfig = {
  applicationId: process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || '',
  locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || '',
  environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
};

// Validate configuration
export function validateSquareConfig() {
  const errors: string[] = [];

  if (!process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID) {
    errors.push('NEXT_PUBLIC_SQUARE_APPLICATION_ID is not set');
  }

  if (!process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID) {
    errors.push('NEXT_PUBLIC_SQUARE_LOCATION_ID is not set');
  }

  if (!process.env.SQUARE_ACCESS_TOKEN) {
    errors.push('SQUARE_ACCESS_TOKEN is not set');
  }

  if (errors.length > 0) {
    console.error('Square configuration errors:', errors);
    return false;
  }

  return true;
}
