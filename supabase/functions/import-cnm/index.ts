import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { XMLParser } from 'https://esm.sh/fast-xml-parser@4.3.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportResult {
  fetched_count: number;
  created_count: number;
  updated_count: number;
  ignored_count: number;
  errors: string[];
  dryRun: boolean;
}

interface PropertyData {
  external_id: string;
  source_portal: string;
  titulo: string;
  listing_type: string;
  property_type: string;
  valor: number;
  area: number;
  quartos: number;
  banheiros: number;
  vagas: number;
  descricao?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  fotos?: string[];
  raw_cnm?: any;
  imported_at: string;
  is_public?: boolean;
  visibility?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const dryRun = url.searchParams.get('dryRun') === '1';
    const urlParam = url.searchParams.get('url');
    
    let feedUrl = '';
    
    // Get URL from query param or request body
    if (urlParam) {
      feedUrl = urlParam;
    } else if (req.method === 'POST') {
      const body = await req.json();
      feedUrl = body.url;
    }
    
    if (!feedUrl) {
      throw new Error('URL parameter is required');
    }

    console.log(`🚀 Starting CNM import from: ${feedUrl}`);
    console.log(`📋 Dry run mode: ${dryRun}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get configuration
    const publishOnImport = Deno.env.get('PUBLISH_ON_IMPORT') === 'true';
    const safeMode = Deno.env.get('INTEGRATIONS_SAFE_MODE') === 'true';

    console.log(`⚙️ Publish on import: ${publishOnImport}`);
    console.log(`🛡️ Safe mode: ${safeMode}`);

    if (safeMode && !dryRun) {
      console.log('⚠️ Safe mode is enabled but not dry run - switching to dry run for safety');
    }

    const result: ImportResult = {
      fetched_count: 0,
      created_count: 0,
      updated_count: 0,
      ignored_count: 0,
      errors: [],
      dryRun: dryRun || safeMode
    };

    // Fetch XML feed
    console.log('📡 Fetching XML feed...');
    const response = await fetch(feedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    console.log(`📄 Fetched XML content: ${xmlText.length} characters`);

    // Parse XML (CNM is case-sensitive)
    const parser = new XMLParser({
      ignoreAttributes: false,
      preserveOrder: false,
      trimValues: true
    });
    const json = parser.parse(xmlText);
    
    // Get all property listings - CNM typically uses "imovel" or similar tags
    const imoveis = json.imoveis?.imovel || json.imovel || [];
    const imoveisList = Array.isArray(imoveis) ? imoveis : [imoveis];
    result.fetched_count = imoveisList.length;
    
    console.log(`🏠 Found ${result.fetched_count} properties to process`);

    // Process each property
    for (let i = 0; i < imoveisList.length; i++) {
      try {
        const imovel = imoveisList[i];
        
        // Extract CNM data - case sensitive field mapping
        const externalId = imovel.codigo?.toString()?.trim();
        if (!externalId) {
          result.errors.push(`Property ${i + 1}: Missing required field 'codigo'`);
          result.ignored_count++;
          continue;
        }

        // Map CNM fields to our schema
        const propertyData: PropertyData = {
          external_id: externalId,
          source_portal: 'cnm',
          titulo: imovel.titulo?.toString()?.trim() || 'Imóvel Importado',
          listing_type: mapListingType(imovel.finalidade?.toString()?.trim()),
          property_type: mapPropertyType(imovel.tipo?.toString()?.trim()),
          valor: parseFloat(imovel.valor?.toString()?.replace(/[^\d.,]/g, '').replace(',', '.') || '0') || 0,
          area: parseFloat(imovel.area?.toString()?.replace(/[^\d.,]/g, '').replace(',', '.') || '0') || 0,
          quartos: parseInt(imovel.quartos?.toString()?.trim() || '0') || 0,
          banheiros: parseInt(imovel.banheiros?.toString()?.trim() || '0') || 0,
          vagas: parseInt(imovel.vagas?.toString()?.trim() || '0') || 0,
          descricao: imovel.descricao?.toString()?.trim(),
          endereco: imovel.endereco?.toString()?.trim(),
          bairro: imovel.bairro?.toString()?.trim(),
          cidade: imovel.cidade?.toString()?.trim(),
          fotos: extractPhotos(imovel),
          raw_cnm: imovel,
          imported_at: new Date().toISOString(),
          is_public: publishOnImport,
          visibility: publishOnImport ? 'public_site' : 'hidden'
        };

        // Skip if essential data is missing
        if (!propertyData.titulo || propertyData.valor <= 0) {
          result.errors.push(`Property ${externalId}: Missing essential data (titulo or valor)`);
          result.ignored_count++;
          continue;
        }

        if (result.dryRun) {
          console.log(`🧪 [DRY RUN] Would process: ${propertyData.titulo} - R$ ${propertyData.valor}`);
          result.created_count++; // Count as would-be-created for dry run
          continue;
        }

        // Upsert property
        const { data, error } = await supabase
          .from('properties')
          .upsert(propertyData, {
            onConflict: 'source_portal,external_id',
            ignoreDuplicates: false
          })
          .select();

        if (error) {
          console.error('❌ Upsert error:', error);
          result.errors.push(`Property ${externalId}: ${error.message}`);
          continue;
        }

        if (data && data.length > 0) {
          console.log(`✅ Processed: ${propertyData.titulo} (${externalId})`);
          result.created_count++;
        } else {
          result.updated_count++;
        }

      } catch (error) {
        console.error(`❌ Error processing property ${i + 1}:`, error);
        result.errors.push(`Property ${i + 1}: ${error.message}`);
      }
    }

    console.log('📊 Import completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Import failed:', error);
    return new Response(JSON.stringify({
      error: error.message,
      fetched_count: 0,
      created_count: 0,
      updated_count: 0,
      ignored_count: 0,
      errors: [error.message],
      dryRun: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper functions
function mapListingType(tipo: string | undefined): string {
  if (!tipo) return 'venda';
  const t = tipo.toLowerCase();
  if (t.includes('alug') || t.includes('rent')) return 'aluguel';
  if (t.includes('vend') || t.includes('sale')) return 'venda';
  return 'venda';
}

function mapPropertyType(tipo: string | undefined): string {
  if (!tipo) return 'apartamento';
  const t = tipo.toLowerCase();
  if (t.includes('apto') || t.includes('apart')) return 'apartamento';
  if (t.includes('casa') || t.includes('house')) return 'casa';
  if (t.includes('terreno') || t.includes('land')) return 'terreno';
  if (t.includes('sala') || t.includes('commercial')) return 'comercial';
  return 'apartamento';
}

function extractPhotos(imovel: any): string[] {
  const photos: string[] = [];
  const fotosData = imovel.fotos;
  
  if (fotosData?.foto) {
    const fotos = Array.isArray(fotosData.foto) ? fotosData.foto : [fotosData.foto];
    for (const foto of fotos) {
      const url = foto?.toString()?.trim();
      if (url) {
        photos.push(url);
      }
    }
  }
  
  return photos;
}