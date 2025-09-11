import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Save, Key, Lock, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SecuritySettings() {
  const [settings, setSettings] = useState({
    twoFactorRequired: false,
    passwordMinLength: '8',
    passwordRequireSpecial: true,
    passwordRequireNumbers: true,
    passwordRequireUppercase: true,
    sessionTimeout: '24',
    maxLoginAttempts: '5',
    lockoutDuration: '30',
    ipWhitelist: '',
    corsOrigins: 'https://conectaios.com.br',
    encryptionLevel: 'AES-256',
    sslRequired: true,
    auditLogging: true,
    suspiciousActivityDetection: true
  });

  const handleSave = () => {
    toast.success("Configurações de segurança salvas!");
  };

  const handleChange = (field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateApiKey = () => {
    const newKey = 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    toast.success("Nova chave API gerada!");
    console.log("Nova chave API:", newKey);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configurações de Segurança
          </CardTitle>
          <CardDescription>
            Configure políticas de segurança e autenticação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Autenticação */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Autenticação
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Autenticação de Dois Fatores</Label>
                <p className="text-sm text-muted-foreground">
                  Exigir 2FA para todos os usuários admin
                </p>
              </div>
              <Switch
                checked={settings.twoFactorRequired}
                onCheckedChange={(checked) => handleChange('twoFactorRequired', checked)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Timeout de Sessão (horas)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleChange('sessionTimeout', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">Max Tentativas de Login</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => handleChange('maxLoginAttempts', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Políticas de Senha */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Key className="h-4 w-4" />
              Políticas de Senha
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="passwordMinLength">Comprimento Mínimo</Label>
                <Input
                  id="passwordMinLength"
                  type="number"
                  value={settings.passwordMinLength}
                  onChange={(e) => handleChange('passwordMinLength', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lockoutDuration">Duração do Bloqueio (min)</Label>
                <Input
                  id="lockoutDuration"
                  type="number"
                  value={settings.lockoutDuration}
                  onChange={(e) => handleChange('lockoutDuration', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Exigir Caracteres Especiais</Label>
                <Switch
                  checked={settings.passwordRequireSpecial}
                  onCheckedChange={(checked) => handleChange('passwordRequireSpecial', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Exigir Números</Label>
                <Switch
                  checked={settings.passwordRequireNumbers}
                  onCheckedChange={(checked) => handleChange('passwordRequireNumbers', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Exigir Maiúsculas</Label>
                <Switch
                  checked={settings.passwordRequireUppercase}
                  onCheckedChange={(checked) => handleChange('passwordRequireUppercase', checked)}
                />
              </div>
            </div>
          </div>

          {/* Configurações de Rede */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Configurações de Rede
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ipWhitelist">IPs Permitidos (opcional)</Label>
                <Input
                  id="ipWhitelist"
                  placeholder="192.168.1.1, 10.0.0.1"
                  value={settings.ipWhitelist}
                  onChange={(e) => handleChange('ipWhitelist', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Deixe vazio para permitir todos os IPs
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="corsOrigins">Origens CORS Permitidas</Label>
                <Input
                  id="corsOrigins"
                  value={settings.corsOrigins}
                  onChange={(e) => handleChange('corsOrigins', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="encryptionLevel">Nível de Criptografia</Label>
                <Select
                  value={settings.encryptionLevel}
                  onValueChange={(value) => handleChange('encryptionLevel', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AES-128">AES-128</SelectItem>
                    <SelectItem value="AES-256">AES-256</SelectItem>
                    <SelectItem value="ChaCha20">ChaCha20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Monitoramento */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Monitoramento</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SSL/TLS Obrigatório</Label>
                  <p className="text-sm text-muted-foreground">
                    Redirecionar HTTP para HTTPS
                  </p>
                </div>
                <Switch
                  checked={settings.sslRequired}
                  onCheckedChange={(checked) => handleChange('sslRequired', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Log de Auditoria</Label>
                  <p className="text-sm text-muted-foreground">
                    Registrar todas as ações administrativas
                  </p>
                </div>
                <Switch
                  checked={settings.auditLogging}
                  onCheckedChange={(checked) => handleChange('auditLogging', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Detecção de Atividade Suspeita</Label>
                  <p className="text-sm text-muted-foreground">
                    Alertar sobre comportamentos anômalos
                  </p>
                </div>
                <Switch
                  checked={settings.suspiciousActivityDetection}
                  onCheckedChange={(checked) => handleChange('suspiciousActivityDetection', checked)}
                />
              </div>
            </div>
          </div>

          {/* Chaves API */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Chaves API</h3>
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <p className="font-medium">Chave de Administração</p>
                <p className="text-sm text-muted-foreground">sk_admin_••••••••••••••••</p>
              </div>
              <Button variant="outline" onClick={generateApiKey}>
                Gerar Nova Chave
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}