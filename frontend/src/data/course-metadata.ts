export const availableLevels = ["pre-a1", "a1"] as const;

export const levelDescriptions = {
  "pre-a1":
    "Start from zero: letters, sounds, first words and survival phrases.",
  a1: "Basic sentences about yourself, your day and the world around you.",
  a2: "Everyday situations, past experiences and simple plans.",
  b1: "Travel, work and opinions with growing confidence.",
  b2: "Clear, detailed language on a wide range of topics.",
  c1: "Fluent, flexible language for social, academic and professional life.",
  c2: "Precise, nuanced language in almost any situation.",
} as const;

export const placementSkills = {
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  reading: "Reading",
  construction: "Sentence building",
  listening: "Listening",
} as const;
