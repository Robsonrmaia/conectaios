import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Globe, ExternalLink, Check, AlertTriangle, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useMinisite } from '@/hooks/useMinisite';

export function DomainConfiguration() {
  const { config, updateConfig, saveConfig } = useMinisite();
  const [customDomain, setCustomDomain] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'failed' | null>(null);

  useEffect(() => {
    if (config?.config_data?.custom_domain) {
      setCustomDomain(config.config_data.custom_domain);
      setVerificationStatus(config.config_data.domain_verified ? 'verified' : 'pending');
    }
  }, [config]);

  const handleDomainSave = async () => {
    if (!customDomain.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um domínio válido.",
        variant: "destructive",
      });
      return;
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.([a-zA-Z]{2,})+$/;
    if (!domainRegex.test(customDomain)) {
      toast({
        title: "Domínio inválido",
        description: "Por favor, insira um domínio válido (ex: meusite.com).",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedConfigData = {
        ...config?.config_data,
        custom_domain: customDomain,
        domain_verified: false
      };

      await updateConfig({ config_data: updatedConfigData });
      await saveConfig();
      
      setVerificationStatus('pending');
      
      toast({
        title: "Domínio configurado!",
        description: "Agora você precisa configurar os registros DNS. Veja as instruções abaixo.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações do domínio.",
        variant: "destructive",
      });
    }
  };

  const verifyDomain = async () => {
    if (!customDomain) return;

    setIsVerifying(true);
    
    try {
      // Simulate DNS verification (in production, this would check actual DNS records)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, randomly succeed or fail
      const isVerified = Math.random() > 0.3;
      
      if (isVerified) {
        const updatedConfigData = {
          ...config?.config_data,
          domain_verified: true
        };
        
        await updateConfig({ config_data: updatedConfigData });
        await saveConfig();
        
        setVerificationStatus('verified');
        toast({
          title: "Domínio verificado!",
          description: "Seu domínio personalizado está ativo e funcionando.",
        });
      } else {
        setVerificationStatus('failed');
        toast({
          title: "Verificação falhou",
          description: "Não foi possível verificar as configurações DNS. Verifique os registros e tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setVerificationStatus('failed');
      toast({
        title: "Erro na verificação",
        description: "Erro ao verificar o domínio. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const removeDomain = async () => {
    try {
      const updatedConfigData = {
        ...config?.config_data,
        custom_domain: '',
        domain_verified: false
      };

      await updateConfig({ config_data: updatedConfigData });
      await saveConfig();
      
      setCustomDomain('');
      setVerificationStatus(null);
      
      toast({
        title: "Domínio removido",
        description: "O domínio personalizado foi removido com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover o domínio.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Domínio Personalizado
        </CardTitle>
        <CardDescription>
          Configure seu próprio domínio para o minisite (funcionalidade premium)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Domain Input */}
        <div className="space-y-2">
          <Label htmlFor="domain">Seu Domínio</Label>
          <div className="flex gap-2">
            <Input
              id="domain"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="meusite.com"
              className="flex-1"
            />
            <Button onClick={handleDomainSave} disabled={!customDomain.trim()}>
              Salvar
            </Button>
          </div>
        </div>

        {/* Current Status */}
        {customDomain && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="font-medium">{customDomain}</span>
              </div>
              <div className="flex items-center gap-2">
                {verificationStatus === 'verified' && (
                  <Badge variant="default" className="bg-green-500">
                    <Check className="h-3 w-3 mr-1" />
                    Verificado
                  </Badge>
                )}
                {verificationStatus === 'pending' && (
                  <Badge variant="secondary">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Pendente
                  </Badge>
                )}
                {verificationStatus === 'failed' && (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Falhou
                  </Badge>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={removeDomain}
                  className="text-destructive hover:text-destructive"
                >
                  Remover
                </Button>
              </div>
            </div>

            {/* DNS Instructions */}
            {verificationStatus !== 'verified' && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <p className="font-medium">Configure os seguintes registros DNS:</p>
                  <div className="bg-muted p-3 rounded font-mono text-sm">
                    <div>Tipo: A</div>
                    <div>Nome: @ (ou deixe em branco)</div>
                    <div>Valor: 185.158.133.1</div>
                    <div className="mt-2">Tipo: A</div>
                    <div>Nome: www</div>
                    <div>Valor: 185.158.133.1</div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Após configurar os registros DNS, clique em "Verificar Domínio" abaixo.
                    A propagação pode levar até 48 horas.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Verification Button */}
            {verificationStatus !== 'verified' && (
              <div className="flex gap-2">
                <Button 
                  onClick={verifyDomain} 
                  disabled={isVerifying}
                  className="flex-1"
                >
                  {isVerifying ? 'Verificando...' : 'Verificar Domínio'}
                </Button>
                <Button variant="outline" asChild>
                  <a 
                    href="https://docs.lovable.dev/tips-tricks/custom-domains" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    Ajuda
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            )}

            {/* Success Message */}
            {verificationStatus === 'verified' && (
              <Alert className="border-green-200 bg-green-50">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-1">
                    <p className="font-medium">Domínio verificado com sucesso!</p>
                    <div className="flex items-center gap-1">
                      <span>Acesse seu minisite em:</span>
                      <a 
                        href={`https://${customDomain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        https://{customDomain}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Info */}
        {!customDomain && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>Com um domínio personalizado, seus clientes podem acessar seu minisite através de:</p>
                <p className="font-mono text-sm bg-muted p-2 rounded">https://seudominio.com</p>
                <p className="text-sm">
                  Esta é uma funcionalidade premium. Você precisará de um plano pago para ativar domínios personalizados.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}