import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Save, Eye, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
}

const initialTemplates: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Boas-vindas',
    subject: 'Bem-vindo ao ConectaIOS, {{nome}}!',
    content: `Olá {{nome}},

Seja bem-vindo ao ConectaIOS! Estamos muito felizes em tê-lo conosco.

Sua conta foi criada com sucesso e você já pode começar a usar nossa plataforma.

Algumas dicas para começar:
- Complete seu perfil profissional
- Explore nossas ferramentas
- Configure sua minisite

Se precisar de ajuda, nossa equipe de suporte está sempre disponível.

Atenciosamente,
Equipe ConectaIOS`,
    variables: ['nome', 'email']
  },
  {
    id: 'reset_password',
    name: 'Redefinir Senha',
    subject: 'Redefinição de senha - ConectaIOS',
    content: `Olá {{nome}},

Recebemos uma solicitação para redefinir sua senha no ConectaIOS.

Clique no link abaixo para criar uma nova senha:
{{link_reset}}

Este link é válido por 1 hora.

Se você não solicitou esta redefinição, ignore este email.

Atenciosamente,
Equipe ConectaIOS`,
    variables: ['nome', 'email', 'link_reset']
  },
  {
    id: 'property_inquiry',
    name: 'Consulta de Imóvel',
    subject: 'Nova consulta sobre {{imovel_titulo}}',
    content: `Olá {{corretor_nome}},

Você recebeu uma nova consulta sobre o imóvel:

Imóvel: {{imovel_titulo}}
Código: {{imovel_codigo}}

Dados do interessado:
Nome: {{cliente_nome}}
Email: {{cliente_email}}
Telefone: {{cliente_telefone}}

Mensagem:
{{mensagem}}

Acesse sua dashboard para responder.

Atenciosamente,
Equipe ConectaIOS`,
    variables: ['corretor_nome', 'imovel_titulo', 'imovel_codigo', 'cliente_nome', 'cliente_email', 'cliente_telefone', 'mensagem']
  }
];

export default function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(initialTemplates);
  const [activeTemplate, setActiveTemplate] = useState<EmailTemplate>(templates[0]);

  const handleSave = () => {
    setTemplates(templates.map(t => 
      t.id === activeTemplate.id ? activeTemplate : t
    ));
    toast.success("Template salvo com sucesso!");
  };

  const handlePreview = () => {
    toast.info("Prévia do template enviada para o console");
    console.log("Preview do template:", activeTemplate);
  };

  const handleTestSend = () => {
    toast.success("Email de teste enviado!");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Templates de Email
          </CardTitle>
          <CardDescription>
            Configure os templates de email automático da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTemplate.id} onValueChange={(value) => {
            const template = templates.find(t => t.id === value);
            if (template) setActiveTemplate(template);
          }}>
            <TabsList className="grid w-full grid-cols-3">
              {templates.map((template) => (
                <TabsTrigger key={template.id} value={template.id}>
                  {template.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {templates.map((template) => (
              <TabsContent key={template.id} value={template.id} className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Assunto</Label>
                    <Input
                      id="subject"
                      value={activeTemplate.subject}
                      onChange={(e) => setActiveTemplate({
                        ...activeTemplate,
                        subject: e.target.value
                      })}
                      placeholder="Assunto do email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Conteúdo</Label>
                    <Textarea
                      id="content"
                      value={activeTemplate.content}
                      onChange={(e) => setActiveTemplate({
                        ...activeTemplate,
                        content: e.target.value
                      })}
                      rows={12}
                      placeholder="Conteúdo do email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Variáveis Disponíveis</Label>
                    <div className="flex flex-wrap gap-2">
                      {activeTemplate.variables.map((variable) => (
                        <code key={variable} className="px-2 py-1 bg-muted rounded text-sm">
                          {`{{${variable}}}`}
                        </code>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Use essas variáveis no assunto e conteúdo do email
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handlePreview}>
                        <Eye className="h-4 w-4 mr-2" />
                        Prévia
                      </Button>
                      <Button variant="outline" onClick={handleTestSend}>
                        <Send className="h-4 w-4 mr-2" />
                        Teste
                      </Button>
                    </div>
                    <Button onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}