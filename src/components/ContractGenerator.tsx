import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Printer, Eye } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface ContractGeneratorProps {
  deal: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ContractGenerator({ deal, isOpen, onClose }: ContractGeneratorProps) {
  const [contractData, setContractData] = useState({
    templateName: 'compra_venda',
    status: 'draft',
    contractDetails: {
      buyerName: deal?.clientName || '',
      propertyTitle: deal?.propertyTitle || '',
      propertyValue: deal?.value || 0,
      commission: deal?.commission || 0,
      commissionSplit: '50/50',
      paymentTerms: '30% entrada, 70% financiamento',
      deliveryDate: new Date().toLocaleDateString('pt-BR'),
      conditions: 'Venda sujeita a aprovação de financiamento'
    }
  });

  const [showPreview, setShowPreview] = useState(false);

  const handleGenerateContract = () => {
    toast({
      title: "Contrato Gerado",
      description: "Rascunho do contrato criado com sucesso!",
    });
    setShowPreview(true);
  };

  const handlePrintContract = () => {
    window.print();
    toast({
      title: "Enviando para impressora",
      description: "Contrato sendo enviado para impressão",
    });
  };

  const handleDownloadPDF = () => {
    toast({
      title: "Download iniciado",
      description: "PDF do contrato sendo gerado para download",
    });
  };

  if (!showPreview) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar Contrato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados do Negócio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Imóvel:</span>
                  <span className="font-medium">{deal?.propertyTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium">{deal?.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-medium text-primary">
                    {deal?.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Comissão:</span>
                  <span className="font-medium">
                    {deal?.commission?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button onClick={() => onClose()} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleGenerateContract} className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                Gerar Rascunho
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Rascunho do Contrato</DialogTitle>
            <Badge className="bg-yellow-100 text-yellow-800">
              Rascunho
            </Badge>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Contract Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">CONTRATO DE COMPRA E VENDA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-3">
                <p className="font-semibold">VENDEDOR:</p>
                <p>Nome: _________________________________</p>
                <p>CPF: __________________________________</p>
                <p>Endereço: ____________________________</p>

                <p className="font-semibold mt-4">COMPRADOR:</p>
                <p>Nome: <span className="underline">{contractData.contractDetails.buyerName}</span></p>
                <p>CPF: __________________________________</p>
                <p>Endereço: ____________________________</p>

                <p className="font-semibold mt-4">OBJETO:</p>
                <p>Imóvel: <span className="underline">{contractData.contractDetails.propertyTitle}</span></p>
                <p>Valor: <span className="underline font-semibold">
                  {contractData.contractDetails.propertyValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span></p>

                <p className="font-semibold mt-4">CONDIÇÕES DE PAGAMENTO:</p>
                <p>{contractData.contractDetails.paymentTerms}</p>

                <p className="font-semibold mt-4">PRAZO DE ENTREGA:</p>
                <p>Data prevista: {contractData.contractDetails.deliveryDate}</p>

                <p className="font-semibold mt-4">COMISSÃO DE CORRETAGEM:</p>
                <p>Valor: <span className="underline">
                  {contractData.contractDetails.commission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span></p>
                <p>Divisão: {contractData.contractDetails.commissionSplit}</p>

                <p className="font-semibold mt-4">CONDIÇÕES ESPECIAIS:</p>
                <p>{contractData.contractDetails.conditions}</p>

                <div className="mt-8 pt-4 border-t">
                  <div className="flex justify-between">
                    <div className="text-center">
                      <div className="border-t border-gray-400 pt-2 w-48">
                        <p className="text-sm">Assinatura do Vendedor</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="border-t border-gray-400 pt-2 w-48">
                        <p className="text-sm">Assinatura do Comprador</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center mt-6">
                    <div className="text-center">
                      <div className="border-t border-gray-400 pt-2 w-48">
                        <p className="text-sm">Corretor Responsável</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={() => setShowPreview(false)} variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button onClick={handleDownloadPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handlePrintContract}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}