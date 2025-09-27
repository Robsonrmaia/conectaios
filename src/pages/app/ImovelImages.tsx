import { useParams } from "react-router-dom";
import ImovelImageManager from "@/components/imoveis/ImovelImageManager";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ImovelImages() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-red-500">ID do imóvel não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate("/app/imoveis")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Imóveis
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Gestão de Imagens</h1>
          <p className="text-muted-foreground">Gerencie as imagens do imóvel</p>
        </div>
      </div>

      <ImovelImageManager imovelId={id} />
    </div>
  );
}