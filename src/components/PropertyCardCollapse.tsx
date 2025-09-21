import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface PropertyCardCollapseProps {
  children: React.ReactNode;
  isExpanded?: boolean;
}

export function PropertyCardCollapse({ children, isExpanded = false }: PropertyCardCollapseProps) {
  const [isOpen, setIsOpen] = useState(isExpanded);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between">
          <span className="text-xs text-muted-foreground">
            {isOpen ? 'Ocultar' : 'Mostrar'} opções
          </span>
          {isOpen ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}