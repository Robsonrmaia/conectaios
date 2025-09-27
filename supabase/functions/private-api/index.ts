import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

interface PropertyResponse {
  id: string
  titulo: string
  valor: number
  property_type: string
  listing_type: string
  endereco: string
  cidade: string
  bairro: string
  quartos: number
  banheiros: number
  area: number
  descricao: string
  fotos: string[]
  caracteristicas: string[]
  coordinates: { lat: number; lng: number }
  visibility: string
  is_public: boolean
  views_count: number
  contacts_count: number
  created_at: string
  updated_at: string
}

interface ClientResponse {
  id: string
  nome: string
  telefone: string
  email?: string
  tipo: 'comprador' | 'vendedor' | 'locador' | 'locatario' | 'investidor'
  classificacao: string
  stage: string
  valor: number
  score: number
  last_contact_at: string
  pipeline_id?: string
  created_at: string
  updated_at: string
  historico: any[]
}

interface ApiKeyResponse {
  user_id: string
  broker_id: string
  permissions: string[]
  rate_limit: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const url = new URL(req.url)
    const path = url.pathname.replace('/functions/v1/private-api', '')
    const method = req.method

    // Authentication middleware
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key required. Use x-api-key header or Authorization Bearer token.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate API key and get user info
    const { data: broker, error: authError } = await supabaseClient
      .from('conectaios_brokers')
      .select('id, user_id, name, status')
      .eq('referral_code', apiKey)  // Using referral_code as API key for now
      .eq('status', 'active')
      .single()

    if (authError || !broker) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rate limiting check (simple implementation)
    const rateLimitKey = `rate_limit:${broker.id}`
    // In production, implement proper rate limiting with Redis or similar

    // Router
    const segments = path.split('/').filter(Boolean)
    const resource = segments[0]
    const id = segments[1]

