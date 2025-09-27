import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Key, Code, Database, BarChart } from 'lucide-react';
import { usePrivateAPI } from '@/hooks/usePrivateAPI';
import { useBroker } from '@/hooks/useBroker';
import { toast } from 'sonner';

export const APIDocumentation = () => {
  const [docs, setDocs] = useState<any>(null);
  const [testEndpoint, setTestEndpoint] = useState('/properties');
  const [testResponse, setTestResponse] = useState<any>(null);
  const { getDocs, loading, error } = usePrivateAPI();
  const { broker } = useBroker();

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const response = await getDocs();
        setDocs(response);
      } catch (err) {
        console.error('Failed to fetch docs:', err);
      }
    };

    if (broker?.referral_code) {
      fetchDocs();
    }
  }, [broker?.referral_code, getDocs]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  const testAPI = async () => {
    try {
      const response = await fetch(
        `https://paawojkqrggnuvpnnwrc.supabase.co/functions/v1/private-api${testEndpoint}`,
        {
          headers: {
            'x-api-key': broker?.referral_code || '',
            'Content-Type': 'application/json'
          }
        }
      );
      const data = await response.json();
      setTestResponse({ status: response.status, data });
      toast.success('Teste realizado com sucesso!');
    } catch (err) {
      setTestResponse({ error: err instanceof Error ? err.message : 'Erro desconhecido' });
      toast.error('Erro ao testar API');
    }
  };

  const baseUrl = 'https://paawojkqrggnuvpnnwrc.supabase.co/functions/v1/private-api';

  if (!broker?.referral_code) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Não Disponível
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Você precisa ter um perfil de corretor ativo para acessar a API.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            ConectAIOS Private API
          </CardTitle>
          <CardDescription>
            API privada para integrar seus dados de imóveis e CRM com ferramentas externas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="api-key">Sua API Key</Label>
              <div className="flex gap-2 mt-1">
                <Input 
                  id="api-key"
                  value={broker.referral_code} 
                  readOnly 
                  type="password"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => copyToClipboard(broker.referral_code)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label>Base URL</Label>
              <div className="flex gap-2 mt-1">
                <Input value={baseUrl} readOnly className="font-mono text-xs" />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => copyToClipboard(baseUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="endpoints" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="examples">Exemplos</TabsTrigger>
          <TabsTrigger value="test">Testar API</TabsTrigger>
          <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Imóveis (Properties)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <code className="text-sm">GET /properties</code>
                    <Badge variant="secondary">Listar</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <code className="text-sm">GET /properties/:id</code>
                    <Badge variant="secondary">Obter</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <code className="text-sm">POST /properties</code>
                    <Badge variant="default">Criar</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <code className="text-sm">PUT /properties/:id</code>
                    <Badge variant="outline">Atualizar</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <code className="text-sm">DELETE /properties/:id</code>
                    <Badge variant="destructive">Excluir</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  CRM (Clientes)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <code className="text-sm">GET /clients</code>
                    <Badge variant="secondary">Listar</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <code className="text-sm">GET /clients/:id</code>
                    <Badge variant="secondary">Obter</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <code className="text-sm">POST /clients</code>
                    <Badge variant="default">Criar</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <code className="text-sm">PUT /clients/:id</code>
                    <Badge variant="outline">Atualizar</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <code className="text-sm">DELETE /clients/:id</code>
                    <Badge variant="destructive">Excluir</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-4 w-4" />
                  Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <code className="text-sm">GET /analytics?type=properties</code>
                    <Badge variant="secondary">Imóveis</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <code className="text-sm">GET /analytics?type=clients</code>
                    <Badge variant="secondary">CRM</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documentação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <code className="text-sm">GET /docs</code>
                  <Badge variant="secondary">Docs</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exemplos de Uso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>cURL - Listar Imóveis</Label>
                <div className="bg-muted p-3 rounded-md mt-1">
                  <code className="text-sm">
                    {`curl -H "x-api-key: ${broker.referral_code}" \\
     "${baseUrl}/properties"`}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-2"
                    onClick={() => copyToClipboard(`curl -H "x-api-key: ${broker.referral_code}" "${baseUrl}/properties"`)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>JavaScript - Fetch API</Label>
                <div className="bg-muted p-3 rounded-md mt-1">
                  <code className="text-sm whitespace-pre">
{`fetch('${baseUrl}/properties', {
  headers: {
    'x-api-key': '${broker.referral_code}',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))`}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-2"
                    onClick={() => copyToClipboard(`fetch('${baseUrl}/properties', {
  headers: {
    'x-api-key': '${broker.referral_code}',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))`)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Python - Requests</Label>
                <div className="bg-muted p-3 rounded-md mt-1">
                  <code className="text-sm whitespace-pre">
{`import requests

headers = {
    'x-api-key': '${broker.referral_code}',
    'Content-Type': 'application/json'
}

response = requests.get('${baseUrl}/properties', headers=headers)
data = response.json()
print(data)`}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-2"
                    onClick={() => copyToClipboard(`import requests

headers = {
    'x-api-key': '${broker.referral_code}',
    'Content-Type': 'application/json'
}

response = requests.get('${baseUrl}/properties', headers=headers)
data = response.json()
print(data)`)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Testar API</CardTitle>
              <CardDescription>
                Teste os endpoints da API diretamente aqui
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  value={testEndpoint}
                  onChange={(e) => setTestEndpoint(e.target.value)}
                  placeholder="/properties"
                />
                <Button onClick={testAPI} disabled={loading}>
                  {loading ? 'Testando...' : 'Testar'}
                </Button>
              </div>

              {testResponse && (
                <div className="bg-muted p-4 rounded-md">
                  <Label>Resposta</Label>
                  <pre className="text-xs mt-2 whitespace-pre-wrap">
                    {JSON.stringify(testResponse, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rate-limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rate Limits por Plano</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">Free</div>
                    <div className="text-sm text-muted-foreground">Plano gratuito</div>
                  </div>
                  <Badge variant="outline">100 requests/hora</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">Premium</div>
                    <div className="text-sm text-muted-foreground">Plano premium</div>
                  </div>
                  <Badge variant="secondary">1.000 requests/hora</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">Elite</div>
                    <div className="text-sm text-muted-foreground">Plano elite</div>
                  </div>
                  <Badge variant="default">5.000 requests/hora</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default APIDocumentation;