import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Images, Plus } from 'lucide-react';
import ImovelImageManager from './imoveis/ImovelImageManager';

interface Props {
  propertyId: string;
  expanded?: boolean;
}

export default function PropertyImageManagerWrapper({ propertyId, expanded = false }: Props) {
  const [isExpanded, setIsExpanded] = useState(expanded);

  if (!isExpanded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Images className="h-5 w-5" />
            Gestão de Imagens
          </CardTitle>
          <CardDescription>
            Gerencie as imagens deste imóvel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setIsExpanded(true)}
            className="w-full"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Abrir Gestão de Imagens
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Images className="h-5 w-5" />
          Gestão de Imagens
        </h3>
        <Button 
          onClick={() => setIsExpanded(false)}
          variant="outline"
          size="sm"
        >
          Minimizar
        </Button>
      </div>
      <ImovelImageManager imovelId={propertyId} />
    </div>
  );
}