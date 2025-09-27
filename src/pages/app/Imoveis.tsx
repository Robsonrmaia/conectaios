import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Imoveis = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Meus Imóveis</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Imóvel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pesquisar Imóveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por título, cidade, bairro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Sistema de imóveis em desenvolvimento
            </p>
            <p className="text-sm text-muted-foreground">
              Funcionalidades completas serão restauradas em breve
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Imoveis;