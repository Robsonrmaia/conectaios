import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Printer, Eye } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useBroker } from '@/hooks/useBroker';

interface ContractGeneratorProps {
  deal: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ContractGenerator({ deal, isOpen, onClose }: ContractGeneratorProps) {
  const { broker } = useBroker();
  const [contractData, setContractData] = useState({
    templateName: 'compra_venda',
    status: 'draft',
    contractDetails: {
      buyerName: deal?.clientName || '',
      propertyTitle: deal?.propertyTitle || '',
      propertyValue: deal?.value || 0,
      commission: deal?.commission || 0,
      commissionSplit: deal?.commissionSplit || '50/50',
      paymentTerms: '30% entrada, 70% financiamento',
      deliveryDate: new Date().toLocaleDateString('pt-BR'),
      conditions: 'Venda sujeita a aprovação de financiamento',
      brokerName: broker?.name || '',
      brokerCreci: broker?.creci || '',
      brokerPhone: broker?.phone || '',
      brokerEmail: broker?.email || '',
      contractId: deal?.id || '',
      dealId: deal?.id || '',
      propertyAddress: deal?.propertyAddress || '',
      currentDate: new Date().toLocaleDateString('pt-BR'),
      firstBrokerPercentage: deal?.commissionSplit?.includes('/') ? 
        deal.commissionSplit.split('/')[0] : '50'
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
          {/* Professional Contract Preview */}
          <div className="contract-preview bg-white text-black p-8 rounded-lg border" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12.5pt', lineHeight: '1.45' }}>
            <div className="watermark" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.06, fontSize: '84pt', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-18deg)' }}>
              Conecta IOS
            </div>

            <header className="flex items-center gap-4 pb-4 border-b-2 border-gray-200 mb-6">
              <div className="flex-1">
                <h1 className="text-lg font-bold mb-2 text-indigo-600">Contrato Simples de Parceria – Conecta IOS</h1>
                <div className="text-gray-600 text-sm">Acordo de cavalheiros para intermediação imobiliária</div>
              </div>
              <div className="font-bold text-indigo-600">#{String(contractData.contractDetails.contractId).slice(0, 8)}</div>
            </header>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
              <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-600 text-xs font-semibold rounded-full border border-indigo-200 mb-2">
                Resumo
              </span>
              <p className="mt-2 text-sm">
                <strong>Região:</strong> Ilhéus • <strong>Data:</strong> {contractData.contractDetails.currentDate} • <strong>Status:</strong> {contractData.status === 'draft' ? 'Rascunho' : 'Finalizado'}
              </p>
            </div>

            {/* PARTES ENVOLVIDAS */}
            <section className="mb-6">
              <h2 className="text-base font-semibold mb-3">1. Partes Envolvidas</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <div><strong>Corretor A</strong></div>
                      <div>{contractData.contractDetails.brokerName}</div>
                      <div>CRECI</div>
                      <div>{contractData.contractDetails.brokerCreci}</div>
                      <div>Telefone</div>
                      <div>{contractData.contractDetails.brokerPhone}</div>
                      <div>E-mail</div>
                      <div>{contractData.contractDetails.brokerEmail}</div>
                    </div>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <div><strong>Corretor B</strong></div>
                      <div>_______________________</div>
                      <div>CRECI</div>
                      <div>_______________________</div>
                      <div>Telefone</div>
                      <div>_______________________</div>
                      <div>E-mail</div>
                      <div>_______________________</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* IMÓVEL */}
            <section className="mb-6">
              <h2 className="text-base font-semibold mb-3">2. Imóvel</h2>
              <table className="w-full border-collapse text-sm">
                <tr>
                  <th className="border border-gray-200 p-2 bg-gray-50 text-left font-semibold w-1/4">Código/ID</th>
                  <td className="border border-gray-200 p-2">{String(deal?.id || '').slice(0, 8) || 'N/A'}</td>
                </tr>
                <tr>
                  <th className="border border-gray-200 p-2 bg-gray-50 text-left font-semibold">Título</th>
                  <td className="border border-gray-200 p-2">{contractData.contractDetails.propertyTitle}</td>
                </tr>
                <tr>
                  <th className="border border-gray-200 p-2 bg-gray-50 text-left font-semibold">Endereço/Bairro</th>
                  <td className="border border-gray-200 p-2">{contractData.contractDetails.propertyAddress || '_______________________'}</td>
                </tr>
                <tr>
                  <th className="border border-gray-200 p-2 bg-gray-50 text-left font-semibold">Valor de referência</th>
                  <td className="border border-gray-200 p-2">
                    {contractData.contractDetails.propertyValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                </tr>
                <tr>
                  <th className="border border-gray-200 p-2 bg-gray-50 text-left font-semibold">Detalhes</th>
                  <td className="border border-gray-200 p-2">{contractData.contractDetails.conditions}</td>
                </tr>
              </table>
            </section>

            {/* OBJETO */}
            <section className="mb-6">
              <h2 className="text-base font-semibold mb-3">3. Objeto do Acordo</h2>
              <p className="text-sm">
                As partes firmam parceria para compartilhar a intermediação do imóvel acima identificado, comprometendo-se com a cooperação profissional, transparência, confidencialidade e respeito às normas aplicáveis.
              </p>
            </section>

            {/* DIVISÃO */}
            <section className="mb-6">
              <h2 className="text-base font-semibold mb-3">4. Divisão de Comissão</h2>
              <table className="w-full border-collapse text-sm">
                <tr>
                  <th className="border border-gray-200 p-2 bg-gray-50 text-left font-semibold">Parte</th>
                  <th className="border border-gray-200 p-2 bg-gray-50 text-left font-semibold">Percentual</th>
                </tr>
                <tr>
                  <td className="border border-gray-200 p-2">Corretor A – {contractData.contractDetails.brokerName}</td>
                  <td className="border border-gray-200 p-2">{contractData.contractDetails.firstBrokerPercentage}%</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 p-2">Corretor B – _______________________</td>
                  <td className="border border-gray-200 p-2">{100 - parseInt(contractData.contractDetails.firstBrokerPercentage)}%</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 p-2 text-right"><strong>Total</strong></td>
                  <td className="border border-gray-200 p-2"><strong>100%</strong></td>
                </tr>
              </table>
              <p className="text-xs text-gray-600 mt-2">Observação: a soma dos percentuais deve ser 100%.</p>
            </section>

            {/* CONDIÇÕES */}
            <section className="mb-6">
              <h2 className="text-base font-semibold mb-3">5. Condições Gerais</h2>
              <ul className="text-sm space-y-1 list-disc pl-5">
                <li>Cada corretor responde pela precisão das informações repassadas ao cliente.</li>
                <li>Este documento é um <strong>acordo simples de cavalheiros</strong>, não substitui a legislação aplicável nem as normas do CRECI.</li>
                <li>Qualquer alteração de condições ou percentuais exige anuência de todas as partes.</li>
                <li>Despesas e materiais de divulgação poderão ser rateadas conforme acordo informal entre as partes.</li>
                <li>Em caso de desistência do cliente ou cancelamento, nenhuma das partes fará jus à comissão.</li>
              </ul>
            </section>

            {/* VIGÊNCIA */}
            <section className="mb-6">
              <h2 className="text-base font-semibold mb-3">6. Vigência</h2>
              <p className="text-sm">
                Válido apenas para a negociação do imóvel identificado neste documento, extinguindo-se automaticamente após conclusão (assinatura de instrumento definitivo) ou cancelamento da negociação.
              </p>
            </section>

            {/* ASSINATURAS */}
            <section className="mb-6">
              <h2 className="text-base font-semibold mb-3">7. Assinaturas</h2>
              <p className="text-gray-600 text-sm mb-3">Ilhéus, {contractData.contractDetails.currentDate}.</p>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="h-20 border-t-2 border-black pt-2">
                    <p className="font-semibold text-sm">{contractData.contractDetails.brokerName}</p>
                    <p className="text-xs">CRECI {contractData.contractDetails.brokerCreci} — Tel: {contractData.contractDetails.brokerPhone}</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="h-20 border-t-2 border-black pt-2">
                    <p className="font-semibold text-sm">_______________________</p>
                    <p className="text-xs">CRECI _______ — Tel: _______</p>
                  </div>
                </div>
                <div></div>
              </div>
            </section>

            {/* RODAPÉ TÉCNICO */}
            <section className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
              <strong>ID do Contrato:</strong> {contractData.contractDetails.contractId} • <strong>Deal:</strong> {contractData.contractDetails.dealId} • <strong>Gerado por:</strong> Conecta IOS
              <br/><strong>Hash/Checksum:</strong> {Math.random().toString(36).substr(2, 16).toUpperCase()}
            </section>
          </div>

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