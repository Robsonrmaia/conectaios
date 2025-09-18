import { cn } from "@/lib/utils";

interface ResponsiveRowProps {
  children: React.ReactNode;
  className?: string;
  spacing?: "sm" | "md" | "lg";
  mobileStack?: boolean;
}

/**
 * ResponsiveRow - Container flex que se adapta automaticamente para mobile
 * 
 * Evita overflow horizontal empilhando ou wrapping elementos em telas pequenas
 * 
 * @param spacing - Espaçamento entre elementos (sm=0.5rem, md=1rem, lg=1.5rem)
 * @param mobileStack - Se true, empilha verticalmente no mobile ao invés de wrap
 */
export function ResponsiveRow({ 
  children, 
  className = "", 
  spacing = "md",
  mobileStack = false 
}: ResponsiveRowProps) {
  const spacingClasses = {
    sm: "gap-2",
    md: "gap-4", 
    lg: "gap-6"
  };

  const flexClasses = mobileStack 
    ? "flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center"
    : "flex flex-wrap items-center";

  return (
    <div className={cn(
      flexClasses,
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  );
}

/**
 * ResponsiveButtonGroup - Grupo de botões que se adapta para mobile
 * 
 * Botões ficam full-width no mobile e auto no desktop
 */
export function ResponsiveButtonGroup({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <ResponsiveRow className={className}>
      {/* Cada botão filho deve ter className="w-full sm:w-auto" */}
      {children}
    </ResponsiveRow>
  );
}

/**
 * ScrollableRow - Container horizontal com scroll para elementos que não cabem
 * 
 * Útil para tabs, chips, ou qualquer lista horizontal
 */
export function ScrollableRow({ 
  children, 
  className = "",
  padding = true
}: { 
  children: React.ReactNode; 
  className?: string;
  padding?: boolean;
}) {
  return (
    <div className={cn(
      "scroll-container",
      padding && "-mx-4 sm:mx-0 px-4",
      className
    )}>
      <div className="flex gap-2 min-w-max">
        {children}
      </div>
    </div>
  );
}