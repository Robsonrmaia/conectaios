import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  containerClass?: string;
  noPadding?: boolean;
  fullWidth?: boolean;
}

/**
 * Section - Container padrão responsivo para seções de página
 * 
 * Aplica container-responsive e overflow-x-hidden automaticamente
 * Evita problemas de layout horizontal em mobile
 */
export function Section({ 
  children, 
  className = "",
  containerClass = "",
  noPadding = false,
  fullWidth = false
}: SectionProps) {
  const containerClasses = fullWidth 
    ? "w-full"
    : "container-responsive";

  return (
    <section className={cn(
      containerClasses,
      !noPadding && "py-6 sm:py-8 lg:py-12",
      "overflow-x-hidden",
      containerClass
    )}>
      <div className={cn("w-full", className)}>
        {children}
      </div>
    </section>
  );
}

/**
 * PageWrapper - Wrapper principal para páginas da aplicação
 * 
 * Inclui padding superior para headers fixos e aplica container responsivo
 */
export function PageWrapper({ 
  children, 
  className = "",
  headerOffset = false
}: { 
  children: React.ReactNode; 
  className?: string;
  headerOffset?: boolean;
}) {
  return (
    <main className={cn(
      "container-responsive w-full overflow-x-hidden min-h-screen",
      headerOffset && "pt-16 sm:pt-20", // Ajustar conforme altura do header
      className
    )}>
      {children}
    </main>
  );
}

/**
 * ResponsiveGrid - Grid que se adapta automaticamente para diferentes telas
 */
export function ResponsiveGrid({ 
  children, 
  className = "",
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = "md"
}: { 
  children: React.ReactNode; 
  className?: string;
  cols?: { mobile: number; tablet: number; desktop: number };
  gap?: "sm" | "md" | "lg";
}) {
  const gapClasses = {
    sm: "gap-3",
    md: "gap-4 sm:gap-6", 
    lg: "gap-6 sm:gap-8"
  };

  const colsClass = `grid-cols-${cols.mobile} sm:grid-cols-${cols.tablet} lg:grid-cols-${cols.desktop}`;

  return (
    <div className={cn(
      "grid",
      colsClass,
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}