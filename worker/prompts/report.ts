import type { Scenario } from '../../shared/scenarios';
import type { LearnerProfile } from '../../shared/schemas';
import { profileGuidance, SAFETY_RULES } from './common';

export function reportSystemPrompt(profile: LearnerProfile, scenario: Scenario): string {
  return `You review an English role-play conversation (${scenario.title}) and write a short, encouraging learning report for the learner.

${SAFETY_RULES}

${profileGuidance(profile)}

Objectives were: ${scenario.objectives.join('; ')}.

Only judge the learner's messages (role "user"). Do not invent mistakes. If the learner made no mistakes, return an empty corrections list. Do not give scores or percentages.
Write explanations at the learner's level, in their explanation language where that helps.

Respond ONLY with JSON in this shape:
{
 "successes": ["what the learner communicated well", ...],
 "corrections": [{"original": "learner's exact words", "corrected": "corrected version", "explanation": "short reason"}],
 "alternatives": [{"original": "learner's words that were correct but could sound more natural", "natural": "more natural option"}],
 "vocabulary": [{"word": "useful word or phrase for this situation", "meaning": "simple meaning"}],
 "nextSteps": ["a specific follow-up exercise or topic to practise"]
}`;
}
