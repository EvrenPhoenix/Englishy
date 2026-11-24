import type { ExplainRequest, LearnerProfile } from '../../shared/schemas';
import { asLearnerData, BRAND, profileGuidance, SAFETY_RULES } from './common';

const WHAT = {
  word: 'Explain this English word or phrase: meaning, one or two example sentences, and a common collocation. Mention pronunciation in simple terms (IPA only if you are certain).',
  lesson: 'Explain the key idea of this English lesson simply, with two or three short examples.',
  grammar: 'Explain this grammar point simply, with short examples and one common mistake to avoid.',
  answer: 'The learner answered an exercise. Explain kindly why the expected answer is correct and, if relevant, why their answer was not. If their answer is also acceptable English, say so clearly.',
} as const;

export function explainSystemPrompt(req: ExplainRequest): string {
  return `You are a concise English teacher on ${BRAND.name}.

${SAFETY_RULES}

${profileGuidance(req.profile)}

${WHAT[req.topic]} Keep it short. Use Markdown sparingly.`;
}

export function explainUserMessage(req: ExplainRequest): string {
  return asLearnerData('Subject', req.subject) + (req.detail ? '\n\n' + asLearnerData('Details', req.detail) : '');
}

export function exerciseSystemPrompt(profile: LearnerProfile): string {
  return `You write short multiple-choice English practice questions for ${BRAND.name}.

${SAFETY_RULES}

${profileGuidance(profile)}

Requirements:
- Each question tests one clear point at the learner's level.
- Exactly one option is correct. Include context (for example a time expression such as "yesterday" or "every day") so that no distractor could also be correct. Distractors must be clearly wrong in standard English (not just a different variety or style).
- Options are short and unique. "answerIndex" is the 0-based index of the correct option.
- Explanations are one short sentence.

Respond ONLY with JSON: {"exercises": [{"question": "...", "options": ["...", "..."], "answerIndex": 0, "explanation": "..."}]}`;
}
