interface SeasonalBannerProps {
  isVisible?: boolean;
  message?: string;
}

export default function SeasonalBanner({
  isVisible = true,
  message = "THE FARM IS CLOSED FOR THE SEASON."
}: SeasonalBannerProps) {
  if (!isVisible) return null;

  return (
    <div className="bg-sage-500 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center tracking-wide">
          {message}
        </h2>
      </div>
    </div>
  );
}
