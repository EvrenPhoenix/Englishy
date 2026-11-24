import { z } from 'zod';
import { CORRECTION_MODES, GOALS, LEVELS, LIMITS, NATIVE_LANGUAGES, VARIETIES, WRITING_MODES } from './constants';

/** A trimmed learner profile. Only these fields are ever sent to the AI provider. */
export const learnerProfileSchema = z.object({
  level: z.enum(LEVELS),
  nativeLanguage: z.enum(NATIVE_LANGUAGES),
  explanationLanguage: z.enum(NATIVE_LANGUAGES),
  variety: z.enum(VARIETIES),
  goals: z.array(z.enum(GOALS)).max(GOALS.length).default([]),
});
export type LearnerProfile = z.infer<typeof learnerProfileSchema>;

const shortText = (max: number) => z.string().trim().max(max);

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(LIMITS.messageChars * 4),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

const history = z.array(chatMessageSchema).max(40);

export const tutorRequestSchema = z.object({
  profile: learnerProfileSchema,
  messages: history.min(1),
  context: z
    .object({
      currentLesson: shortText(120).optional(),
      recentMistakes: z.array(shortText(160)).max(LIMITS.recentMistakes).optional(),
      knownWords: z.array(shortText(40)).max(LIMITS.knownWords).optional(),
      correctionMode: z.enum(CORRECTION_MODES).optional(),
    })
    .default({}),
});
export type TutorRequest = z.infer<typeof tutorRequestSchema>;

export const conversationRequestSchema = z.object({
  profile: learnerProfileSchema,
  scenarioId: z.string().regex(/^[a-z0-9-]{2,60}$/),
  difficulty: z.enum(['easy', 'standard', 'challenging']),
  correctionMode: z.enum(CORRECTION_MODES),
  messages: history,
});
export type ConversationRequest = z.infer<typeof conversationRequestSchema>;

export const assistRequestSchema = z.object({
  profile: learnerProfileSchema,
  scenarioId: z.string().regex(/^[a-z0-9-]{2,60}$/),
  kind: z.enum(['replies', 'translate', 'explain']),
  messages: history,
});
export type AssistRequest = z.infer<typeof assistRequestSchema>;

export const reportRequestSchema = z.object({
  profile: learnerProfileSchema,
  scenarioId: z.string().regex(/^[a-z0-9-]{2,60}$/),
  messages: history.min(2),
});

export const writingRequestSchema = z.object({
  profile: learnerProfileSchema,
  mode: z.enum(WRITING_MODES),
  text: z.string().trim().min(3).max(LIMITS.writingChars),
  includeImproved: z.boolean().default(false),
  prompt: shortText(300).optional(),
});
export type WritingRequest = z.infer<typeof writingRequestSchema>;

export const explainRequestSchema = z.object({
  profile: learnerProfileSchema,
  topic: z.enum(['word', 'lesson', 'grammar', 'answer']),
  subject: shortText(200).min(1),
  detail: shortText(800).optional(),
});
export type ExplainRequest = z.infer<typeof explainRequestSchema>;

export const exerciseRequestSchema = z.object({
  profile: learnerProfileSchema,
  topic: shortText(120).min(2),
  count: z.number().int().min(1).max(6).default(4),
});

// ---------- Structured AI responses (validated on the server and again on the client) ----------

export const FEEDBACK_CATEGORIES = [
  'grammar',
  'spelling',
  'punctuation',
  'phrasing',
  'vocabulary',
  'tone',
  'clarity',
  'structure',
  'style',
] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const writingIssueSchema = z.object({
  original: z.string().min(1).max(400),
  suggestion: z.string().max(400),
  category: z.enum(FEEDBACK_CATEGORIES),
  /** true for optional stylistic improvements, false for actual errors */
  optional: z.boolean().default(false),
  explanation: z.string().min(1).max(600),
});
export type WritingIssue = z.infer<typeof writingIssueSchema>;

export const writingFeedbackSchema = z.object({
  summary: z.string().max(600),
  corrected: z.string().max(LIMITS.writingChars * 2),
  improved: z.string().max(LIMITS.writingChars * 2).optional().nullable(),
  issues: z.array(writingIssueSchema).max(40),
  strengths: z.array(z.string().max(300)).max(6).default([]),
});
export type WritingFeedback = z.infer<typeof writingFeedbackSchema>;

export const conversationReportSchema = z.object({
  successes: z.array(z.string().max(300)).max(8),
  corrections: z
    .array(z.object({ original: z.string().max(300), corrected: z.string().max(300), explanation: z.string().max(400) }))
    .max(10),
  alternatives: z.array(z.object({ original: z.string().max(300), natural: z.string().max(300) })).max(8),
  vocabulary: z.array(z.object({ word: z.string().max(60), meaning: z.string().max(200) })).max(12),
  nextSteps: z.array(z.string().max(300)).max(6),
});
export type ConversationReport = z.infer<typeof conversationReportSchema>;

export const suggestionsSchema = z.object({
  suggestions: z.array(z.string().min(1).max(200)).min(1).max(4),
});

export const generatedExerciseSchema = z.object({
  exercises: z
    .array(
      z.object({
        question: z.string().min(3).max(300),
        options: z.array(z.string().min(1).max(120)).min(2).max(4),
        answerIndex: z.number().int().min(0).max(3),
        explanation: z.string().min(1).max(400),
      }),
    )
    .min(1)
    .max(6),
});
export type GeneratedExercises = z.infer<typeof generatedExerciseSchema>;

/** Shape of AI error responses returned by the Worker. */
export const AI_ERROR_CODES = [
  'ai_disabled',
  'ai_not_configured',
  'invalid_request',
  'rate_limited',
  'daily_limit',
  'upstream_rate_limited',
  'upstream_unavailable',
  'invalid_model',
  'timeout',
  'invalid_output',
  'forbidden_origin',
  'payload_too_large',
  'internal',
] as const;
export type AiErrorCode = (typeof AI_ERROR_CODES)[number];
export type AiErrorBody = { error: { code: AiErrorCode; message: string; retryAfter?: number } };
