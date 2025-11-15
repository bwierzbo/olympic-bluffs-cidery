interface HeroProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  height?: 'small' | 'medium' | 'large';
}

export default function Hero({
  title,
  subtitle,
  backgroundImage,
  height = 'large',
}: HeroProps) {
  const heightClasses = {
    small: 'h-64',
    medium: 'h-96',
    large: 'h-[600px]',
  };

  return (
    <div
      className={`relative ${heightClasses[height]} flex items-center justify-center overflow-hidden`}
      style={
        backgroundImage
          ? {
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : {}
      }
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/30" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-100 sm:text-2xl">
            {subtitle}
          </p>
        )}
      </div>

      {/* Placeholder background if no image */}
      {!backgroundImage && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-700 via-amber-600 to-amber-800" />
      )}
    </div>
  );
}
