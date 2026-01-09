import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioBase64, fileName, mimeType } = await req.json();
    
    if (!audioBase64) {
      throw new Error('No audio data provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Processing audio file: ${fileName}, mimeType: ${mimeType}`);

    // Use Gemini's multimodal capabilities to actually transcribe the audio
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Você é um especialista em transcrição de músicas brasileiras e cifras.

INSTRUÇÕES:
1. Ouça atentamente este áudio e transcreva a LETRA REAL que você ouve
2. Adicione os acordes no formato [Acorde] baseado na harmonia que você identifica no áudio
3. Se não conseguir identificar algo claramente, use [?]
4. NÃO invente letras - transcreva apenas o que você realmente ouve

Formato de saída:
---LETRA---
(letra transcrita com acordes inline no formato [Acorde])
---FIM---

Transcreva agora o áudio anexado:`
              },
              {
                type: "input_audio",
                input_audio: {
                  data: audioBase64,
                  format: mimeType?.includes('mp3') || mimeType?.includes('mpeg') ? 'mp3' : 'wav'
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log("AI Response received, parsing content...");

    // Parse the response to extract lyrics and chords
    let lyrics = content;
    let chords: string[] = [];

    // Extract chords from the content (look for [Chord] patterns)
    const chordMatches = content.match(/\[([A-G][#b]?m?7?M?sus?4?2?dim?aug?\/[A-G]?[#b]?|[A-G][#b]?m?7?M?sus?4?2?dim?aug?)\]/g);
    if (chordMatches) {
      const uniqueChords = [...new Set(chordMatches.map((c: string) => c.replace(/[\[\]]/g, '')))];
      chords = uniqueChords as string[];
    }

    // Clean up the lyrics section
    if (content.includes('---LETRA---')) {
      const match = content.match(/---LETRA---([\s\S]*?)---FIM---/);
      if (match) {
        lyrics = match[1].trim();
      }
    }

    return new Response(
      JSON.stringify({ 
        lyrics, 
        chords,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Transcription error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
