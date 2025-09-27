import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function AdminTestimonialManagerDisabled() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Gestão de Depoimentos
        </CardTitle>
        <CardDescription>
          Funcionalidade temporariamente desabilitada - tabela 'testimonials' não está configurada no banco de dados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Para habilitar esta funcionalidade, será necessário criar a estrutura de banco de dados para depoimentos.
        </p>
      </CardContent>
    </Card>
  );
}