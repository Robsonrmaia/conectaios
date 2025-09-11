import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, voice_id = '9BWtsMINqrJLrRacOk9x', model_id = 'eleven_turbo_v2_5' } = await req.json()
    
    console.log('🎤 Iniciando síntese de voz:', {
      textLength: text?.length || 0,
      voice_id,
      model_id,
      textPreview: text?.substring(0, 50) + '...'
    })

    if (!text) {
      console.error('❌ Erro: Texto não fornecido')
      throw new Error('Text is required')
    }

    const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY')
    if (!elevenlabsApiKey) {
      console.error('❌ Erro: ELEVENLABS_API_KEY não configurada')
      throw new Error('ElevenLabs API key not configured')
    }
    
    console.log('✅ API Key encontrada, iniciando chamada para ElevenLabs')

    // Call ElevenLabs API
    console.log('🔗 Fazendo chamada para ElevenLabs API...')
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenlabsApiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: model_id,
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.8
        }
      }),
    })

    console.log('📡 Resposta da ElevenLabs:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ ElevenLabs API error:', {
        status: response.status,
        statusText: response.statusText,
        error: error
      })
      throw new Error(`Failed to generate speech: ${response.status} - ${error}`)
    }

    const audioBuffer = await response.arrayBuffer()
    console.log('✅ Áudio gerado com sucesso:', {
      bufferSize: audioBuffer.byteLength,
      bufferSizeKB: Math.round(audioBuffer.byteLength / 1024)
    })

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
      },
    })
  } catch (error) {
    console.error('Error in text-to-speech function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})