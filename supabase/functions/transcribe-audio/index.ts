import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audio, type = 'general' } = await req.json()
    
    if (!audio) {
      throw new Error('No audio data provided')
    }

    console.log(`Processing ${type} audio transcription...`)

    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio)
    
    // Prepare form data
    const formData = new FormData()
    const blob = new Blob([binaryAudio], { type: 'audio/webm' })
    formData.append('file', blob, 'audio.webm')
    formData.append('model', 'whisper-1')
    formData.append('language', 'pt')

    // Send to OpenAI Whisper
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', errorText)
      throw new Error(`OpenAI API error: ${errorText}`)
    }

    const result = await response.json()
    console.log('Transcription result:', result.text)

    // If type is 'client', extract structured data
    if (type === 'client') {
      const structurePrompt = `
        Extraia os seguintes dados desta transcrição de áudio sobre um cliente imobiliário em formato JSON:
        - nome (string)
        - telefone (string, apenas números com DDD)
        - email (string, se mencionado)
        - interesse (string, ex: "comprar apartamento", "vender casa")
        - orcamento (número, converta valores como "300 mil" para 300000, "2 milhões" para 2000000)
        - observacoes (string, outras informações relevantes)
        
        IMPORTANTE para orçamento:
        - "300 mil" = 300000
        - "1 milhão" = 1000000
        - "2 milhões" = 2000000
        - "500.000" = 500000
        - Sempre retorne números, não texto
        
        Transcrição: "${result.text}"
        
        Responda APENAS o JSON, sem explicações.
      `

      const structureResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'user', content: structurePrompt }
          ],
          max_tokens: 500,
          temperature: 0.3
        }),
      })

      if (structureResponse.ok) {
        const structuredData = await structureResponse.json()
        const extractedData = structuredData.choices[0]?.message?.content

        if (!extractedData) {
          console.error('No content from OpenAI for client structuring')
          // Return just the transcription if no structured data
        } else {
          try {
            // Extract JSON from markdown code blocks if present
            const jsonMatch = extractedData.match(/```json\n([\s\S]*?)\n```/) || extractedData.match(/```\n([\s\S]*?)\n```/)
            const jsonString = jsonMatch ? jsonMatch[1] : extractedData.trim()
            
            console.log('Attempting to parse JSON:', jsonString)
            const parsedData = JSON.parse(jsonString)
            
            return new Response(
              JSON.stringify({ 
                text: result.text, 
                structured: parsedData,
                type: 'client'
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          } catch (parseError) {
            console.error('Failed to parse client data:', parseError)
            console.error('Raw response from OpenAI:', extractedData)
            // Return just the transcription if parsing fails
          }
        }
      }
    }

    // If type is 'task', extract task data
    if (type === 'task') {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      
      const taskPrompt = `
        Extraia os seguintes dados desta transcrição de áudio sobre uma tarefa em formato JSON:
        - titulo (string, resumo da tarefa)
        - descricao (string, descrição completa)
        - data (string, formato YYYY-MM-DD, DATA DE HOJE: ${today.toISOString().split('T')[0]}, AMANHÃ: ${tomorrow.toISOString().split('T')[0]})
        - hora (string, formato HH:MM, se mencionado, senão "09:00")
        - prioridade (string: "baixa", "media", "alta")
        - cliente (string, nome do cliente se mencionado)
        - telefone (string, telefone do cliente se mencionado, apenas números com DDD)
        
        Para datas relativas use as datas corretas:
        - "amanhã" = ${tomorrow.toISOString().split('T')[0]}
        - "hoje" = ${today.toISOString().split('T')[0]}
        - Se não mencionou data específica = ${today.toISOString().split('T')[0]}
        
        Transcrição: "${result.text}"
        
        Responda APENAS o JSON, sem explicações.
      `

      const taskResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'user', content: taskPrompt }
          ],
          max_tokens: 300,
          temperature: 0.3
        }),
      })

      if (taskResponse.ok) {
        const taskData = await taskResponse.json()
        const extractedData = taskData.choices[0]?.message?.content

        if (!extractedData) {
          console.error('No content from OpenAI for task structuring')
          // Return just the transcription if no structured data
        } else {
          try {
            // Extract JSON from markdown code blocks if present
            const jsonMatch = extractedData.match(/```json\n([\s\S]*?)\n```/) || extractedData.match(/```\n([\s\S]*?)\n```/)
            const jsonString = jsonMatch ? jsonMatch[1] : extractedData.trim()
            
            console.log('Attempting to parse task JSON:', jsonString)
            const parsedData = JSON.parse(jsonString)
            
            return new Response(
              JSON.stringify({ 
                text: result.text, 
                structured: parsedData,
                type: 'task'
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          } catch (parseError) {
            console.error('Failed to parse task data:', parseError)
            console.error('Raw response from OpenAI:', extractedData)
            // Return just the transcription if parsing fails
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ text: result.text, type: 'general' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Transcription error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})