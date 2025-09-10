import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Download, Upload } from 'lucide-react';

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

export default function XMLImportExport() {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">Você precisa estar logado para importar/exportar imóveis.</p>
      </div>
    );
  }

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
          .from('conectaios_properties')
          .insert({
            user_id: user.id,
            titulo: property.titulo,
            descricao: property.descricao,
            valor: property.valor,
            area: property.area,
            quartos: property.quartos,
            bathrooms: property.banheiros, // Map banheiros -> bathrooms
            parking_spots: property.vagas, // Map vagas -> parking_spots  
            address: property.endereco, // Map endereco -> address
            city: property.city,
            state: property.state,
            zipcode: property.cep, // Map cep -> zipcode
            property_type: property.property_type,
            listing_type: property.transaction_type, // Map transaction_type -> listing_type
            fotos: property.photos || [], // Map photos -> fotos
            visibility: 'public_site',
            is_public: true
          });

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
      const { data: properties, error } = await supabase
        .from('conectaios_properties')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_public', true);

      if (error) {
        throw new Error('Erro ao buscar propriedades');
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

  return (
    <div className="space-y-4">
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
                {isImporting ? 'Importando...' : 'Importar XML'}
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
      
      <p className="text-sm text-muted-foreground">
        Importe imóveis de arquivo XML ou exporte seus imóveis para XML (compatível com OLX e outras plataformas)
      </p>
    </div>
  );
}