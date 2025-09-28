import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBroker } from '@/hooks/useBroker';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Download, Upload, ExternalLink, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface Property {
  id: string;
  titulo: string;
  descricao: string;
  valor: number;
  area: number;
  quartos: number;
  banheiros: number;
  vagas: number;
  endereco: string;
  city: string;
  state: string;
  cep: string;
  property_type: string;
  transaction_type: string;
  photos?: string[];
}

interface ImportResult {
  fetched_count: number;
  created_count: number;
  updated_count: number;
  ignored_count: number;
  errors: string[];
  dryRun: boolean;
  owner?: string;
  siteId?: string;
  published?: boolean;
}

interface Broker {
  id: string;
  user_id: string;
  name: string;
  email: string;
}

export default function XMLImportExport() {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImportingFromUrl, setIsImportingFromUrl] = useState(false);
  const [xmlUrl, setXmlUrl] = useState('');
  const [importFormat, setImportFormat] = useState<'cnm' | 'vrsync'>('cnm');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<string>('');
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const { user } = useAuth();
  const { broker } = useBroker();
  const { isAdmin } = useAdminAuth();

  // Deduplication helper
  const uniqueByEmail = (brokers: Broker[]) => {
    const map = new Map<string, Broker>();
    for (const broker of brokers) {
      const key = (broker.email ?? '').toLowerCase();
      if (!key) continue;
      if (!map.has(key)) map.set(key, broker);
    }
    return Array.from(map.values());
  };

  // Load brokers if admin
  useEffect(() => {
    const loadBrokers = async () => {
      if (!isAdmin) {
        // If not admin, set current user as selected owner
        if (user?.id) {
          setSelectedOwner(user.id);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('conectaios_brokers')
          .select('id, user_id, name, email')
          .eq('status', 'active');

        if (error) throw error;
        
        // Deduplicate and sort
        const uniqueBrokers = uniqueByEmail(data || []);
        const sortedBrokers = uniqueBrokers.sort((a, b) =>
          (a.name ?? a.email ?? '').localeCompare(b.name ?? b.email ?? '')
        );
        
        setBrokers(sortedBrokers);
      } catch (error) {
        console.error('Error loading brokers:', error);
        toast.error('Erro ao carregar lista de corretores');
      }
    };

    loadBrokers();
  }, [isAdmin, user?.id]);

  if (!user) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">Você precisa estar logado para importar/exportar imóveis.</p>
      </div>
    );
  }

  const handleImportFromUrl = async () => {
    if (!xmlUrl.trim()) {
      toast.error('Por favor, informe a URL do XML');
      return;
    }

    // Validate owner selection
    const ownerId = isAdmin ? selectedOwner : user.id;
    if (!ownerId) {
      toast.error(isAdmin ? 'Por favor, selecione um corretor' : 'Usuário não identificado');
      return;
    }

    setIsImportingFromUrl(true);
    setImportResult(null);

    try {
      const functionName = importFormat === 'cnm' ? 'import-cnm' : 'import-vrsync';
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { 
          url: xmlUrl.trim(),
          user_id: ownerId,
          publish: '0' // Always import as private initially
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na importação');
      }

      setImportResult(data);
      
      if (data.errors && data.errors.length > 0) {
        toast.warning(`Importação concluída com ${data.errors.length} erro(s)`);
      } else {
        toast.success(`Importação concluída com sucesso! ${data.created_count} criados, ${data.updated_count} atualizados.`);
      }

    } catch (error) {
      console.error('Erro na importação:', error);
      toast.error('Erro ao importar do XML: ' + (error as Error).message);
    } finally {
      setIsImportingFromUrl(false);
    }
  };

  const handleImportXML = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');
      
      if (xml.getElementsByTagName('parsererror').length > 0) {
        throw new Error('Arquivo XML inválido');
      }

      const properties = parseXMLToProperties(xml);
      
      if (properties.length === 0) {
        throw new Error('Nenhum imóvel encontrado no arquivo XML');
      }
      
      for (const property of properties) {
        const { error } = await supabase
          .from('imoveis')
          .insert({
            owner_id: user.id,
            title: property.titulo,
            description: property.descricao,
            price: property.valor,
            city: (property as any).city || '',
            purpose: 'sale',
            visibility: 'private'
          } as any);

        if (error) {
          console.error('Erro ao inserir propriedade:', error);
          toast.error(`Erro ao inserir imóvel: ${property.titulo}`);
        }
      }

      toast.success(`${properties.length} imóveis importados com sucesso!`);
      event.target.value = '';
      
    } catch (error) {
      console.error('Erro na importação:', error);
      toast.error('Erro ao importar arquivo XML');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportXML = async () => {
    setIsExporting(true);
    
    try {
      const { data: properties } = await supabase
        .from('imoveis')
        .select('*')
        .eq('owner_id', user.id)
        .eq('is_public', true) as any;

      if (!properties || properties.length === 0) {
        toast.error('Nenhum imóvel encontrado para exportar');
        return;
      }

      if (!properties || properties.length === 0) {
        toast.error('Nenhum imóvel público encontrado para exportar');
        return;
      }

      console.log(`Exportando ${properties.length} imóveis`);
      
      const xml = generateXMLFromProperties(properties);
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `imoveis_${new Date().toISOString().split('T')[0]}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${properties.length} imóveis exportados com sucesso!`);
      
    } catch (error) {
      console.error('Erro na exportação:', error);
      toast.error('Erro ao exportar XML');
    } finally {
      setIsExporting(false);
    }
  };

  const parseXMLToProperties = (xml: Document): Property[] => {
    const properties: Property[] = [];
    
    // Detectar formato VivaReal
    const isVivaRealFormat = xml.getElementsByTagName('ListingDataFeed').length > 0;
    
    if (isVivaRealFormat) {
      console.log('Detectado formato VivaReal');
      return parseVivaRealXML(xml);
    }
    
    // Formato genérico/legado
    console.log('Usando parser genérico');
    const listings = xml.getElementsByTagName('Listing') || xml.getElementsByTagName('imovel');
    
    Array.from(listings).forEach((listing, index) => {
      const getTagValue = (tagName: string) => {
        const element = listing.getElementsByTagName(tagName)[0];
        return element?.textContent?.trim() || '';
      };

      const photos = Array.from(listing.getElementsByTagName('Photo') || listing.getElementsByTagName('foto'))
        .map(photo => photo.textContent?.trim())
        .filter(Boolean);

      properties.push({
        id: `import_${index}`,
        titulo: getTagValue('Title') || getTagValue('titulo') || 'Imóvel Importado',
        descricao: getTagValue('Description') || getTagValue('descricao') || '',
        valor: parseFloat(getTagValue('Price') || getTagValue('valor') || '0'),
        area: parseFloat(getTagValue('Area') || getTagValue('area') || '0'),
        quartos: parseInt(getTagValue('Bedrooms') || getTagValue('quartos') || '0'),
        banheiros: parseInt(getTagValue('Bathrooms') || getTagValue('banheiros') || '0'),
        vagas: parseInt(getTagValue('Garages') || getTagValue('vagas') || '0'),
        endereco: getTagValue('Address') || getTagValue('endereco') || '',
        city: getTagValue('City') || getTagValue('cidade') || '',
        state: getTagValue('State') || getTagValue('estado') || '',
        cep: getTagValue('ZipCode') || getTagValue('cep') || '',
        property_type: getTagValue('PropertyType') || getTagValue('tipo') || 'apartamento',
        transaction_type: getTagValue('TransactionType') || getTagValue('transacao') || 'venda',
        photos
      });
    });

    return properties;
  };

  const parseVivaRealXML = (xml: Document): Property[] => {
    const properties: Property[] = [];
    const listings = xml.getElementsByTagName('Listing');
    
    console.log(`Encontrados ${listings.length} imóveis no XML VivaReal`);
    
    Array.from(listings).forEach((listing, index) => {
      const getTagValue = (tagName: string) => {
        const element = listing.getElementsByTagName(tagName)[0];
        return element?.textContent?.trim() || '';
      };

      // Extrair informações básicas
      const titulo = getTagValue('Title') || 'Imóvel Importado';
      const listingId = getTagValue('ListingID');
      const transactionType = getTagValue('TransactionType');
      const description = getTagValue('Description') || '';
      
      console.log(`Processando imóvel ${index + 1}: ${titulo}`);

      // Processar imagens da tag Media
      const mediaItems = listing.getElementsByTagName('Item');
      const photos = Array.from(mediaItems)
        .filter(item => item.getAttribute('medium') === 'image')
        .map(item => item.textContent?.trim())
        .filter(Boolean);
      
      console.log(`Encontradas ${photos.length} fotos para o imóvel`);

      // Extrair detalhes do imóvel usando regex na descrição e título
      const extractNumber = (text: string, pattern: RegExp): number => {
        const match = text.match(pattern);
        return match ? parseFloat(match[1].replace(/[^\d,]/g, '').replace(',', '.')) : 0;
      };

      // Tentar extrair informações do DetailViewUrl, Title ou Description
      const fullText = `${titulo} ${description}`.toLowerCase();
      
      const quartos = extractNumber(fullText, /(\d+)\s*(?:quartos?|dormitórios?|suítes?)/i) || 
                     extractNumber(fullText, /(\d+)\s*(?:rooms?|bedrooms?)/i);
      
      const banheiros = extractNumber(fullText, /(\d+)\s*(?:banheiros?|wc)/i) || 
                       extractNumber(fullText, /(\d+)\s*(?:bathrooms?)/i);
      
      const vagas = extractNumber(fullText, /(\d+)\s*(?:vagas?|garagens?)/i) || 
                   extractNumber(fullText, /(\d+)\s*(?:parking|garage)/i);
      
      const area = extractNumber(fullText, /(\d+(?:,\d+)?)\s*(?:m²|m2|metros)/i);
      
      // Extrair valor se disponível na descrição
      const valor = extractNumber(fullText, /r\$\s*(\d+(?:\.\d{3})*(?:,\d{2})?)/i) || 0;

      // Extrair localização do título
      const locationMatch = titulo.match(/(?:no bairro|em)\s+([^-]+)\s*-\s*([^,]+),?\s*([A-Z]{2})?/i);
      const neighborhood = locationMatch ? locationMatch[1]?.trim() : '';
      const city = locationMatch ? locationMatch[2]?.trim() : '';
      const state = locationMatch ? locationMatch[3]?.trim() : '';

      // Determinar tipo de propriedade
      let propertyType = 'apartamento';
      if (/casa|sobrado|residência/i.test(fullText)) propertyType = 'casa';
      else if (/terreno|lote/i.test(fullText)) propertyType = 'terreno';
      else if (/comercial|loja|sala/i.test(fullText)) propertyType = 'comercial';

      // Converter tipo de transação
      let transactionTypeConverted = 'venda';
      if (transactionType?.toLowerCase().includes('rent') || /aluguel|locação/i.test(fullText)) {
        transactionTypeConverted = 'aluguel';
      }

      const property: Property = {
        id: `vivareal_${listingId || index}`,
        titulo,
        descricao: description,
        valor,
        area,
        quartos,
        banheiros,
        vagas,
        endereco: neighborhood || '',
        city: city || '',
        state: state || '',
        cep: '',
        property_type: propertyType,
        transaction_type: transactionTypeConverted,
        photos
      };

      console.log('Dados extraídos:', {
        titulo: property.titulo,
        valor: property.valor,
        area: property.area,
        quartos: property.quartos,
        banheiros: property.banheiros,
        vagas: property.vagas,
        city: property.city,
        photos: property.photos.length
      });

      properties.push(property);
    });

    return properties;
  };

  const generateXMLFromProperties = (properties: any[]): string => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<Listings>\n';
    
    properties.forEach(property => {
      xml += '  <Listing>\n';
      xml += `    <ListingID>${property.id}</ListingID>\n`;
      xml += `    <Title><![CDATA[${property.titulo || ''}]]></Title>\n`;
      xml += `    <Description><![CDATA[${property.descricao || ''}]]></Description>\n`;
      xml += `    <Price>${property.valor || 0}</Price>\n`;
      xml += `    <Area>${property.area || 0}</Area>\n`;
      xml += `    <Bedrooms>${property.quartos || 0}</Bedrooms>\n`;
      xml += `    <Bathrooms>${property.bathrooms || 0}</Bathrooms>\n`;
      xml += `    <Garages>${property.parking_spots || 0}</Garages>\n`;
      xml += `    <Address><![CDATA[${property.address || ''}]]></Address>\n`;
      xml += `    <City><![CDATA[${property.city || ''}]]></City>\n`;
      xml += `    <State><![CDATA[${property.state || ''}]]></State>\n`;
      xml += `    <ZipCode>${property.zipcode || ''}</ZipCode>\n`;
      xml += `    <PropertyType>${property.property_type || 'apartamento'}</PropertyType>\n`;
      xml += `    <TransactionType>${property.listing_type || 'venda'}</TransactionType>\n`;
      xml += `    <Photos>\n`;
      
      if (property.fotos && Array.isArray(property.fotos)) {
        property.fotos.forEach((photo: string, index: number) => {
          xml += `      <Photo order="${index + 1}"><![CDATA[${photo}]]></Photo>\n`;
        });
      }
      
      xml += `    </Photos>\n`;
      xml += '  </Listing>\n';
    });
    
    xml += '</Listings>';
    return xml;
  };

  const ImportResultCard = ({ result }: { result: ImportResult }) => (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Resultado da Importação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{result.fetched_count}</div>
            <div className="text-sm text-muted-foreground">Encontrados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{result.created_count}</div>
            <div className="text-sm text-muted-foreground">Criados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{result.updated_count}</div>
            <div className="text-sm text-muted-foreground">Atualizados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{result.errors.length}</div>
            <div className="text-sm text-muted-foreground">Erros</div>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <Badge variant={result.published ? "default" : "secondary"}>
            {result.published ? "Publicados" : "Privados"}
          </Badge>
          <Badge variant="outline">
            {result.dryRun ? "Simulação" : "Importação Real"}
          </Badge>
        </div>

        {result.errors.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-600">Erros encontrados:</span>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <ul className="text-sm text-red-700 space-y-1">
                {result.errors.slice(0, 5).map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
                {result.errors.length > 5 && (
                  <li className="text-muted-foreground">
                    ... e mais {result.errors.length - 5} erro(s)
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* URL Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Importar de URL
          </CardTitle>
          <CardDescription>
            Cole a URL do XML (Chaves na Mão, OLX, VrSync) para importação automática
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Broker Selection for Admins */}
          {isAdmin && (
            <div>
              <Label htmlFor="owner-select">Corretor (obrigatório)</Label>
              <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um corretor" />
                </SelectTrigger>
                <SelectContent>
                  {brokers.map((broker) => (
                    <SelectItem key={broker.user_id} value={broker.user_id}>
                      {broker.name || '(sem nome)'} ({broker.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Info for non-admin users */}
          {!isAdmin && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-700">
                <strong>Info:</strong> Os imóveis serão importados diretamente para sua conta.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="xml-url">URL do XML</Label>
            <Input
              id="xml-url"
              type="url"
              placeholder="https://exemplo.com/feed.xml"
              value={xmlUrl}
              onChange={(e) => setXmlUrl(e.target.value)}
              disabled={isImportingFromUrl}
            />
          </div>

          <div>
            <Label htmlFor="import-format">Formato</Label>
            <Select value={importFormat} onValueChange={(value: 'cnm' | 'vrsync') => setImportFormat(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cnm">Chaves na Mão (CNM)</SelectItem>
                <SelectItem value="vrsync">VrSync / OLX</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleImportFromUrl}
            disabled={isImportingFromUrl || !xmlUrl.trim()}
            className="w-full"
          >
            {isImportingFromUrl ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Importar da URL
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Import Result */}
      {importResult && <ImportResultCard result={importResult} />}

      <Separator />

      {/* File Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Arquivo
          </CardTitle>
          <CardDescription>
            Faça upload de um arquivo XML local
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <Input
                type="file"
                accept=".xml"
                onChange={handleImportXML}
                disabled={isImporting}
                className="hidden"
                id="xml-import"
              />
              <label htmlFor="xml-import">
                <Button 
                  variant="outline" 
                  disabled={isImporting}
                  className="cursor-pointer"
                  asChild
                >
                  <span className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    {isImporting ? 'Importando...' : 'Selecionar Arquivo XML'}
                  </span>
                </Button>
              </label>
            </div>
            
            <Button 
              onClick={handleExportXML}
              disabled={isExporting}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Exportando...' : 'Exportar XML'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}