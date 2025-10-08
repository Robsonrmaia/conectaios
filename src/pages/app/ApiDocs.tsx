import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Key, BookOpen, Code, Webhook } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useBroker } from '@/hooks/useBroker';

export default function ApiDocs() {
  const { user } = useAuth();
  const { broker } = useBroker();
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const apiKey = broker?.referral_code || 'SEU_API_KEY_AQUI';
  const baseUrl = 'https://paawojkqrggnuvpnnwrc.supabase.co/functions/v1/private-api';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(label);
    toast({ title: 'Copiado!', description: `${label} copiado para área de transferência` });
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const endpoints = [
    {
      method: 'GET',
      path: '/properties',
      description: 'Lista todos os imóveis do corretor',
      params: '?page=1&limit=50',
      response: `{
  "properties": [
    {
      "id": "uuid",
      "title": "Apartamento 3 quartos",
      "price": 450000,
      "city": "Ilhéus",
      "bedrooms": 3,
      "bathrooms": 2
    }
  ],
  "total": 10,
  "page": 1
}`
    },
    {
      method: 'GET',
      path: '/properties/:id',
      description: 'Detalhes de um imóvel específico',
      params: '',
      response: `{
  "id": "uuid",
  "title": "Apartamento 3 quartos",
  "description": "Lindo apartamento...",
  "price": 450000,
  "images": ["url1", "url2"]
}`
    },
    {
      method: 'POST',
      path: '/properties',
      description: 'Criar novo imóvel',
      params: '',
      body: `{
  "title": "Casa na praia",
  "price": 850000,
  "city": "Ilhéus",
  "bedrooms": 4,
  "bathrooms": 3,
  "description": "Linda casa..."
}`,
      response: `{
  "id": "uuid",
  "title": "Casa na praia",
  "created_at": "2025-10-08T..."
}`
    },
    {
      method: 'GET',
      path: '/clients',
      description: 'Lista todos os clientes do CRM',
      params: '?page=1&limit=50',
      response: `{
  "clients": [
    {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@email.com",
      "phone": "(73) 99999-9999"
    }
  ]
}`
    },
    {
      method: 'POST',
      path: '/clients',
      description: 'Criar novo cliente no CRM',
      params: '',
      body: `{
  "name": "Maria Santos",
  "email": "maria@email.com",
  "phone": "(73) 98888-8888",
  "budget_min": 300000,
  "budget_max": 500000
}`,
      response: `{
  "id": "uuid",
  "name": "Maria Santos",
  "created_at": "2025-10-08T..."
}`
    },
    {
      method: 'GET',
      path: '/analytics',
      description: 'Estatísticas e métricas',
      params: '',
      response: `{
  "properties_count": 25,
  "clients_count": 48,
  "deals_count": 5,
  "total_value": 3500000
}`
    }
  ];

  const codeExamples = {
    javascript: `// Node.js / JavaScript
const apiKey = '${apiKey}';
const baseUrl = '${baseUrl}';

async function getProperties() {
  const response = await fetch(\`\${baseUrl}/properties\`, {
    headers: {
      'Authorization': \`Bearer \${apiKey}\`,
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  return data;
}

// Criar novo imóvel
async function createProperty(propertyData) {
  const response = await fetch(\`\${baseUrl}/properties\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${apiKey}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(propertyData)
  });
  return await response.json();
}`,
    python: `# Python
import requests

api_key = '${apiKey}'
base_url = '${baseUrl}'

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

# Listar imóveis
response = requests.get(f'{base_url}/properties', headers=headers)
properties = response.json()

# Criar novo imóvel
property_data = {
    'title': 'Casa na praia',
    'price': 850000,
    'city': 'Ilhéus'
}
response = requests.post(f'{base_url}/properties', headers=headers, json=property_data)
new_property = response.json()`,
    php: `<?php
// PHP
$apiKey = '${apiKey}';
$baseUrl = '${baseUrl}';

$headers = [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
];

// Listar imóveis
$ch = curl_init($baseUrl . '/properties');
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$properties = json_decode($response, true);

// Criar novo imóvel
$propertyData = [
    'title' => 'Casa na praia',
    'price' => 850000,
    'city' => 'Ilhéus'
];
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($propertyData));
$response = curl_exec($ch);
curl_close($ch);
?>`
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Documentação da API</h1>
        <p className="text-muted-foreground">
          Integre seus sistemas com a plataforma ConectaiOS usando nossa API REST
        </p>
      </div>

      {/* API Key Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Sua API Key
          </CardTitle>
          <CardDescription>
            Use esta chave para autenticar suas requisições
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value={apiKey} readOnly className="font-mono" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(apiKey, 'API Key')}
            >
              {copiedEndpoint === 'API Key' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="mt-4">
            <Label>Base URL:</Label>
            <code className="block mt-1 p-2 bg-muted rounded text-sm">{baseUrl}</code>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="endpoints" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="endpoints">
            <BookOpen className="h-4 w-4 mr-2" />
            Endpoints
          </TabsTrigger>
          <TabsTrigger value="examples">
            <Code className="h-4 w-4 mr-2" />
            Exemplos
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Webhook className="h-4 w-4 mr-2" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="space-y-4">
          {endpoints.map((endpoint, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={endpoint.method === 'GET' ? 'default' : 'secondary'}>
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm">{endpoint.path}{endpoint.params}</code>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(
                      `${baseUrl}${endpoint.path}${endpoint.params}`,
                      endpoint.path
                    )}
                  >
                    {copiedEndpoint === endpoint.path ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <CardDescription>{endpoint.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {endpoint.body && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Request Body:</Label>
                    <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-auto">
                      {endpoint.body}
                    </pre>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">Response:</Label>
                  <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-auto">
                    {endpoint.response}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <Tabs defaultValue="javascript">
            <TabsList>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="php">PHP</TabsTrigger>
            </TabsList>

            {Object.entries(codeExamples).map(([lang, code]) => (
              <TabsContent key={lang} value={lang}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="capitalize">{lang}</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(code, `Código ${lang}`)}
                      >
                        {copiedEndpoint === `Código ${lang}` ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-4 bg-muted rounded text-sm overflow-auto">
                      {code}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhooks (Em breve)</CardTitle>
              <CardDescription>
                Configure webhooks para receber notificações em tempo real sobre eventos na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded">
                <p className="text-sm mb-2"><strong>Eventos disponíveis:</strong></p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>property.created - Novo imóvel criado</li>
                  <li>property.updated - Imóvel atualizado</li>
                  <li>property.sold - Imóvel vendido</li>
                  <li>client.created - Novo cliente adicionado</li>
                  <li>deal.closed - Negócio fechado</li>
                </ul>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">Exemplo de payload:</Label>
                <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-auto">
{`{
  "event": "property.created",
  "timestamp": "2025-10-08T12:34:56Z",
  "data": {
    "id": "uuid",
    "title": "Casa na praia",
    "price": 850000
  }
}`}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rate Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Plano API Empresarial:</strong> 10.000 requisições/dia</p>
                <p><strong>Plano Premium:</strong> 1.000 requisições/dia</p>
                <p><strong>Outros planos:</strong> 100 requisições/dia</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
