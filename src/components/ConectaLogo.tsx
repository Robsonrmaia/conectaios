import { useState } from 'react';
import { useLogo, useHeaderLogo } from '@/providers/BrandingProvider';

interface ConectaLogoProps {
  className?: string;
  alt?: string;
  width?: number;
  height?: number;
  vertical?: boolean;
  variant?: 'auth' | 'header';
}

export default function ConectaLogo({ 
  className = "", 
  alt = "ConectaIOS", 
  width = 60, 
  height = 20,
  vertical = false,
  variant = 'auth'
}: ConectaLogoProps) {
  const [imageError, setImageError] = useState(false);
  const authLogo = useLogo();
  const headerLogo = useHeaderLogo();
  const logoUrl = variant === 'header' ? headerLogo : authLogo;

  // Fallback if no logo URL or image fails to load
  if (imageError || !logoUrl) {
    return (
      <div className={`flex ${vertical ? 'flex-col' : 'items-center'} justify-center font-bold text-primary ${className}`}>
        ConectaIOS
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={alt}
      width={width}
      height={height}
      className={`object-contain ${className}`}
      onError={() => setImageError(true)}
      style={{
        maxWidth: width,
        maxHeight: height
      }}
    />
  );
}