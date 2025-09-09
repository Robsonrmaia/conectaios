import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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
      
      for (const property of properties) {
        const { error } = await supabase
          .from('properties')
          .insert({
            titulo: property.titulo,
            descricao: property.descricao,
            valor: property.valor,
            area: property.area,
            quartos: property.quartos,
            banheiros: property.banheiros,
            vagas: property.vagas,
            endereco: property.endereco,
            city: property.city,
            state: property.state,
            cep: property.cep,
            property_type: property.property_type,
            transaction_type: property.transaction_type,
            photos: property.photos || []
          });

        if (error) {
          console.error('Erro ao inserir propriedade:', error);
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
        .from('properties')
        .select('*')
        .eq('is_public', true);

      if (error) {
        throw new Error('Erro ao buscar propriedades');
      }

      const xml = generateXMLFromProperties(properties || []);
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `imoveis_${new Date().toISOString().split('T')[0]}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('XML exportado com sucesso!');
      
    } catch (error) {
      console.error('Erro na exportação:', error);
      toast.error('Erro ao exportar XML');
    } finally {
      setIsExporting(false);
    }
  };

  const parseXMLToProperties = (xml: Document): Property[] => {
    const properties: Property[] = [];
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
      xml += `    <Bathrooms>${property.banheiros || 0}</Bathrooms>\n`;
      xml += `    <Garages>${property.vagas || 0}</Garages>\n`;
      xml += `    <Address><![CDATA[${property.endereco || ''}]]></Address>\n`;
      xml += `    <City><![CDATA[${property.city || ''}]]></City>\n`;
      xml += `    <State><![CDATA[${property.state || ''}]]></State>\n`;
      xml += `    <ZipCode>${property.cep || ''}</ZipCode>\n`;
      xml += `    <PropertyType>${property.property_type || 'apartamento'}</PropertyType>\n`;
      xml += `    <TransactionType>${property.transaction_type || 'venda'}</TransactionType>\n`;
      xml += `    <Photos>\n`;
      
      if (property.photos && Array.isArray(property.photos)) {
        property.photos.forEach((photo: string, index: number) => {
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