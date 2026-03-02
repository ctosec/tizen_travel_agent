import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

@Injectable()
export class GeminiService implements OnModuleInit {
  private readonly logger = new Logger(GeminiService.name);
  private model: GenerativeModel;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY', '');
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not set — Gemini features will be unavailable');
      return;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    this.logger.log('Gemini model initialized');
  }

  async generateText(prompt: string): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini API key not configured');
    }
    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }

  async generateJSON<T>(prompt: string): Promise<T> {
    const text = await this.generateText(prompt);
    // Strip markdown code fences if present
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned) as T;
  }
}
