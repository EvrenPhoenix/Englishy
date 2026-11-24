// Answer checking for typed exercises. Forgiving by default: case, punctuation,
// contractions and British/American spelling are normalised, and near misses
// (small typos) return "almost" so learners can fix them before being marked.

const contractions: Record<string, string> = {
  "i'm": "i am",
  "you're": "you are",
  "we're": "we are",
  "they're": "they are",
  "it's": "it is",
  "he's": "he is",
  "she's": "she is",
  "that's": "that is",
  "what's": "what is",
  "where's": "where is",
  "who's": "who is",
  "there's": "there is",
  "isn't": "is not",
  "aren't": "are not",
  "wasn't": "was not",
  "weren't": "were not",
  "don't": "do not",
  "doesn't": "does not",
  "didn't": "did not",
  "can't": "cannot",
  "can not": "cannot",
  "couldn't": "could not",
  "won't": "will not",
  "wouldn't": "would not",
  "shouldn't": "should not",
  "haven't": "have not",
  "hasn't": "has not",
  "i've": "i have",
  "you've": "you have",
  "we've": "we have",
  "they've": "they have",
  "i'll": "i will",
  "you'll": "you will",
  "we'll": "we will",
  "they'll": "they will",
  "it'll": "it will",
  "i'd": "i would",
  "you'd": "you would",
  "let's": "let us",
};

// American → British spellings (a few entries map the other way for verb forms).
const spellings: Record<string, string> = {
  color: "colour",
  colors: "colours",
  favorite: "favourite",
  favorites: "favourites",
  neighbor: "neighbour",
  neighbors: "neighbours",
  neighborhood: "neighbourhood",
  honor: "honour",
  humor: "humour",
  flavor: "flavour",
  behavior: "behaviour",
  center: "centre",
  theater: "theatre",
  meters: "metres",
  liter: "litre",
  liters: "litres",
  gray: "grey",
  traveled: "travelled",
  traveling: "travelling",
  traveler: "traveller",
  canceled: "cancelled",
  canceling: "cancelling",
  organize: "organise",
  organized: "organised",
  realize: "realise",
  realized: "realised",
  apologize: "apologise",
  recognize: "recognise",
  practise: "practice",
  practised: "practiced",
  practising: "practicing",
  mom: "mum",
  catalog: "catalogue",
  dialog: "dialogue",
  jewelry: "jewellery",
  pajamas: "pyjamas",
  tire: "tyre",
  analyze: "analyse",
  defense: "defence",
  license: "licence",
  okay: "ok",
};

function normalise(text: string) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[“”"]/g, "")
    .replace(/\s+-\s+|\s+–\s+|\s+—\s+/g, " ")
    .replace(/[.,!?;:¿¡…()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function unifySpelling(text: string, strict: boolean) {
  return text
    .split(" ")
    .map((word) => (strict ? word : (spellings[word] ?? word)))
    .join(" ");
}
function expandContractions(text: string) {
  let padded = ` ${text} `;
  for (const [short, long] of Object.entries(contractions))
    padded = padded.replaceAll(` ${short} `, ` ${long} `);
  return padded.trim();
}
/** Comparable forms of an answer: as typed, and with contractions expanded. */
function variants(text: string, strict = false) {
  const base = unifySpelling(normalise(text), strict);
  const expanded = expandContractions(base);
  return expanded === base ? [base] : [base, expanded];
}

/** Damerau–Levenshtein (optimal string alignment) distance. */
function editDistance(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [
    i,
    ...Array<number>(b.length).fill(0),
  ]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  return d[a.length][b.length];
}

const exactForm = (text: string) =>
  text
    .normalize("NFKC")
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[.,!?;:"“”]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export type CheckResult = "correct" | "almost" | "incorrect";

export function checkText(
  given: string,
  accepted: string[],
  options: { strictSpelling?: boolean; caseSensitive?: boolean } = {},
): CheckResult {
  if (options.caseSensitive) {
    const loose = checkText(given, accepted, {
      strictSpelling: options.strictSpelling,
    });
    if (loose !== "correct") return loose;
    return accepted.some((answer) => exactForm(answer) === exactForm(given))
      ? "correct"
      : "almost";
  }
  const strict = Boolean(options.strictSpelling);
  const forms = variants(given, strict);
  if (!forms[0]) return "incorrect";
  let best = Infinity,
    bestLength = 0;
  for (const answer of accepted) {
    const answerForms = variants(answer, strict);
    if (forms.some((form) => answerForms.includes(form))) return "correct";
    for (const form of forms)
      for (const target of answerForms) {
        const distance = editDistance(form, target);
        if (distance < best) {
          best = distance;
          bestLength = target.length;
        }
      }
  }
  if (strict) return "incorrect";
  const tolerance = bestLength >= 8 ? 2 : Number(bestLength >= 4);
  return best <= tolerance ? "almost" : "incorrect";
}

/** Word-order answers must match exactly (apart from case and punctuation). */
export function checkOrder(
  given: string[],
  words: string[],
  alternatives: string[] = [],
) {
  return (
    checkText(given.join(" "), [words.join(" "), ...alternatives], {
      strictSpelling: true,
    }) === "correct"
  );
}

/** Deterministic shuffle so a question shows the same order every time. */
export function seededShuffle<T>(items: T[], seed: number) {
  const out = [...items];
  let state = seed || 1;
  const next = () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  // Never present the answer already in order.
  if (out.length > 1 && out.every((item, i) => item === items[i]))
    [out[0], out[1]] = [out[1], out[0]];
  return out;
}

export function seedFromId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(hash) + 1;
}

/** Which words of the target sentence were heard in a speech transcript. */
export function matchSpokenWords(target: string, transcript: string) {
  const words = normalise(target).split(" ").filter(Boolean);
  const heard = new Set(
    expandContractions(normalise(transcript))
      .split(" ")
      .concat(normalise(transcript).split(" ")),
  );
  return words.map((word) => ({
    word,
    matched:
      heard.has(word) ||
      heard.has(expandContractions(word)) ||
      expandContractions(word)
        .split(" ")
        .every((part) => heard.has(part)),
  }));
}
