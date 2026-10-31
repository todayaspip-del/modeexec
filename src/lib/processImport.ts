import { ProcessDoc } from '../types';

/**
 * Shortens a text string to its first sentence.
 * If empty or whitespace, returns the fallback "Passo do processo concluído".
 */
export function shortenToOneSentence(text?: string): string {
  if (!text || !text.trim()) {
    return 'Passo do processo concluído';
  }
  const clean = text.trim();
  const match = clean.match(/^[^.!?\n]+[.!?]?/);
  return match ? match[0].trim() : clean;
}

/**
 * Maps a single process step string into the starter card attributes:
 * - title: step text trimmed to 90 characters
 * - durationMinutes: 15
 * - expectedEvidence: the process minimumStandard shortened to one sentence
 * - description: "Processo: <processTitle>"
 */
export function mapStepToCardData(
  step: string,
  processDoc: Pick<ProcessDoc, 'title' | 'minimumStandard'>
): {
  title: string;
  durationMinutes: number;
  expectedEvidence: string;
  description: string;
} {
  const trimmed = step.trim();
  const title = trimmed.length > 90 ? trimmed.slice(0, 90) : trimmed;
  const expectedEvidence = shortenToOneSentence(processDoc.minimumStandard);
  const description = `Processo: ${processDoc.title}`;

  return {
    title: title || 'Passo do processo',
    durationMinutes: 15,
    expectedEvidence,
    description
  };
}
