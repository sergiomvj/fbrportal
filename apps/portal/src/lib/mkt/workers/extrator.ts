import { createSupabaseServerClient } from '../../supabase-admin';
import { MktRequestContext } from '../store';
// @ts-ignore
import pdfParse from 'pdf-parse';
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { saveDiagnostico, updateEstrategiaStatus } from '../store';

const openai = createOpenAI({
  apiKey: process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY || 'dummy',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

export async function processExtraction(job: any, context: MktRequestContext) {
  const supabase = createSupabaseServerClient();
  const { doc_path, nome, nicho } = job.payload;
  
  let extractedText = '';
  
  if (doc_path) {
    const { data, error } = await supabase.storage.from('mkt_documents').download(doc_path);
    if (error) throw new Error(`Falha ao baixar documento: ${error.message}`);
    
    if (doc_path.endsWith('.pdf')) {
      const buffer = Buffer.from(await data.arrayBuffer());
      const parsed = await pdfParse(buffer);
      extractedText = parsed.text.substring(0, 15000); // Limit context
    } else {
      // Basic text extraction for other files
      extractedText = await data.text();
      extractedText = extractedText.substring(0, 15000);
    }
  }

  // LLM Call
  const { object } = await generateObject({
    model: openai(process.env.LLM_MODEL || 'gpt-4o'),
    schema: z.object({
      swot: z.object({
        forcas: z.array(z.string()),
        fraquezas: z.array(z.string()),
        oportunidades: z.array(z.string()),
        ameacas: z.array(z.string())
      }),
      uvp: z.string(),
      persona: z.object({
        nome: z.string(),
        dores: z.array(z.string()),
        desejos: z.array(z.string()),
        comportamento: z.string()
      }),
      score: z.number().min(0).max(100)
    }),
    prompt: `Extraia o diagnóstico de marketing para a estratégia "${nome}" (Nicho: ${nicho}).
Baseie-se no documento de intake:
${extractedText || 'Nenhum documento fornecido. Gere um diagnóstico inferido baseado no nome e nicho.'}`
  });

  await saveDiagnostico({
    estrategia_id: job.estrategia_id,
    swot: object.swot as any,
    uvp: object.uvp,
    persona: object.persona as any,
    score_viabilidade: object.score
  } as any);

  await updateEstrategiaStatus(job.estrategia_id, 'revisao', context);
}
