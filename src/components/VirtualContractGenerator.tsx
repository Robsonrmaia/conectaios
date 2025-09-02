import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Download, 
  Shield, 
  User, 
  Building2, 
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Pen
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, parseValueInput } from '@/lib/utils';

interface Contract {
  id: string;
  deal_id?: string;
  template_name: string;
  property_data: PropertyData;
  buyer_data: BuyerData;
  seller_data: SellerData;
  contract_terms: ContractTerms;
  signatures: Signature[];
  status: string;
  created_at: string;
  expires_at: string;
  pdf_url?: string;
}

interface PropertyData {
  title: string;
  address: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  price: number;
  reference_code: string;
}

interface BuyerData {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  address: string;
}

interface SellerData {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  address: string;
}

interface ContractTerms {
  sale_price: number;
  down_payment: number;
  financing_amount: number;
  payment_method: string;
  delivery_date: string;
  special_conditions: string;
  commission_buyer: number;
  commission_seller: number;
}

interface Signature {
  id: string;
  signer_name: string;
  signer_email: string;
  signer_type: string; // buyer, seller, broker_buyer, broker_seller
  signed_at: string;
  ip_address: string;
  device_info: string;
}

interface VirtualContractGeneratorProps {
  propertyId?: string;
  dealId?: string;
}

