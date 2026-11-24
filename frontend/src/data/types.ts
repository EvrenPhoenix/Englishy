import type { Level, UiLanguage } from "../../../shared/constants";

type Translations = Partial<Record<UiLanguage, string>>;
export type CourseLevel = "pre-a1" | "a1";
type Choice = { prompt: string; options: string[]; answer: number };
export type Exercise = { id: string; explanation?: string; hint?: string } & (
  | ({ type: "mc" } & Choice)
  | ({ type: "listen"; audio: string } & Choice)
  | ({ type: "reading"; passage: string; title?: string } & Choice)
  | {
      type: "blank";
      prompt: string;
      answers: string[];
      strictSpelling?: boolean;
    }
  | { type: "order"; words: string[]; alternatives?: string[] }
  | { type: "match"; pairs: [string, string][]; prompt?: string }
  | {
      type: "translate";
      source: Translations;
      fallback: string;
      answers: string[];
    }
  | {
      type: "spot";
      sentence: string;
      wrongIndex: number;
      correction: string;
      prompt?: string;
    }
  | {
      type: "correct";
      sentence: string;
      answers: string[];
      caseSensitive?: boolean;
    }
  | { type: "recall"; clue: string; answers: string[] }
  | { type: "dictation"; audio: string; answers: string[] }
  | { type: "write"; prompt: string; minWords: number; sample?: string }
  | { type: "speak"; text: string; prompt?: string }
);
export interface Lesson {
  id: string;
  level: CourseLevel;
  unitId: string;
  title: string;
  minutes: number;
  skill: string;
  icon: string;
  objectives: string[];
  explanation: string[];
  nativeTip?: Translations;
  examples: { en: string; note?: string }[];
  exercises: Exercise[];
  review: string[];
  vocab?: string[];
  grammarTopic?: string;
}
export interface Unit {
  id: string;
  level: CourseLevel;
  title: string;
  description: string;
}
export interface GrammarTopic {
  id: string;
  title: string;
  level: Level;
  category: string;
  summary: string;
  simple: string[];
  detailed: string[];
  examples: string[];
  mistakes: { wrong: string; right: string; why: string }[];
  notes?: string[];
  related: string[];
  exercises: Exercise[];
}
export interface VocabularyWord {
  id: string;
  word: string;
  pos: string;
  definition: string;
  ipa: string;
  topic: string;
  level: Level;
  examples: string[];
  translations: Translations;
  collocations?: string[];
  synonyms?: string[];
  antonyms?: string[];
}
export interface VocabularyTopic {
  id: string;
  title: string;
  icon: string;
}
export interface Guide {
  slug: string;
  short: string;
  title: string;
  description: string;
  intro: string;
  sections: { heading: string; paragraphs?: string[]; list?: string[] }[];
  cta: { label: string; to: string };
}
export interface PlacementStage {
  level: Level;
  questions: (Exercise & { skill: string })[];
}
