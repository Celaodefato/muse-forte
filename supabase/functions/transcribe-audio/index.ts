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
    const { audioBase64, fileName, mimeType, formatOnly, lyrics, key, songName } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Mode 1: Format existing lyrics in CifraClub style
    if (formatOnly && lyrics && key) {
      console.log(`Formatting lyrics for: ${songName} in key: ${key}`);
      
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
              content: `Você é um ESPECIALISTA em harmonia musical e cifras no estilo CIFRACLUB.

TAREFA: Analisar a letra e criar uma cifra HARMONICAMENTE CORRETA no tom informado.

TOM DA MÚSICA: ${key}

TEORIA HARMÔNICA - USE ISSO PARA ESCOLHER ACORDES:
Para tom MAIOR (ex: ${key}):
- I = ${key} (tônica)
- ii = acorde menor um tom acima
- iii = acorde menor 
- IV = acorde maior (subdominante)
- V = acorde maior (dominante) - geralmente V7
- vi = acorde menor relativo
- vii° = diminuto

Para tom MENOR:
- i = tônica menor
- III = relativo maior
- iv = subdominante menor
- v ou V7 = dominante
- VI = sexto grau maior
- VII = sétimo grau maior

PROGRESSÕES COMUNS NO TOM ${key}:
- I - IV - V - I (básica)
- I - V - vi - IV (pop)
- I - vi - IV - V (romântica)
- ii - V - I (jazz)
- I - IV - I - V (blues/country)

REGRAS DO ESTILO CIFRACLUB:
1. Acordes ficam ACIMA da sílaba exata onde mudam
2. Use espaços para alinhar perfeitamente
3. Organize em: [Intro], [Verso], [Pré-Refrão], [Refrão], [Ponte], [Solo], [Outro]
4. Acordes devem fazer sentido harmônico no tom ${key}

EXEMPLO NO TOM DE C:
[Intro] C  G  Am  F

[Verso 1]
C                    G
  Primeira linha da letra aqui
Am                   F
  Segunda linha continua aqui

[Refrão]
C        G       Am      F
Parte mais forte do refrão

IMPORTANTE:
- ANALISE a melodia implícita na letra para posicionar acordes
- USE acordes que fazem sentido no tom ${key}
- POSICIONE mudanças de acorde em sílabas tônicas
- SE a letra menciona acordes errados, CORRIJA para o tom ${key}

LETRA PARA CIFRAR:
${lyrics}

RETORNE APENAS A CIFRA FORMATADA NO ESTILO CIFRACLUB, SEM EXPLICAÇÕES.`
            }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const formattedLyrics = data.choices?.[0]?.message?.content || "";

      // Extract chords from formatted content
      const chordMatches = formattedLyrics.match(/\b([A-G][#b]?(?:m|M|dim|aug|sus[24]?|add\d+|maj7?|7|9|11|13)?(?:\/[A-G][#b]?)?)\b/g);
      const uniqueChords = chordMatches ? [...new Set(chordMatches)] : [];

      return new Response(
        JSON.stringify({ 
          lyrics: formattedLyrics, 
          chords: uniqueChords,
          success: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mode 2: Transcribe audio
    if (!audioBase64) {
      throw new Error('No audio data provided');
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
    let transcribedLyrics = content;
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
        transcribedLyrics = match[1].trim();
      }
    }

    return new Response(
      JSON.stringify({ 
        lyrics: transcribedLyrics, 
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
