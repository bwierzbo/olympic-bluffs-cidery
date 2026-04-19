import { SquareClient, SquareEnvironment } from 'square';

export type SquareMode = 'sandbox' | 'production';

// Runtime override — defaults to env var, toggled via admin API
let activeMode: SquareMode = (process.env.SQUARE_ENVIRONMENT as SquareMode) || 'production';

export function getSquareMode(): SquareMode {
  return activeMode;
}

export function setSquareMode(mode: SquareMode) {
  activeMode = mode;
  // Clear cached client so next call creates a fresh one
  cachedClient = null;
}

function getCredentials(mode: SquareMode) {
  if (mode === 'sandbox') {
    return {
      applicationId: process.env.SQUARE_SANDBOX_APPLICATION_ID || '',
      accessToken: process.env.SQUARE_SANDBOX_ACCESS_TOKEN || '',
      locationId: process.env.SQUARE_SANDBOX_LOCATION_ID || '',
    };
  }
  return {
    applicationId: process.env.SQUARE_PROD_APPLICATION_ID || '',
    accessToken: process.env.SQUARE_PROD_ACCESS_TOKEN || '',
    locationId: process.env.SQUARE_PROD_LOCATION_ID || '',
  };
}

// Lazily created Square client that respects the active mode
let cachedClient: SquareClient | null = null;
let cachedMode: SquareMode | null = null;

export function getSquareClient(): SquareClient {
  if (cachedClient && cachedMode === activeMode) return cachedClient;

  const creds = getCredentials(activeMode);
  cachedClient = new SquareClient({
    token: creds.accessToken,
    environment: activeMode === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
  });
  cachedMode = activeMode;
  return cachedClient;
}

// For backwards compat — used by process-payment
export const squareClient = new Proxy({} as SquareClient, {
  get(_target, prop) {
    return (getSquareClient() as any)[prop];
  },
});

/** Returns the public config the checkout page needs */
export function getSquarePublicConfig() {
  const creds = getCredentials(activeMode);
  return {
    applicationId: creds.applicationId,
    locationId: creds.locationId,
    environment: activeMode,
    cdnUrl: activeMode === 'sandbox'
      ? 'https://sandbox.web.squarecdn.com/v1/square.js'
      : 'https://web.squarecdn.com/v1/square.js',
  };
}

// Validate configuration for current mode
export function validateSquareConfig() {
  const creds = getCredentials(activeMode);
  const errors: string[] = [];

  if (!creds.applicationId) errors.push(`${activeMode} application ID is not set`);
  if (!creds.locationId) errors.push(`${activeMode} location ID is not set`);
  if (!creds.accessToken) errors.push(`${activeMode} access token is not set`);

  if (errors.length > 0) {
    console.error('Square configuration errors:', errors);
    return false;
  }
  return true;
}