export function VirtualContractGenerator({
  propertyId,
  dealId
}: VirtualContractGeneratorProps) {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [contractForm, setContractForm] = useState({
    template_name: 'compra_venda',
    // Property data
    property_title: '',
    property_address: '',
    property_area: '',
    property_bedrooms: '',
    property_bathrooms: '',
    property_parking: '',
    property_price: '',
    property_reference: '',
    // Buyer data
    buyer_name: '',
    buyer_email: '',
    buyer_phone: '',
    buyer_cpf: '',
    buyer_address: '',
    // Seller data
    seller_name: '',
    seller_email: '',
    seller_phone: '',
    seller_cpf: '',
    seller_address: '',
    // Contract terms
    sale_price: '',
    down_payment: '',
    financing_amount: '',
    payment_method: 'financiado',
    delivery_date: '',
    special_conditions: '',
    commission_buyer: '3',
    commission_seller: '3'
  });

  const generateContract = async () => {
    if (!contractForm.buyer_name || !contractForm.seller_name || !contractForm.property_title) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const newContract: Contract = {
        id: Date.now().toString(),
        deal_id: dealId,
        template_name: contractForm.template_name,
        property_data: {
          title: contractForm.property_title,
          address: contractForm.property_address,
          area: parseFloat(contractForm.property_area) || 0,
          bedrooms: parseInt(contractForm.property_bedrooms) || 0,
          bathrooms: parseInt(contractForm.property_bathrooms) || 0,
          parking: parseInt(contractForm.property_parking) || 0,
          price: parseValueInput(contractForm.property_price),
          reference_code: contractForm.property_reference
        },
        buyer_data: {
          name: contractForm.buyer_name,
          email: contractForm.buyer_email,
          phone: contractForm.buyer_phone,
          cpf: contractForm.buyer_cpf,
          address: contractForm.buyer_address
        },
        seller_data: {
          name: contractForm.seller_name,
          email: contractForm.seller_email,
          phone: contractForm.seller_phone,
          cpf: contractForm.seller_cpf,
          address: contractForm.seller_address
        },
        contract_terms: {
          sale_price: parseValueInput(contractForm.sale_price),
          down_payment: parseValueInput(contractForm.down_payment),
          financing_amount: parseValueInput(contractForm.financing_amount),
          payment_method: contractForm.payment_method,
          delivery_date: contractForm.delivery_date,
          special_conditions: contractForm.special_conditions,
          commission_buyer: parseFloat(contractForm.commission_buyer),
          commission_seller: parseFloat(contractForm.commission_seller)
        },
        signatures: [],
        status: 'draft',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString() // 30 days
      };

      setContracts(prev => [newContract, ...prev]);

      toast({
        title: "Contrato gerado!",
        description: "O contrato foi criado e está pronto para assinatura",
      });

      setIsCreateDialogOpen(false);
      // Reset form
      setContractForm({
        template_name: 'compra_venda',
        property_title: '',
        property_address: '',
        property_area: '',
        property_bedrooms: '',
        property_bathrooms: '',
        property_parking: '',
        property_price: '',
        property_reference: '',
        buyer_name: '',
        buyer_email: '',
        buyer_phone: '',
        buyer_cpf: '',
        buyer_address: '',
        seller_name: '',
        seller_email: '',
        seller_phone: '',
        seller_cpf: '',
        seller_address: '',
        sale_price: '',
        down_payment: '',
        financing_amount: '',
        payment_method: 'financiado',
        delivery_date: '',
        special_conditions: '',
        commission_buyer: '3',
        commission_seller: '3'
      });

    } catch (error) {
      console.error('Error generating contract:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar contrato",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signContract = async (contractId: string, signerType: string) => {
    try {
      const signature: Signature = {
        id: Date.now().toString(),
        signer_name: 'Usuário Atual', // Get from user context
        signer_email: user?.email || '',
        signer_type: signerType,
        signed_at: new Date().toISOString(),
        ip_address: '0.0.0.0', // Would get real IP in production
        device_info: navigator.userAgent
      };

      setContracts(prev => prev.map(contract =>
        contract.id === contractId
          ? { 
              ...contract, 
              signatures: [...contract.signatures, signature],
              status: contract.signatures.length === 3 ? 'signed' : 'partially_signed'
            }
          : contract
      ));

      toast({
        title: "Assinatura registrada!",
        description: `Contrato assinado como ${signerType}`,
      });

    } catch (error) {
      console.error('Error signing contract:', error);
      toast({
        title: "Erro",
        description: "Erro ao assinar contrato",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Rascunho</Badge>;
      case 'sent':
        return <Badge className="bg-blue-500">Enviado</Badge>;
      case 'partially_signed':
        return <Badge className="bg-yellow-500">Parcialmente Assinado</Badge>;
      case 'signed':
        return <Badge className="bg-green-500">Assinado</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSignatureProgress = (contract: Contract) => {
    const totalSigners = 4; // buyer, seller, broker_buyer, broker_seller
    const signedCount = contract.signatures.length;
    return { signed: signedCount, total: totalSigners };
  };

  const hasSignedAs = (contract: Contract, signerType: string) => {
    return contract.signatures.some(sig => sig.signer_type === signerType && sig.signer_email === user?.email);
  };

  const canSign = (contract: Contract, signerType: string) => {
    return contract.status !== 'expired' && !hasSignedAs(contract, signerType);
  };

  return (
    <div className="space-y-6">
      {/* Create Contract Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Contratos Virtuais</h2>
          <p className="text-muted-foreground">Sistema de contratos 100% digitais</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-brand-secondary">
              <FileText className="h-4 w-4 mr-2" />
              Novo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gerar Novo Contrato</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Template Selection */}
              <div>
                <Label htmlFor="template">Tipo de Contrato</Label>
                <Select value={contractForm.template_name} onValueChange={(value) => setContractForm({...contractForm, template_name: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compra_venda">Compra e Venda</SelectItem>
                    <SelectItem value="locacao">Locação</SelectItem>
                    <SelectItem value="cessao">Cessão de Direitos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Property Data */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5" />
                  Dados do Imóvel
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="property_title">Título do Imóvel *</Label>
                    <Input
                      id="property_title"
                      value={contractForm.property_title}
                      onChange={(e) => setContractForm({...contractForm, property_title: e.target.value})}
                      placeholder="Apartamento 3 quartos Vila Madalena"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="property_address">Endereço Completo *</Label>
                    <Input
                      id="property_address"
                      value={contractForm.property_address}
                      onChange={(e) => setContractForm({...contractForm, property_address: e.target.value})}
                      placeholder="Rua das Flores, 123 - Vila Madalena, São Paulo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="property_area">Área (m²)</Label>
                    <Input
                      id="property_area"
                      value={contractForm.property_area}
                      onChange={(e) => setContractForm({...contractForm, property_area: e.target.value})}
                      placeholder="85"
                    />
                  </div>
                  <div>
                    <Label htmlFor="property_price">Valor do Imóvel *</Label>
                    <Input
                      id="property_price"
                      value={contractForm.property_price}
                      onChange={(e) => setContractForm({...contractForm, property_price: e.target.value})}
                      placeholder="650.000,00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="property_bedrooms">Quartos</Label>
                    <Input
                      id="property_bedrooms"
                      value={contractForm.property_bedrooms}
                      onChange={(e) => setContractForm({...contractForm, property_bedrooms: e.target.value})}
                      placeholder="3"
                    />
                  </div>
                  <div>
                    <Label htmlFor="property_reference">Código de Referência</Label>
                    <Input
                      id="property_reference"
                      value={contractForm.property_reference}
                      onChange={(e) => setContractForm({...contractForm, property_reference: e.target.value})}
                      placeholder="CO00001"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Buyer Data */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <User className="h-5 w-5" />
                  Dados do Comprador
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="buyer_name">Nome Completo *</Label>
                    <Input
                      id="buyer_name"
                      value={contractForm.buyer_name}
                      onChange={(e) => setContractForm({...contractForm, buyer_name: e.target.value})}
                      placeholder="João Silva"
                    />
                  </div>
                  <div>
                    <Label htmlFor="buyer_cpf">CPF</Label>
                    <Input
                      id="buyer_cpf"
                      value={contractForm.buyer_cpf}
                      onChange={(e) => setContractForm({...contractForm, buyer_cpf: e.target.value})}
                      placeholder="123.456.789-00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="buyer_email">Email</Label>
                    <Input
                      id="buyer_email"
                      type="email"
                      value={contractForm.buyer_email}
                      onChange={(e) => setContractForm({...contractForm, buyer_email: e.target.value})}
                      placeholder="joao@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="buyer_phone">Telefone</Label>
                    <Input
                      id="buyer_phone"
                      value={contractForm.buyer_phone}
                      onChange={(e) => setContractForm({...contractForm, buyer_phone: e.target.value})}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="buyer_address">Endereço</Label>
                    <Input
                      id="buyer_address"
                      value={contractForm.buyer_address}
                      onChange={(e) => setContractForm({...contractForm, buyer_address: e.target.value})}
                      placeholder="Rua A, 456 - Bairro B, Cidade"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Seller Data */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <User className="h-5 w-5" />
                  Dados do Vendedor
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="seller_name">Nome Completo *</Label>
                    <Input
                      id="seller_name"
                      value={contractForm.seller_name}
                      onChange={(e) => setContractForm({...contractForm, seller_name: e.target.value})}
                      placeholder="Maria Santos"
                    />
                  </div>
                  <div>
                    <Label htmlFor="seller_cpf">CPF</Label>
                    <Input
                      id="seller_cpf"
                      value={contractForm.seller_cpf}
                      onChange={(e) => setContractForm({...contractForm, seller_cpf: e.target.value})}
                      placeholder="987.654.321-00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="seller_email">Email</Label>
                    <Input
                      id="seller_email"
                      type="email"
                      value={contractForm.seller_email}
                      onChange={(e) => setContractForm({...contractForm, seller_email: e.target.value})}
                      placeholder="maria@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="seller_phone">Telefone</Label>
                    <Input
                      id="seller_phone"
                      value={contractForm.seller_phone}
                      onChange={(e) => setContractForm({...contractForm, seller_phone: e.target.value})}
                      placeholder="(11) 88888-8888"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contract Terms */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <DollarSign className="h-5 w-5" />
                  Condições do Contrato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sale_price">Preço de Venda *</Label>
                    <Input
                      id="sale_price"
                      value={contractForm.sale_price}
                      onChange={(e) => setContractForm({...contractForm, sale_price: e.target.value})}
                      placeholder="650.000,00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_method">Forma de Pagamento</Label>
                    <Select value={contractForm.payment_method} onValueChange={(value) => setContractForm({...contractForm, payment_method: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vista">À Vista</SelectItem>
                        <SelectItem value="financiado">Financiado</SelectItem>
                        <SelectItem value="parcelado">Parcelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="down_payment">Entrada</Label>
                    <Input
                      id="down_payment"
                      value={contractForm.down_payment}
                      onChange={(e) => setContractForm({...contractForm, down_payment: e.target.value})}
                      placeholder="150.000,00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="delivery_date">Data de Entrega</Label>
                    <Input
                      id="delivery_date"
                      type="date"
                      value={contractForm.delivery_date}
                      onChange={(e) => setContractForm({...contractForm, delivery_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="commission_buyer">Comissão Comprador (%)</Label>
                    <Input
                      id="commission_buyer"
                      value={contractForm.commission_buyer}
                      onChange={(e) => setContractForm({...contractForm, commission_buyer: e.target.value})}
                      placeholder="3"
                    />
                  </div>
                  <div>
                    <Label htmlFor="commission_seller">Comissão Vendedor (%)</Label>
                    <Input
                      id="commission_seller"
                      value={contractForm.commission_seller}
                      onChange={(e) => setContractForm({...contractForm, commission_seller: e.target.value})}
                      placeholder="3"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="special_conditions">Condições Especiais</Label>
                    <Textarea
                      id="special_conditions"
                      value={contractForm.special_conditions}
                      onChange={(e) => setContractForm({...contractForm, special_conditions: e.target.value})}
                      placeholder="Condições especiais do contrato..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={generateContract} disabled={loading} className="w-full">
                {loading ? 'Gerando...' : 'Gerar Contrato'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Contracts List */}
      <div className="space-y-4">
        {contracts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum contrato encontrado</h3>
              <p className="text-muted-foreground">
                Crie seu primeiro contrato virtual para começar
              </p>
            </CardContent>
          </Card>
        ) : (
          contracts.map((contract) => {
            const progress = getSignatureProgress(contract);
            const isExpired = new Date(contract.expires_at) < new Date();
            
            return (
              <Card key={contract.id} className={`${isExpired ? 'opacity-60' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {contract.property_data.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {contract.buyer_data.name} ↔ {contract.seller_data.name}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(isExpired ? 'expired' : contract.status)}
                      <p className="text-xs text-muted-foreground mt-1">
                        Criado {formatDistanceToNow(new Date(contract.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Contract Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs">Valor do Contrato</Label>
                      <p className="font-semibold text-lg">{formatCurrency(contract.contract_terms.sale_price)}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Entrada</Label>
                      <p className="font-semibold">{formatCurrency(contract.contract_terms.down_payment)}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Forma de Pagamento</Label>
                      <p className="capitalize">{contract.contract_terms.payment_method}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Entrega</Label>
                      <p>{contract.contract_terms.delivery_date || 'Não definida'}</p>
                    </div>
                  </div>

                  {/* Signature Progress */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Assinaturas Digitais ({progress.signed}/{progress.total})
                      </h4>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${(progress.signed / progress.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {Math.round((progress.signed / progress.total) * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { type: 'buyer', label: 'Comprador' },
                        { type: 'seller', label: 'Vendedor' },
                        { type: 'broker_buyer', label: 'Corretor Comprador' },
                        { type: 'broker_seller', label: 'Corretor Vendedor' }
                      ].map((signer) => {
                        const hasSigned = hasSignedAs(contract, signer.type);
                        const canSignNow = canSign(contract, signer.type);
                        
                        return (
                          <div key={signer.type} className="flex items-center gap-2 p-2 border rounded-lg">
                            {hasSigned ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : canSignNow ? (
                              <Clock className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                            <div className="text-xs">
                              <p className="font-medium">{signer.label}</p>
                              <p className="text-muted-foreground">
                                {hasSigned ? 'Assinado' : canSignNow ? 'Pendente' : 'Expirado'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button variant="outline" size="sm">
                      <Download className="h-3 w-3 mr-1" />
                      Download PDF
                    </Button>
                    
                    {canSign(contract, 'broker_buyer') && (
                      <Button 
                        size="sm"
                        onClick={() => signContract(contract.id, 'broker_buyer')}
                      >
                        <Pen className="h-3 w-3 mr-1" />
                        Assinar como Corretor
                      </Button>
                    )}
                    
                    <Button variant="secondary" size="sm">
                      <FileText className="h-3 w-3 mr-1" />
                      Ver Detalhes
                    </Button>
                  </div>

                  {isExpired && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Este contrato expirou em {formatDistanceToNow(new Date(contract.expires_at), { locale: ptBR })}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}