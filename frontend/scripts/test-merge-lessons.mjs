// Unit tests for the backup lesson merge. Run: node --experimental-strip-types scripts/test-merge-lessons.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeLessons } from "../src/lib/merge-lessons.ts";

const row = (o) => ({
  lessonId: "pa1-alphabet",
  status: "completed",
  attempts: 2,
  bestScore: 1,
  lastScore: 1,
  startedAt: "2026-11-19T09:00:00.000Z",
  completedAt: "2026-11-20T09:00:00.000Z",
  updatedAt: "2026-11-20T09:00:00.000Z",
  ...o,
});
const merge = (incoming, local) =>
  mergeLessons([incoming], new Map(local ? [[local.lessonId, local]] : []))[0];

test("backup older than local: keep higher best, keep newer local attempt", () => {
  const out = merge(
    row({}),
    row({
      attempts: 4,
      bestScore: 0.875,
      lastScore: 0.75,
      startedAt: "2026-11-18T09:00:00.000Z",
      updatedAt: "2026-11-24T09:00:00.000Z",
    }),
  );
  assert.equal(out.bestScore, 1);
  assert.equal(out.lastScore, 0.75);
  assert.equal(out.updatedAt, "2026-11-24T09:00:00.000Z");
  assert.equal(out.attempts, 4);
  assert.equal(out.startedAt, "2026-11-18T09:00:00.000Z");
});

test("backup newer than local: take backup attempt", () => {
  const out = merge(
    row({ updatedAt: "2026-11-25T09:00:00.000Z", lastScore: 0.9 }),
    row({
      bestScore: 0.5,
      lastScore: 0.5,
      updatedAt: "2026-11-21T09:00:00.000Z",
    }),
  );
  assert.equal(out.lastScore, 0.9);
  assert.equal(out.updatedAt, "2026-11-25T09:00:00.000Z");
});

test("equal dates: backup attempt wins (unchanged behaviour)", () => {
  const out = merge(
    row({ lastScore: 1 }),
    row({ bestScore: 0.5, lastScore: 0.4 }),
  );
  assert.equal(out.lastScore, 1);
  assert.equal(out.updatedAt, "2026-11-20T09:00:00.000Z");
});

test("local row missing lastScore/updatedAt: backup attempt wins", () => {
  const local = {
    lessonId: "pa1-alphabet",
    status: "started",
    attempts: 1,
    bestScore: 0,
    startedAt: "2026-11-24T10:00:00.000Z",
    completedAt: null,
  };
  const out = merge(row({}), local);
  assert.equal(out.lastScore, 1);
  assert.equal(out.updatedAt, "2026-11-20T09:00:00.000Z");
  assert.equal(out.attempts, 2);
  assert.equal(out.startedAt, "2026-11-19T09:00:00.000Z");
});

test("new lesson is added unchanged", () => {
  const incoming = row({ lessonId: "pa1-numbers" });
  assert.deepEqual(merge(incoming, null), incoming);
});

test("lower-scoring, not-newly-completed backup row is skipped", () => {
  assert.deepEqual(
    mergeLessons(
      [row({ bestScore: 0.4 })],
      new Map([["pa1-alphabet", row({ bestScore: 0.9 })]]),
    ),
    [],
  );
});

test("newly completed with lower best keeps the higher local best", () => {
  const out = merge(
    row({ bestScore: 0.6 }),
    row({ status: "started", bestScore: 0.8, completedAt: null }),
  );
  assert.equal(out.status, "completed");
  assert.equal(out.bestScore, 0.8);
});
