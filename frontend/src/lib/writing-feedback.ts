// Places AI writing issues back into the learner's text so they can be highlighted,
// accepted or rejected one by one.
import type { WritingIssue } from "../../../shared/schemas";

/**
 * Find each issue's `original` text, searching forward from the previous match so
 * repeated phrases map in order. Issues that cannot be placed, or would overlap an
 * earlier one, are left out of the highlights.
 */
function locateIssues(text: string, issues: WritingIssue[]) {
  const positions: { index: number; start: number; end: number }[] = [];
  const missing: number[] = [];
  let from = 0;
  issues.forEach((issue, index) => {
    let start = text.indexOf(issue.original, from);
    if (start === -1) start = text.indexOf(issue.original);
    const overlaps = positions.some(
      (p) => start < p.end && start + issue.original.length > p.start,
    );
    if (start === -1 || overlaps) missing.push(index);
    else {
      positions.push({ index, start, end: start + issue.original.length });
      from = start + issue.original.length;
    }
  });
  positions.sort((a, b) => a.start - b.start);
  return { positions, missing };
}

export interface TextSegment {
  text: string;
  issue?: number;
}

/** The text split into plain runs and runs that belong to an issue. */
export function segmentText(
  text: string,
  issues: WritingIssue[],
): TextSegment[] {
  const { positions } = locateIssues(text, issues);
  const segments: TextSegment[] = [];
  let at = 0;
  for (const p of positions) {
    if (p.start > at) segments.push({ text: text.slice(at, p.start) });
    segments.push({ text: text.slice(p.start, p.end), issue: p.index });
    at = p.end;
  }
  if (at < text.length) segments.push({ text: text.slice(at) });
  return segments;
}

/** The text with the accepted suggestions applied. */
export function applyAccepted(
  text: string,
  issues: WritingIssue[],
  accepted: Set<number>,
) {
  return segmentText(text, issues)
    .map((s) =>
      s.issue !== undefined && accepted.has(s.issue)
        ? issues[s.issue].suggestion
        : s.text,
    )
    .join("");
}

export function countWords(text: string) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}
