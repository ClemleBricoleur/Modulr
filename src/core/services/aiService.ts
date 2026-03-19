/**
 * AI Service for Statement Scanner
 * Handles communication with different AI providers to extract transactions from bank statements
 */

import { getAIConfig, getAIEndpoint } from '../config/ai.config';
import { getBase64Data } from '../utils/pdfUtils';

/**
 * Extracted transaction from AI analysis
 */
export interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'input' | 'output';
}

/**
 * Response from AI extraction
 */
export interface ExtractionResult {
  success: boolean;
  transactions: ExtractedTransaction[];
  error?: string;
}

/**
 * The prompt used for transaction extraction
 */
const EXTRACTION_PROMPT = `### RÔLE
Tu es un agent spécialisé en extraction de données financières (OCR) avec une précision de 100%. Ton objectif est de transformer une image ou un texte de relevé bancaire Desjardins en un fichier JSON structuré.

### TÂCHE
Analyse l'image du relevé de compte et extrais TOUTES les transactions sans exception (achats, frais, et paiements).

### RÈGLES DE FORMATAGE
Retourne EXCLUSIVEMENT un objet JSON respectant cette structure exacte :
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Description simplifiée",
      "amount": 123.45,
      "type": "expense" | "income"
    }
  ]
}

### RÈGLES D'EXTRACTION STRICTES
1. DATE : Utilise le format ISO 8601 (YYYY-MM-DD). L'année doit être déduite de la date du relevé (ex: 2025).
2. TYPE : 
   - "expense" : Achats, frais annuels, intérêts, débits.
   - "income" : Crédits, remboursements, "PAIEMENT CAISSE" ou montants suivis de "CR".
3. MONTANT : Doit être un nombre flottant positif (ex: 12.99). Ne jamais inclure de symbole monétaire ou de signe négatif.
4. DESCRIPTION : Nettoie les espaces inutiles. Garde le nom du marchand et la localisation.
5. EXCLUSIONS : Ne pas inclure les soldes précédents, les totaux de section ou les sommaires de récompenses.
6. ZÉRO TEXTE : Ne fournis aucune introduction, explication ou conclusion. Uniquement le bloc JSON.

### CONTEXTE DU DOCUMENT
Le document contient plusieurs tables : "Transactions effectuées avec la carte de" et "Opérations au compte". Tu dois scanner l'intégralité des pages pour n'oublier aucune ligne.

### IMPORTANT
N'oublie aucune transaction, même les petites.`;

/**
 * Extract transactions from images using the configured AI provider
 */
export async function extractTransactionsFromImages(images: string[]): Promise<ExtractionResult> {
  const config = getAIConfig();

  if (!config.apiKey) {
    return {
      success: false,
      transactions: [],
      error: 'AI API key not configured. Please add your API key in Settings.',
    };
  }

  try {
    switch (config.provider) {
      case 'openai':
        return await extractWithOpenAI(images, config.apiKey);
      case 'gemini':
        return await extractWithGemini(images, config.apiKey);
      case 'claude':
        return await extractWithClaude(images, config.apiKey);
      default:
        return {
          success: false,
          transactions: [],
          error: `Unknown AI provider: ${config.provider}`,
        };
    }
  } catch (error) {
    console.error('AI extraction error:', error);
    return {
      success: false,
      transactions: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Extract transactions using OpenAI GPT-4 Vision
 */
async function extractWithOpenAI(images: string[], apiKey: string): Promise<ExtractionResult> {
  const endpoint = getAIEndpoint('openai');

  // Build image content array
  const imageContent = images.map(img => ({
    type: 'image_url' as const,
    image_url: {
      url: img,
      detail: 'high' as const,
    },
  }));

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: EXTRACTION_PROMPT },
            ...imageContent,
          ],
        },
      ],
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  return parseAIResponse(content);
}

/**
 * Extract transactions using Google Gemini
 */
