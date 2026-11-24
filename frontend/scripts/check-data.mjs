// Requires Node 22.18+ for native TypeScript imports. This check only reads files.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { compiledContent } from "./compiled-content.mjs";
import { lessons } from "../src/data/lessons/index.ts";
import { units } from "../src/data/units.ts";
import { grammar } from "../src/data/grammar.ts";
import { guides } from "../src/data/guides.ts";
import { vocabulary } from "../src/data/vocabulary.ts";
import { vocabularyTopics } from "../src/data/vocabulary-topics.ts";
import { placement } from "../src/data/placement.ts";
import { scenarios } from "../src/data/scenarios.ts";
import { achievements } from "../src/data/achievements.ts";
import { achievementProgress } from "../src/data/achievement-progress.ts";
import * as metadata from "../src/data/course-metadata.ts";
import * as catalogues from "../src/data/catalogues.ts";
import * as constants from "../../shared/constants.ts";

const reference = await compiledContent();
function compare(name, actual, expected) {
  // Normalize cross-realm prototypes. Unlike JSON serialization, structuredClone
  // retains own properties with undefined values and distinguishes array holes.
  try {
    assert.deepStrictEqual(structuredClone(actual), structuredClone(expected));
  } catch (cause) {
    throw new Error(`Content differs in ${name}`, { cause });
  }
}
function records(name, source, compiled) {
  assert.equal(source.length, compiled.length, name);
  source.forEach((row, index) =>
    compare(
      `${name}[${index}] ${row.id ?? row.slug ?? row.level}`,
      row,
      compiled[index],
    ),
  );
  console.log(`${name}: ${source.length}`);
}
assert.equal(reference.lessons.length, 43);
assert.equal(reference.units.length, 7);
for (const [name, rows] of Object.entries({
  units,
  lessons,
  grammar,
  vocabularyTopics,
  vocabulary,
  guides,
  placement,
  achievements,
  scenarios,
}))
  records(name, rows, reference[name]);
for (const [name, value] of Object.entries(metadata))
  compare(name, value, reference[name]);
compare("page catalogues", { ...catalogues }, reference.catalogues);
compare(
  "language and preference constants",
  { ...constants },
  reference.constants,
);

const locales = new URL("../src/i18n/locales/", import.meta.url);
compare(
  "locale inventory",
  readdirSync(locales).sort(),
  Object.keys(reference.dictionaries)
    .map((code) => code + ".json")
    .sort(),
);
let total = 0;
for (const [code, messages] of Object.entries(reference.dictionaries)) {
  const editable = JSON.parse(
    readFileSync(new URL(code + ".json", locales), "utf8"),
  );
  compare(
    `${code} keys`,
    Object.keys(editable).sort(),
    Object.keys(messages).sort(),
  );
  for (const key of Object.keys(messages))
    compare(`${code}.${key}`, editable[key], messages[key]);
  total += Object.keys(messages).length;
  console.log(`${code}: ${Object.keys(messages).length} messages`);
}
const empty = { lessons: [], activities: [], vocab: [], streaksEnabled: true };
const populated = {
  lessons: lessons.map(({ id }) => ({
    lessonId: id,
    status: "completed",
    bestScore: 1,
  })),
  activities: Array.from({ length: 9 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const day = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
    return { day, type: i < 4 ? "writing" : "conversation", durationSec: 600 };
  }),
  vocab: Array.from({ length: 12 }, () => ({
    srs: { interval: 21, lastReviewed: "2025-01-01" },
  })),
  streaksEnabled: true,
};
const partial = {
  ...populated,
  lessons: populated.lessons.slice(0, 3),
  activities: populated.activities.slice(1, 3),
  vocab: populated.vocab.slice(0, 4),
};
for (const state of [empty, partial, populated])
  for (const streaksEnabled of [false, true]) {
    const fixture = { ...state, streaksEnabled };
    compare(
      "achievement progress",
      achievementProgress(fixture),
      reference.evaluateAchievements(fixture),
    );
  }
console.log(
  `Matched ${lessons.flatMap((x) => x.exercises).length} lesson exercises, ${grammar.flatMap((x) => x.exercises).length} grammar exercises, ${placement.flatMap((x) => x.questions).length} placement questions and ${total} locale entries.`,
);
