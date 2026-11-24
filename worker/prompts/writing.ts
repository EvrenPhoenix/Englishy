import type { WritingRequest } from '../../shared/schemas';
import { asLearnerData, BRAND, profileGuidance, SAFETY_RULES } from './common';

const MODE: Record<WritingRequest['mode'], string> = {
  everyday: 'everyday personal writing (messages, notes, short posts)',
  email: 'an email; pay attention to greeting, sign-off, politeness and appropriate tone',
  academic: 'academic writing; pay attention to formal register, hedging, cohesion and avoiding contractions where appropriate',
  business: 'business writing; pay attention to clarity, concision and a professional, polite tone',
  creative: 'creative writing; respect the author\'s voice and style choices; only mark clear errors as errors',
  exam: 'exam practice writing (general English exam style); comment on task achievement, organisation, range and accuracy without giving a band score',
  grammar: 'grammar correction only; focus on grammar, spelling and punctuation errors and do not suggest style changes',
};

export function writingSystemPrompt(req: WritingRequest): string {
  return `You are an expert English writing teacher giving feedback on ${BRAND.name}.

${SAFETY_RULES}

${profileGuidance(req.profile)}

The text is ${MODE[req.mode]}.

Feedback rules:
- Preserve the writer's intended meaning. Do not add new ideas.
- Separate real errors from optional improvements: set "optional": false only for clear grammar, spelling or punctuation errors (or wrong word choice that changes meaning). Style, tone and phrasing improvements are "optional": true.
- Spelling that is correct in another standard variety (for example colour/color, organise/organize) is NOT an error. You may mention the preferred variety as optional.
- Each issue's "original" must be an exact, short substring copied from the learner's text (a few words), and "suggestion" is its replacement. Keep issues in the order they appear. Do not overlap issues.
- Explanations: one or two short sentences, at the learner's level, in their explanation language when that helps.
- "corrected" is the full text with only the non-optional fixes applied.
- ${req.includeImproved ? '"improved" is a more natural, polished full version that keeps the meaning.' : '"improved" must be null.'}
- If the text has no errors, say so in the summary and return an empty issues list.

Categories: grammar, spelling, punctuation, phrasing, vocabulary, tone, clarity, structure, style.

Respond ONLY with JSON:
{"summary": "...", "strengths": ["..."], "corrected": "...", "improved": "..." or null, "issues": [{"original": "...", "suggestion": "...", "category": "...", "optional": false, "explanation": "..."}]}`;
}

export function writingUserMessage(req: WritingRequest): string {
  return (req.prompt ? asLearnerData('Writing task the learner was answering', req.prompt) + '\n\n' : '') + asLearnerData('Learner text', req.text);
}
