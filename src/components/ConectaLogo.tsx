import { useState } from 'react';

interface ConectaLogoProps {
  className?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export default function ConectaLogo({ 
  className = "", 
  alt = "ConectaIOS", 
  width = 120, 
  height = 40 
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
    <img
      src="/logoconectaios.png"
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setImageError(true)}
      loading="lazy"
    />
  );
}