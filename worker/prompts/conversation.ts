import type { Scenario } from '../../shared/scenarios';
import type { ConversationRequest, LearnerProfile } from '../../shared/schemas';
import { BRAND, profileGuidance, SAFETY_RULES } from './common';

const DIFFICULTY = {
  easy: 'Speak slowly and simply: short sentences, very common words, one question at a time.',
  standard: 'Speak naturally for the learner level, one or two sentences per turn, ending with a question or prompt.',
  challenging: 'Speak naturally with some less common words and an occasional small complication in the situation. Still one question at a time.',
} as const;

const CORRECTION = {
  immediate:
    'If the learner makes a mistake, stay in character but add a short line at the end in this exact format: "💡 Tip: <corrected sentence> — <very short reason>". Only one tip per turn.',
  major:
    'Only if the learner makes a mistake that blocks understanding, add one short line at the end: "💡 Tip: <corrected sentence> — <very short reason>". Otherwise do not correct.',
  end: 'Do not correct mistakes during the conversation. Feedback will be given at the end.',
} as const;

export function conversationSystemPrompt(req: ConversationRequest, scenario: Scenario): string {
  return `You are role-playing in an English conversation practice on ${BRAND.name}.

${SAFETY_RULES}

${profileGuidance(req.profile)}

Scenario: ${scenario.title}. Setting: ${scenario.setting}
You play: ${scenario.aiRole}. The learner plays: ${scenario.learnerRole}.
Learning objectives for the learner: ${scenario.objectives.join('; ')}.

Instructions:
- Stay in character as a fictional person. Never claim to be a real person. Keep each turn short (1–3 sentences) and natural.
- ${DIFFICULTY[req.difficulty]}
- Guide the conversation so the learner can practise each objective.
- ${CORRECTION[req.correctionMode]}
- If the learner writes in another language or seems stuck, help briefly in simple English, then continue the role-play.
- If the learner wants to stop, close the scene politely in character.`;
}

export function assistSystemPrompt(profile: LearnerProfile, scenario: Scenario, kind: 'replies' | 'translate' | 'explain'): string {
  const task = {
    replies: `Suggest 3 short replies the learner could say next, in English, at their level. Every suggestion MUST be grammatically correct, natural English that a teacher would happily model: use articles correctly ("a sandwich", "the soup"), polite forms where appropriate ("I'd like…", "Could I have…, please?") and correct punctuation. Make the three suggestions meaningfully different. Respond ONLY with JSON: {"suggestions": ["...", "...", "..."]}`,
    translate: `Translate the last message from the other speaker into the learner's explanation language. Then add one short line explaining any difficult word. Plain text only.`,
    explain: `Explain the last message from the other speaker in very simple terms, in the learner's explanation language, and say what kind of answer is expected. Plain text, under 80 words.`,
  }[kind];
  return `You help an English learner during a role-play (${scenario.title}).

${SAFETY_RULES}

${profileGuidance(profile)}

${task}`;
}
