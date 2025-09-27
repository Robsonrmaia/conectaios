import { useState } from 'react';
import { useHeroImage } from '@/providers/BrandingProvider';

interface HeroSectionProps {
  className?: string;
  fallback?: React.ReactNode;
}

export default function HeroSection({ className = "", fallback }: HeroSectionProps) {
  const [imageError, setImageError] = useState(false);
  const heroUrl = useHeroImage();

  // Show fallback if no hero URL or image fails to load
  if (imageError || !heroUrl) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={heroUrl}
        alt="ConectaIOS Hero"
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
    </div>
  );
}