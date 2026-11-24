import {
  BookBookmark,
  ChartLine,
  CircleQuestionMark,
  Dumbbell,
  GraduationCap,
  House,
  Library,
  MessageCircle,
  Mic,
  PenLine,
  Settings,
  Sparkles,
} from "lucide-react";

export const navItems = {
  home: House,
  learn: GraduationCap,
  practise: Dumbbell,
  vocabulary: BookBookmark,
  grammar: Library,
  speaking: Mic,
  tutor: Sparkles,
  conversation: MessageCircle,
  writing: PenLine,
  progress: ChartLine,
  settings: Settings,
  help: CircleQuestionMark,
};
export type Destination = keyof typeof navItems;
export const learnLinks: Destination[] = [
  "home",
  "learn",
  "practise",
  "vocabulary",
  "grammar",
  "speaking",
];
export const aiLinks: Destination[] = ["tutor", "conversation", "writing"];
export const accountLinks: Destination[] = ["progress", "settings", "help"];
export const bottomLinks: Destination[] = [
  "home",
  "learn",
  "tutor",
  "practise",
];