    // Properties API
    if (resource === 'properties' || resource === 'imoveis') {
      if (method === 'GET' && !id) {
        // List properties
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
        const offset = (page - 1) * limit
        
        const status = url.searchParams.get('status')
        const type = url.searchParams.get('type')
        const city = url.searchParams.get('city')
        const minPrice = url.searchParams.get('min_price')
        const maxPrice = url.searchParams.get('max_price')

        let query = supabaseClient
          .from('properties')
          .select(`
            id, titulo, valor, property_type, listing_type, endereco, cidade, bairro,
            quartos, banheiros, area, descricao, fotos, caracteristicas, coordinates,
            visibility, is_public, created_at, updated_at,
            property_analytics(views_count, contacts_count)
          `)
          .eq('user_id', broker.user_id)
          .range(offset, offset + limit - 1)
          .order('created_at', { ascending: false })

        if (status) query = query.eq('visibility', status)
        if (type) query = query.eq('property_type', type)
        if (city) query = query.ilike('cidade', `%${city}%`)
        if (minPrice) query = query.gte('valor', parseFloat(minPrice))
        if (maxPrice) query = query.lte('valor', parseFloat(maxPrice))

        const { data: properties, error } = await query

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const formattedProperties: PropertyResponse[] = properties?.map(prop => ({
          id: prop.id,
          titulo: prop.titulo,
          valor: prop.valor,
          property_type: prop.property_type,
          listing_type: prop.listing_type,
          endereco: prop.endereco,
          cidade: prop.cidade,
          bairro: prop.bairro,
          quartos: prop.quartos,
          banheiros: prop.banheiros,
          area: prop.area,
          descricao: prop.descricao,
          fotos: prop.fotos || [],
          caracteristicas: prop.caracteristicas || [],
          coordinates: prop.coordinates,
          visibility: prop.visibility,
          is_public: prop.is_public,
          views_count: prop.property_analytics?.[0]?.views_count || 0,
          contacts_count: prop.property_analytics?.[0]?.contacts_count || 0,
          created_at: prop.created_at,
          updated_at: prop.updated_at
        })) || []

        return new Response(
          JSON.stringify({
            data: formattedProperties,
            pagination: {
              page,
              limit,
              total: formattedProperties.length
            }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (method === 'GET' && id) {
        // Get specific property
        const { data: property, error } = await supabaseClient
          .from('properties')
          .select(`
            id, titulo, valor, property_type, listing_type, endereco, cidade, bairro,
            quartos, banheiros, area, descricao, fotos, caracteristicas, coordinates,
            visibility, is_public, created_at, updated_at,
            property_analytics(views_count, contacts_count, matches_count)
          `)
          .eq('id', id)
          .eq('user_id', broker.user_id)
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ error: 'Property not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const formattedProperty: PropertyResponse = {
          id: property.id,
          titulo: property.titulo,
          valor: property.valor,
          property_type: property.property_type,
          listing_type: property.listing_type,
          endereco: property.endereco,
          cidade: property.cidade,
          bairro: property.bairro,
          quartos: property.quartos,
          banheiros: property.banheiros,
          area: property.area,
          descricao: property.descricao,
          fotos: property.fotos || [],
          caracteristicas: property.caracteristicas || [],
          coordinates: property.coordinates,
          visibility: property.visibility,
          is_public: property.is_public,
          views_count: property.property_analytics?.[0]?.views_count || 0,
          contacts_count: property.property_analytics?.[0]?.contacts_count || 0,
          created_at: property.created_at,
          updated_at: property.updated_at
        }

        return new Response(
          JSON.stringify({ data: formattedProperty }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (method === 'POST') {
        // Create property
        const body = await req.json()
        
        const { data: property, error } = await supabaseClient
          .from('properties')
          .insert([{
            user_id: broker.user_id,
            titulo: body.titulo,
            valor: body.valor,
            property_type: body.property_type,
            listing_type: body.listing_type,
            endereco: body.endereco,
            cidade: body.cidade,
            bairro: body.bairro,
            quartos: body.quartos,
            banheiros: body.banheiros,
            area: body.area,
            descricao: body.descricao,
            fotos: body.fotos || [],
            caracteristicas: body.caracteristicas || [],
            coordinates: body.coordinates,
            visibility: body.visibility || 'private',
            is_public: body.is_public || false
          }])
          .select()
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ data: property, message: 'Property created successfully' }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (method === 'PUT' && id) {
        // Update property
        const body = await req.json()
        
        const { data: property, error } = await supabaseClient
          .from('properties')
          .update({
            titulo: body.titulo,
            valor: body.valor,
            property_type: body.property_type,
            listing_type: body.listing_type,
            endereco: body.endereco,
            cidade: body.cidade,
            bairro: body.bairro,
            quartos: body.quartos,
            banheiros: body.banheiros,
            area: body.area,
            descricao: body.descricao,
            fotos: body.fotos,
            caracteristicas: body.caracteristicas,
            coordinates: body.coordinates,
            visibility: body.visibility,
            is_public: body.is_public,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', broker.user_id)
          .select()
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ data: property, message: 'Property updated successfully' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (method === 'DELETE' && id) {
        // Delete property
        const { error } = await supabaseClient
          .from('properties')
          .delete()
          .eq('id', id)
          .eq('user_id', broker.user_id)

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ message: 'Property deleted successfully' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // CRM/Clients API
    if (resource === 'clients' || resource === 'crm') {
      if (method === 'GET' && !id) {
        // List clients
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
        const offset = (page - 1) * limit
        
        const stage = url.searchParams.get('stage')
        const tipo = url.searchParams.get('tipo')
        const classificacao = url.searchParams.get('classificacao')

        let query = supabaseClient
          .from('clients')
          .select('*')
          .eq('user_id', broker.user_id)
          .range(offset, offset + limit - 1)
          .order('created_at', { ascending: false })

        if (stage) query = query.eq('stage', stage)
        if (tipo) query = query.eq('tipo', tipo)
        if (classificacao) query = query.eq('classificacao', classificacao)

        const { data: clients, error } = await query

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const formattedClients: ClientResponse[] = clients?.map(client => ({
          id: client.id,
          nome: client.nome,
          telefone: client.telefone,
          email: client.email,
          tipo: client.tipo,
          classificacao: client.classificacao,
          stage: client.stage,
          valor: client.valor || 0,
          score: client.score || 0,
          last_contact_at: client.last_contact_at,
          pipeline_id: client.pipeline_id,
          created_at: client.created_at,
          updated_at: client.updated_at,
          historico: client.historico || []
        })) || []

        return new Response(
          JSON.stringify({
            data: formattedClients,
            pagination: {
              page,
              limit,
              total: formattedClients.length
            }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (method === 'GET' && id) {
        // Get specific client
        const { data: client, error } = await supabaseClient
          .from('clients')
          .select('*')
          .eq('id', id)
          .eq('user_id', broker.user_id)
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ error: 'Client not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const formattedClient: ClientResponse = {
          id: client.id,
          nome: client.nome,
          telefone: client.telefone,
          email: client.email,
          tipo: client.tipo,
          classificacao: client.classificacao,
          stage: client.stage,
          valor: client.valor || 0,
          score: client.score || 0,
          last_contact_at: client.last_contact_at,
          pipeline_id: client.pipeline_id,
          created_at: client.created_at,
          updated_at: client.updated_at,
          historico: client.historico || []
        }

        return new Response(
          JSON.stringify({ data: formattedClient }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (method === 'POST') {
        // Create client
        const body = await req.json()
        
        const { data: client, error } = await supabaseClient
          .from('clients')
          .insert([{
            user_id: broker.user_id,
            nome: body.nome,
            telefone: body.telefone,
            email: body.email,
            tipo: body.tipo,
            classificacao: body.classificacao || 'novo_lead',
            stage: body.stage || 'novo_lead',
            valor: body.valor || 0,
            score: body.score || 0,
            historico: body.historico || []
          }])
          .select()
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ data: client, message: 'Client created successfully' }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (method === 'PUT' && id) {
        // Update client
        const body = await req.json()
        
        const { data: client, error } = await supabaseClient
          .from('clients')
          .update({
            nome: body.nome,
            telefone: body.telefone,
            email: body.email,
            tipo: body.tipo,
            classificacao: body.classificacao,
            stage: body.stage,
            valor: body.valor,
            score: body.score,
            last_contact_at: body.last_contact_at || new Date().toISOString(),
            historico: body.historico,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', broker.user_id)
          .select()
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ data: client, message: 'Client updated successfully' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (method === 'DELETE' && id) {
        // Delete client
        const { error } = await supabaseClient
          .from('clients')
          .delete()
          .eq('id', id)
          .eq('user_id', broker.user_id)

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ message: 'Client deleted successfully' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Analytics API
    if (resource === 'analytics') {
      if (method === 'GET') {
        const type = url.searchParams.get('type') // 'properties' or 'clients'
        const period = url.searchParams.get('period') || '30' // days

        if (type === 'properties') {
          const { data: analytics, error } = await supabaseClient
            .from('property_analytics')
            .select(`
              views_count, contacts_count, matches_count,
              properties!inner(user_id, created_at, valor, property_type, listing_type)
            `)
            .eq('properties.user_id', broker.user_id)
            .gte('properties.created_at', new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000).toISOString())

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          const summary = {
            total_properties: analytics?.length || 0,
            total_views: analytics?.reduce((sum, item) => sum + (item.views_count || 0), 0) || 0,
            total_contacts: analytics?.reduce((sum, item) => sum + (item.contacts_count || 0), 0) || 0,
            total_matches: analytics?.reduce((sum, item) => sum + (item.matches_count || 0), 0) || 0,
            avg_value: analytics?.length ? 
              analytics.reduce((sum, item) => sum + (item.properties?.price || 0), 0) / analytics.length : 0
          }

          return new Response(
            JSON.stringify({ data: summary }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (type === 'clients') {
          const { data: clients, error } = await supabaseClient
            .from('clients')
            .select('stage, classificacao, valor, created_at')
            .eq('user_id', broker.user_id)
            .gte('created_at', new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000).toISOString())

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          const summary = {
            total_clients: clients?.length || 0,
            by_stage: clients?.reduce((acc, client) => {
              acc[client.stage] = (acc[client.stage] || 0) + 1
              return acc
            }, {} as Record<string, number>) || {},
            by_classification: clients?.reduce((acc, client) => {
              acc[client.classificacao] = (acc[client.classificacao] || 0) + 1
              return acc
            }, {} as Record<string, number>) || {},
            total_value: clients?.reduce((sum, client) => sum + (client.valor || 0), 0) || 0
          }

          return new Response(
            JSON.stringify({ data: summary }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // Documentation endpoint
    if (resource === 'docs' && method === 'GET') {
      const docs = {
        title: "ConectAIOS Private API",
        version: "1.0.0",
        description: "API privada para gerenciar imóveis e CRM",
        authentication: {
          type: "API Key",
          header: "x-api-key ou Authorization: Bearer {key}",
          description: "Use seu código de referência como API key"
        },
        endpoints: {
          properties: {
            "GET /properties": "Listar imóveis",
            "GET /properties/{id}": "Obter imóvel específico",
            "POST /properties": "Criar imóvel",
            "PUT /properties/{id}": "Atualizar imóvel",
            "DELETE /properties/{id}": "Excluir imóvel"
          },
          crm: {
            "GET /clients": "Listar clientes",
            "GET /clients/{id}": "Obter cliente específico",
            "POST /clients": "Criar cliente",
            "PUT /clients/{id}": "Atualizar cliente",
            "DELETE /clients/{id}": "Excluir cliente"
          },
          analytics: {
            "GET /analytics?type=properties": "Analytics de imóveis",
            "GET /analytics?type=clients": "Analytics de CRM"
          }
        },
        rate_limits: {
          free: "100 requests/hour",
          premium: "1000 requests/hour",
          elite: "5000 requests/hour"
        },
        examples: {
          curl: `curl -H "x-api-key: YOUR_API_KEY" https://hvbdeyuqcliqrmzvyciq.supabase.co/functions/v1/private-api/properties`,
          javascript: `
fetch('https://hvbdeyuqcliqrmzvyciq.supabase.co/functions/v1/private-api/properties', {
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))`
        }
      }

      return new Response(
        JSON.stringify(docs, null, 2),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('API Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})