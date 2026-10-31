import { GoogleGenAI } from '@google/genai';

/**
 * Server-only Gemini AI Layer.
 *
 * CRITICAL SECURITY RULE:
 * This module runs strictly on the server and MUST NEVER be imported by client/browser code.
 * The Gemini API key must never reach the browser or client bundle.
 */

export type AIErrorCode = 'no_api_key' | 'timeout' | 'bad_output' | 'rate_limited' | 'upstream';

export class AIServerError extends Error {
  code: AIErrorCode;
  status: number;
  details?: unknown;

  constructor(code: AIErrorCode, message: string, status = 500, details?: unknown) {
    super(message);
    this.name = 'AIServerError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * The model name kept in ONE constant, read from process.env.AI_MODEL.
 * Default is the recommended Google AI Studio model for basic text tasks: 'gemini-3.8-flash'.
 */
export const AI_MODEL = process.env.AI_MODEL || 'gemini-3.8-flash';

export interface GenerateStructuredOptions<T = unknown> {
  systemInstruction?: string;
  userPrompt: string;
  responseSchema?: Record<string, unknown>;
  temperature?: number;
  /** Optional custom shape validator function (returns true if valid) */
  validateShape?: (data: unknown) => data is T;
}

/**
 * Initializes and returns a GoogleGenAI client instance with required telemetry headers.
 */
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new AIServerError('no_api_key', 'Gemini API key is not configured on the server.', 401);
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

/**
 * Strips markdown code blocks if the model outputs ```json ... ``` despite mime type.
 */
function extractJsonString(raw: string): string {
  let text = raw.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  return text;
}

/**
 * Defensively parses JSON string and performs manual shape validation without new dependencies.
 */
function parseAndValidate<T>(
  rawText: string | undefined,
  validateShape?: (data: unknown) => data is T
): T {
  if (!rawText || rawText.trim() === '') {
    throw new AIServerError('bad_output', 'Gemini returned an empty response.', 502);
  }

  const cleaned = extractJsonString(rawText);
  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new AIServerError('bad_output', 'Failed to parse JSON response from Gemini.', 502, err);
  }

  if (parsed === null || parsed === undefined) {
    throw new AIServerError('bad_output', 'Parsed JSON response is null or undefined.', 502);
  }

  // Hand-validation: if a custom shape validator is provided, use it
  if (validateShape) {
    if (!validateShape(parsed)) {
      throw new AIServerError('bad_output', 'Response failed custom shape validation.', 502, parsed);
    }
    return parsed;
  }

  // Default hand-validation: must be an object or array (not primitive number/string/boolean)
  if (typeof parsed !== 'object') {
    throw new AIServerError('bad_output', 'Expected JSON object or array from structured response.', 502, parsed);
  }

  return parsed as T;
}

/**
 * Maps any caught upstream error to one of the 5 typed error codes.
 */
function mapToAIServerError(err: unknown): AIServerError {
  if (err instanceof AIServerError) {
    return err;
  }

  const message = (err as Error)?.message || String(err);
  const status = (err as { status?: number; statusCode?: number })?.status ||
                 (err as { status?: number; statusCode?: number })?.statusCode || 500;

  // Timeout mapping
  if (
    (err as { name?: string })?.name === 'AbortError' ||
    message.includes('aborted') ||
    message.includes('timeout') ||
    message.includes('DEADLINE_EXCEEDED')
  ) {
    return new AIServerError('timeout', 'Gemini request timed out after 25 seconds.', 504, err);
  }

  // Rate limit / Quota mapping
  if (
    status === 429 ||
    message.includes('429') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.toLowerCase().includes('quota') ||
    message.toLowerCase().includes('rate limit')
  ) {
    return new AIServerError('rate_limited', 'Gemini rate limit or quota exceeded.', 429, err);
  }

  // API Key missing or invalid
  if (
    status === 401 ||
    message.includes('API_KEY_INVALID') ||
    message.includes('API key not valid') ||
    message.includes('UNAUTHENTICATED')
  ) {
    return new AIServerError('no_api_key', 'Invalid or missing Gemini API key.', 401, err);
  }

  // General upstream failure
  return new AIServerError(
    'upstream',
    `Gemini upstream failure: ${message}`,
    status >= 400 && status < 600 ? status : 502,
    err
  );
}

/**
 * Calls Gemini with structured JSON configuration, 25-second timeout, defensive parsing,
 * manual shape validation, and 1 automatic retry on malformed JSON.
 */
export async function generateStructured<T>({
  systemInstruction,
  userPrompt,
  responseSchema,
  temperature = 0.2,
  validateShape
}: GenerateStructuredOptions<T>): Promise<T> {
  const ai = getGeminiClient();

  const performCall = async (): Promise<string | undefined> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 25000); // 25 seconds timeout as required

    try {
      const response = await ai.models.generateContent({
        model: AI_MODEL,
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          ...(responseSchema ? { responseSchema } : {}),
          ...(typeof temperature === 'number' ? { temperature } : {}),
          abortSignal: controller.signal
        }
      });

      return response.text;
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        throw new AIServerError('timeout', 'Request timed out after 25 seconds.', 504);
      }
      throw mapToAIServerError(err);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Attempt 1
  let textOutput: string | undefined;
  try {
    textOutput = await performCall();
    return parseAndValidate<T>(textOutput, validateShape);
  } catch (firstErr) {
    // If the error was malformed JSON or shape validation (bad_output), retry ONCE as required
    if (firstErr instanceof AIServerError && firstErr.code === 'bad_output') {
      try {
        textOutput = await performCall();
        return parseAndValidate<T>(textOutput, validateShape);
      } catch (secondErr) {
        throw mapToAIServerError(secondErr);
      }
    }

    throw mapToAIServerError(firstErr);
  }
}
