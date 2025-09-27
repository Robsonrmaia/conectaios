import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ImovelImageManager from "@/components/imoveis/ImovelImageManager";

export default function ImovelImagesTest() {
  const [imovelId, setImovelId] = useState("");
  const [showManager, setShowManager] = useState(false);
  const navigate = useNavigate();

  const handleTest = () => {
    if (imovelId.trim()) {
      setShowManager(true);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate("/app/dashboard")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Teste - Gestão de Imagens</h1>
          <p className="text-muted-foreground">Sistema de upload e gestão de imagens de imóveis</p>
        </div>
      </div>

      {!showManager ? (
        <Card>
          <CardHeader>
            <CardTitle>Teste do Sistema de Imagens</CardTitle>
            <CardDescription>
              Insira um ID de imóvel para testar o sistema de gestão de imagens
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="ID do imóvel (UUID)"
                value={imovelId}
                onChange={(e) => setImovelId(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleTest}>
                Testar Sistema
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <p><strong>Funcionalidades disponíveis:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Upload múltiplo de imagens (JPG, PNG, WebP)</li>
                <li>Visualização em grid responsivo</li>
                <li>Definir imagem de capa</li>
                <li>Exclusão segura via Edge Function</li>
                <li>Armazenamento no bucket 'imoveis' do Supabase</li>
                <li>Registro no banco de dados (tabela imovel_images)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Button 
            variant="outline" 
            onClick={() => setShowManager(false)}
            className="mb-4"
          >
            ← Voltar ao Teste
          </Button>
          <ImovelImageManager imovelId={imovelId} />
        </div>
      )}
    </div>
  );
}