async function extractWithGemini(images: string[], apiKey: string): Promise<ExtractionResult> {
  const endpoint = `${getAIEndpoint('gemini')}?key=${apiKey}`;

  // Build parts array with images
  const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = [
    { text: EXTRACTION_PROMPT },
  ];

  for (const img of images) {
    parts.push({
      inline_data: {
        mime_type: 'image/png',
        data: getBase64Data(img),
      },
    });
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  return parseAIResponse(content);
}

/**
 * Extract transactions using Anthropic Claude
 */
async function extractWithClaude(images: string[], apiKey: string): Promise<ExtractionResult> {
  const endpoint = getAIEndpoint('claude');

  // Build content array with images
  const content: Array<{ type: string; text?: string; source?: { type: string; media_type: string; data: string } }> = [];

  for (const img of images) {
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/png',
        data: getBase64Data(img),
      },
    });
  }

  content.push({
    type: 'text',
    text: EXTRACTION_PROMPT,
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const responseContent = data.content?.[0]?.text;

  return parseAIResponse(responseContent);
}

/**
 * Parse AI response and extract transactions
 */
function parseAIResponse(content: string | undefined): ExtractionResult {
  if (!content) {
    return {
      success: false,
      transactions: [],
      error: 'No response from AI',
    };
  }

  try {
    // Remove markdown code blocks if present (handle both complete and truncated)
    let jsonStr = content;

    // First try: complete code block with closing backticks
    const completeMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (completeMatch) {
      jsonStr = completeMatch[1];
    } else {
      // Second try: opening backticks without closing (truncated response)
      const partialMatch = content.match(/```(?:json)?\s*([\s\S]*)/);
      if (partialMatch) {
        jsonStr = partialMatch[1];
      }
    }

    // Remove any leading/trailing whitespace and potential stray backticks
    jsonStr = jsonStr.trim().replace(/`+$/, '');

    // Try to parse the JSON, with fallback for truncated responses
    let parsed: { transactions?: unknown[] };

    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      // JSON parsing failed - try to recover partial data from truncated response
      console.warn('JSON parsing failed, attempting to recover partial transactions...');
      const recoveredTransactions = recoverPartialTransactions(jsonStr);

      if (recoveredTransactions.length > 0) {
        return {
          success: true,
          transactions: recoveredTransactions,
        };
      }

      throw new Error('Could not parse or recover transactions from response');
    }

    if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
      return {
        success: false,
        transactions: [],
        error: 'Invalid response format: missing transactions array',
      };
    }

    // Validate and normalize transactions
    const transactions: ExtractedTransaction[] = parsed.transactions
      .filter((t: unknown): t is Record<string, unknown> => {
        if (typeof t !== 'object' || t === null) return false;
        const tx = t as Record<string, unknown>;
        return tx.date !== undefined && tx.amount !== undefined;
      })
      .map((t) => ({
        date: normalizeDate(String(t.date)),
        description: String(t.description || 'Unknown transaction'),
        amount: Math.abs(Number(t.amount)),
        type: normalizeType(String(t.type)),
      }));

    return {
      success: true,
      transactions,
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error, content);
    return {
      success: false,
      transactions: [],
      error: 'Failed to parse AI response. The response may have been truncated due to too many transactions.',
    };
  }
}

/**
 * Attempt to recover complete transactions from truncated JSON
 * Extracts all complete transaction objects that have all required fields
 */
function recoverPartialTransactions(jsonStr: string): ExtractedTransaction[] {
  const transactions: ExtractedTransaction[] = [];

  // Find all complete transaction objects using regex
  // Match objects that have date, amount, and type fields (description is optional)
  const transactionPattern = /\{\s*"date"\s*:\s*"([^"]+)"\s*,\s*"description"\s*:\s*"([^"]*)"\s*,\s*"amount"\s*:\s*([\d.]+)\s*,\s*"type"\s*:\s*"([^"]+)"\s*\}/g;

  let match;
  while ((match = transactionPattern.exec(jsonStr)) !== null) {
    try {
      const [, date, description, amount, type] = match;
      transactions.push({
        date: normalizeDate(date),
        description: description || 'Unknown transaction',
        amount: Math.abs(parseFloat(amount)),
        type: normalizeType(type),
      });
    } catch {
      // Skip malformed transactions
      continue;
    }
  }

  // Also try alternative field order (some AI responses may vary)
  const altPattern = /\{\s*"date"\s*:\s*"([^"]+)"\s*,\s*"amount"\s*:\s*([\d.]+)\s*,\s*"description"\s*:\s*"([^"]*)"\s*,\s*"type"\s*:\s*"([^"]+)"\s*\}/g;

  while ((match = altPattern.exec(jsonStr)) !== null) {
    try {
      const [, date, amount, description, type] = match;
      // Avoid duplicates by checking if we already have this transaction
      const exists = transactions.some(t =>
        t.date === normalizeDate(date) &&
        t.amount === Math.abs(parseFloat(amount)) &&
        t.description === (description || 'Unknown transaction')
      );

      if (!exists) {
        transactions.push({
          date: normalizeDate(date),
          description: description || 'Unknown transaction',
          amount: Math.abs(parseFloat(amount)),
          type: normalizeType(type),
        });
      }
    } catch {
      continue;
    }
  }

  console.log(`Recovered ${transactions.length} complete transactions from truncated response`);
  return transactions;
}

/**
 * Normalize date to YYYY-MM-DD format
 */
function normalizeDate(dateStr: string): string {
  try {
    // Try to parse the date
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      // If invalid, return today's date
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Normalize transaction type
 */
function normalizeType(typeStr: string): 'input' | 'output' {
  const lower = typeStr.toLowerCase();
  if (lower === 'income' || lower === 'credit' || lower === 'deposit' || lower === 'input') {
    return 'input';
  }
  return 'output';
}
