import { useState } from 'react';
import logonovaImg from '@/assets/logonova.png';

interface ConectaLogoProps {
  className?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export default function ConectaLogo({ 
  className = "", 
  alt = "ConectaIOS", 
  width = 60, 
  height = 20 
}: ConectaLogoProps) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    // Fallback para texto se a imagem não carregar
    return (
      <div className={`flex items-center justify-center font-bold text-primary ${className}`}>
        ConectaIOS
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={logonovaImg}
        alt={alt}
        width={width}
        height={height}
        onError={() => setImageError(true)}
        loading="lazy"
        className="object-contain"
      />
      <span className="font-bold text-primary">ConectaIOS</span>
    </div>
  );
}