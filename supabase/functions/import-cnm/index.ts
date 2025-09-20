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
    const debug = url.searchParams.get('debug') === '1';
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
    console.log(`🔍 Debug mode: ${debug}`);

    // Fetch XML feed with proper headers
    console.log('📡 Fetching XML feed...');
    const res = await fetch(feedUrl, {
      method: 'GET',
      headers: { Accept: 'application/xml, text/xml, */*' },
      redirect: 'follow',
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch feed: ${res.status} ${res.statusText}`);
    }

    const text = await res.text();
    console.log(`📄 Fetched XML content: ${text.length} characters`);

    // Debug mode - return raw response info
    if (debug) {
      return new Response(JSON.stringify({
        status: res.status,
        contentType: res.headers.get('content-type'),
        size: text.length,
        head: text.slice(0, 500)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // Parse XML with namespace removal
    const parser = new XMLParser({
      ignoreAttributes: false,
      trimValues: true,
      preserveOrder: false,
      removeNSPrefix: true, // Important for handling various namespaces
    });
    const xml = parser.parse(text);
    
    // CNM discovery - specific path with fallbacks
    let items =
      xml?.Document?.imoveis?.imovel ??
      xml?.imoveis?.imovel ??
      [];

    // se for objeto único, vira array
    if (!Array.isArray(items) && items) items = [items];

    // fallback: procurar por chaves 'imovel' em qualquer nível
    if (!items.length) {
      items = [];
      const stack = [xml];
      while (stack.length) {
        const n = stack.pop();
        if (n && typeof n === 'object') {
          for (const [k, v] of Object.entries(n)) {
            if (k.toLowerCase() === 'imovel') {
              if (Array.isArray(v)) items.push(...v);
              else items.push(v as any);
            } else if (v && typeof v === 'object') {
              stack.push(v as any);
            }
          }
        }
      }
    }
    
    const fetched_count = Array.isArray(items) ? items.length : 0;
    result.fetched_count = fetched_count;
    
    console.log(`🏠 Found ${fetched_count} properties to process`);
    
    // Early return for dry run before processing
    if (dryRun) {
      return new Response(JSON.stringify({ 
        fetched_count, 
        created_count: 0, 
        updated_count: 0, 
        ignored_count: fetched_count, 
        errors: [], 
        dryRun: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`🏠 Found ${result.fetched_count} properties to process`);

    // Process each property
    for (let i = 0; i < items.length; i++) {
      try {
        const imovel = items[i];
        
        // Extract CNM data with specific mapping
        const it = imovel;
        const externalId = it.referencia ?? it.codigo_cliente ?? null;
        
        if (!externalId) {
          result.errors.push(`Property ${i + 1}: Missing required ID field (referencia or codigo_cliente)`);
          result.ignored_count++;
          continue;
        }

        // Map CNM fields with defaults
        const propertyData: PropertyData = {
          external_id: externalId,
          source_portal: 'cnm',
          titulo: it.titulo ?? it.tipo ?? '',
          listing_type: (it.finalidade === 'RE' || it.transacao === 'V') ? 'venda'
                      : (it.transacao === 'L') ? 'aluguel' : 'venda',
          property_type: it.tipo?.toLowerCase() ?? 'apartamento',
          valor: Number((it.valor ?? '0').toString().replace(',', '.')),
          area: parseFloat(it.area?.toString()?.replace(/[^\d.,]/g, '').replace(',', '.') || '0') || 0,
          quartos: parseInt(it.quartos?.toString()?.trim() || '0') || 0,
          banheiros: parseInt(it.banheiros?.toString()?.trim() || '0') || 0,
          vagas: parseInt(it.vagas?.toString()?.trim() || '0') || 0,
          descricao: it.descricao ?? '',
          endereco: it.endereco?.toString()?.trim(),
          bairro: it.bairro ?? it?.endereco?.bairro ?? '',
          cidade: it.cidade ?? it?.endereco?.cidade ?? '',
          fotos: Array.isArray(it?.fotos?.foto) ? it.fotos.foto.map((f: any) => f.url).filter(Boolean) : [],
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

// Helper functions for path navigation
function getByPath(obj: any, path: string[]) {
  let cur = obj;
  for (const key of path) {
    if (!cur) return undefined;
    cur = cur[key] ?? cur[key.toLowerCase()] ?? cur[key.toUpperCase()];
  }
  return cur;
}

function deepFindArraysByKeys(obj: any, keys: string[]): any[] {
  const out: any[] = [];
  const stack = [obj];
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== 'object') continue;
    for (const [k, v] of Object.entries(node)) {
      if (keys.includes(k) || keys.includes(k.toLowerCase())) {
        if (Array.isArray(v)) out.push(...v);
        else out.push(v);
      }
      if (v && typeof v === 'object') stack.push(v);
    }
  }
  return out;
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