import { cn } from "@/lib/utils";

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * ResponsiveTable - Wrapper para tabelas que previne overflow horizontal
 * 
 * Adiciona scroll horizontal automático em mobile
 * Aplica margem negativa para expandir até as bordas em mobile
 */
export function ResponsiveTable({ children, className = "" }: ResponsiveTableProps) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="min-w-full px-4 sm:px-0">
        <table className={cn("min-w-full table-auto", className)}>
          {children}
        </table>
      </div>
    </div>
  );
}

/**
 * ResponsiveCard - Card que se adapta para mobile
 * 
 * Aplica classes padrão para evitar overflow e garante boa responsividade
 */
export function ResponsiveCard({ 
  children, 
  className = "",
  noPadding = false 
}: { 
  children: React.ReactNode; 
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <div className={cn(
      "w-full max-w-full min-w-0",
      "bg-card text-card-foreground rounded-lg border shadow-sm",
      !noPadding && "p-4 sm:p-6",
      className
    )}>
      {children}
    </div>
  );
}

/**
 * ResponsiveModal - Modal que se adapta para diferentes tamanhos de tela
 */
export function ResponsiveModal({ 
  children, 
  className = "",
  size = "default"
}: { 
  children: React.ReactNode; 
  className?: string;
  size?: "sm" | "default" | "lg" | "xl";
}) {
  const sizeClasses = {
    sm: "w-[calc(100vw-2rem)] max-w-sm",
    default: "w-[calc(100vw-2rem)] max-w-lg sm:max-w-xl", 
    lg: "w-[calc(100vw-2rem)] max-w-xl sm:max-w-2xl",
    xl: "w-[calc(100vw-2rem)] max-w-2xl sm:max-w-4xl"
  };

  return (
    <div className={cn(
      sizeClasses[size],
      "mx-auto",
      className
    )}>
      {children}
    </div>
  );
}