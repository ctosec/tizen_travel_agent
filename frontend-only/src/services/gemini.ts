import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';

let model: GenerativeModel | null = null;

function getModel(): GenerativeModel {
  if (model) return model;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY not set');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const baseUrl = import.meta.env.VITE_GEMINI_BASE_URL || '';

  const requestOptions: Record<string, string> = { apiVersion: 'v1' };
  if (baseUrl) {
    requestOptions.baseUrl = baseUrl;
  }

  model = genAI.getGenerativeModel(
    { model: 'gemini-2.5-flash' },
    requestOptions,
  );
  return model;
}

export async function generateText(prompt: string): Promise<string> {
  const m = getModel();
  const result = await m.generateContent(prompt);
  return result.response.text();
}

export async function generateJSON<T>(prompt: string): Promise<T> {
  const text = await generateText(prompt);
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(cleaned) as T;
}
