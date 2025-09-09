interface PropertyBannerProps {
  bannerType: string | null;
}

const bannerConfig = {
  vendido: {
    text: 'VENDIDO',
    className: 'bg-destructive text-destructive-foreground'
  },
  alugado: {
    text: 'ALUGADO',
    className: 'bg-green-600 text-white'
  },
  oportunidade: {
    text: 'OPORTUNIDADE',
    className: 'bg-orange-500 text-white'
  },
  exclusivo: {
    text: 'EXCLUSIVO',
    className: 'bg-gradient-to-r from-purple-600 to-yellow-500 text-white'
  },
  abaixo_mercado: {
    text: 'ABAIXO DO MERCADO',
    className: 'bg-red-600 text-white'
  }
};

export function PropertyBanner({ bannerType }: PropertyBannerProps) {
  if (!bannerType || !bannerConfig[bannerType as keyof typeof bannerConfig]) {
    return null;
  }

  const config = bannerConfig[bannerType as keyof typeof bannerConfig];

  return (
    <div className={`absolute top-2 left-2 px-3 py-1 rounded-md text-xs font-bold z-10 shadow-lg ${config.className}`}>
      {config.text}
    </div>
  );
}