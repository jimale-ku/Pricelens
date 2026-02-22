import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ReceiptLineItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
}

export interface ReceiptAnalysisResult {
  storeName?: string;
  items: ReceiptLineItem[];
  totalAmount?: number;
  currency?: string;
  message?: string;
}

@Injectable()
export class ReceiptsService {
  private readonly logger = new Logger(ReceiptsService.name);

  constructor(private readonly config: ConfigService) {}

  /** Analyze a built-in sample receipt (for testing without a real receipt). */
  async analyzeSampleReceipt(): Promise<ReceiptAnalysisResult> {
    try {
      const res = await fetch(
        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
        { method: 'GET' },
      );
      if (!res.ok) throw new Error('Failed to fetch sample image');
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return this.analyzeReceiptImage(buffer, 'image/jpeg');
    } catch (e: any) {
      this.logger.warn('Sample receipt fetch failed', e?.message);
      return {
        items: [],
        message: 'Could not load sample receipt. Try "Upload Receipt" with your own photo.',
      };
    }
  }

  async analyzeReceiptImage(buffer: Buffer, mimeType: string): Promise<ReceiptAnalysisResult> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');

    if (apiKey) {
      try {
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${mimeType};base64,${base64}`;
        return await this.callOpenAIVision(apiKey, dataUrl);
      } catch (error: any) {
        this.logger.error('OpenAI Vision receipt analysis failed', error?.message || error);
        throw new BadRequestException(
          error?.message || 'Receipt analysis failed. Please try another image.',
        );
      }
    }

    // FREE path: use Tesseract.js OCR (no API key, no cost)
    try {
      return await this.analyzeWithTesseract(buffer);
    } catch (error: any) {
      this.logger.error('Tesseract receipt analysis failed', error?.message || error);
      throw new BadRequestException(
        'Could not read receipt. Try a clearer photo or add OPENAI_API_KEY for better results.',
      );
    }
  }

  /** Free OCR using Tesseract.js - no API key or cost */
  private async analyzeWithTesseract(buffer: Buffer): Promise<ReceiptAnalysisResult> {
    const Tesseract = require('tesseract.js');
    const { data } = await Tesseract.recognize(buffer, 'eng', { logger: () => {} });
    const text = (data?.text || '').trim();
    if (!text) {
      return { items: [], message: 'No text found in image. Use a clearer receipt photo.' };
    }

    const items: ReceiptLineItem[] = [];
    let totalAmount: number | undefined;
    const lines = text.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);

    // Price at end of line: "ITEM NAME 1.99" or "ITEM NAME $1.99" or "1.99" at end
    const priceAtEnd = /(.+?)\s+[\$]?(\d+[.,]\d{2})\s*$/;
    // Line that is just a total: "TOTAL 10.99" or "Balance Due 10.99"
    const totalLine = /(?:total|balance|amount\s+due|grand\s+total|subtotal)\s*[:\s]*[\$]?(\d+[.,]\d{2})/i;

    for (const line of lines) {
      const totalMatch = line.match(totalLine);
      if (totalMatch) {
        totalAmount = parseFloat(totalMatch[1].replace(',', '.'));
        continue;
      }
      const match = line.match(priceAtEnd);
      if (match) {
        const name = match[1].replace(/\s+/g, ' ').trim();
        const price = parseFloat(match[2].replace(',', '.'));
        if (name.length > 1 && price > 0 && price < 100000) {
          items.push({
            name,
            quantity: 1,
            unitPrice: price,
            totalPrice: price,
          });
        }
      }
    }

    return {
      items,
      totalAmount,
      currency: 'USD',
      message: items.length === 0
        ? 'No line items detected. For better results use a clear, well-lit receipt photo or add OPENAI_API_KEY.'
        : undefined,
    };
  }

  private async callOpenAIVision(apiKey: string, imageDataUrl: string): Promise<ReceiptAnalysisResult> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a receipt parser. Analyze this receipt image and extract every line item.

Return a JSON object with this exact structure (no markdown, no code block):
{
  "storeName": "store name if visible",
  "totalAmount": number or null,
  "currency": "USD",
  "items": [
    {
      "name": "product name",
      "quantity": number,
      "unitPrice": number,
      "totalPrice": number,
      "category": "optional category like Grocery, Produce, Dairy"
    }
  ]
}

Rules:
- Extract every item with a price. quantity is 1 if not specified.
- unitPrice = price per single item, totalPrice = quantity * unitPrice for that line.
- If only one price per line, use it as totalPrice and set unitPrice the same and quantity 1.
- Use numbers only for prices (e.g. 2.99 not "$2.99").
- If you cannot read the receipt, return { "items": [], "storeName": null, "totalAmount": null }`,
              },
              {
                type: 'image_url',
                image_url: { url: imageDataUrl },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('No content in OpenAI response');

    // Parse JSON from response (handle optional markdown code block)
    let jsonStr = content;
    const codeBlock = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlock) jsonStr = codeBlock[1].trim();
    const parsed = JSON.parse(jsonStr);

    return {
      storeName: parsed.storeName ?? undefined,
      totalAmount: typeof parsed.totalAmount === 'number' ? parsed.totalAmount : undefined,
      currency: parsed.currency || 'USD',
      items: Array.isArray(parsed.items)
        ? parsed.items.map((i: any) => ({
            name: String(i.name || 'Unknown'),
            quantity: Math.max(1, Number(i.quantity) || 1),
            unitPrice: Number(i.unitPrice) || 0,
            totalPrice: Number(i.totalPrice) || Number(i.unitPrice) || 0,
            category: i.category ? String(i.category) : undefined,
          }))
        : [],
    };
  }
}
