import { getSiteConfig } from '@/lib/site-config';

interface SeasonalBannerProps {
  isVisible?: boolean;
  message?: string;
}

export default function SeasonalBanner({
  isVisible,
  message
}: SeasonalBannerProps) {
  const config = getSiteConfig();

  // Use props if provided, otherwise use config
  const shouldShow = isVisible ?? config.seasonal.banner.visible;
  const displayMessage = message ?? config.seasonal.banner.message;
  const bgColor = `bg-${config.seasonal.banner.backgroundColor}`;

  if (!shouldShow) return null;

  return (
    <div className={`${bgColor} py-12`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center tracking-wide">
          {displayMessage}
        </h2>
      </div>
    </div>
  );
}
