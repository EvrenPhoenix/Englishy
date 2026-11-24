// Read the pinned release as an independent oracle. For modules that mount React,
// evaluate only the named top-level declarations, with their original imports.
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import assert from "node:assert/strict";
import ts from "typescript";

const assets = new URL("../../frontend-compiled/assets/", import.meta.url);
const chunk = (name) => new URL(name, assets);
const entry = "englishy-eb9f4dbb9de9/index-CJhEbyla.js";
const exerciseFile = "types-XKRjlI-1.js";

async function bindings(file, names, result, scope = {}) {
  const source = ts.createSourceFile(
    file,
    readFileSync(chunk(file), "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  const declarations = new Map();
  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement)) {
      declarations.set(statement.name.text, statement.getText());
    } else if (ts.isVariableStatement(statement)) {
      for (const variable of statement.declarationList.declarations) {
        declarations.set(variable.name.text, "var " + variable.getText());
      }
    } else if (
      ts.isImportDeclaration(statement) &&
      statement.moduleSpecifier.text === "./" + exerciseFile
    ) {
      const helpers = await import(chunk(exerciseFile));
      for (const spec of statement.importClause.namedBindings.elements) {
        scope[spec.name.text] = helpers[(spec.propertyName ?? spec.name).text];
      }
    }
  }
  const statements = names.map((name) => {
    assert(declarations.has(name), `Missing ${name} in ${file}`);
    return declarations.get(name);
  });
  return runInNewContext([...statements, result].join(";\n"), scope, {
    filename: file,
    timeout: 2000,
  });
}

// Content arrays in the landing route have no top-level binding. Select their
// literal initializers by their first item so the check does not need a DOM.
function landingLists(scope) {
  const file = "Landing-BItdrU_K.js";
  const source = ts.createSourceFile(
    file,
    readFileSync(chunk(file), "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  const starts = {
    badges: "[`Tips in 8",
    steps: "[{t:`Tell us",
    learningFeatures: "[{icon:w,t:",
    trustFeatures: "[{icon:P,t:",
  };
  const lists = {};
  function visit(node) {
    if (ts.isArrayLiteralExpression(node)) {
      for (const [name, prefix] of Object.entries(starts)) {
        if (node.getText().startsWith(prefix))
          lists[name] = runInNewContext(node.getText(), scope);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.deepEqual(Object.keys(lists).sort(), Object.keys(starts).sort());
  return lists;
}

async function helpArticles(brand) {
  // Drop presentation properties but retain exact text fragments, semantic
  // markup and link destinations. Collect the three AI status strings separately.
  let status;
  const element = (tag, { children, to, id, title }) => ({
    tag,
    ...(to && { to }),
    ...(id && { id }),
    ...(title && { title }),
    children,
  });
  const render = await bindings("Help-cVwVNBeO.js", ["h"], "h", {
    c: brand,
    u: () => (key) => key,
    d: () => status,
    r: () => ({}),
    l: () => {},
    f: { useEffect() {} },
    p: { jsx: element, jsxs: element },
    e: "Info",
    o: "heading",
    t: "link",
    m: "section",
  });
  const sectionNodes = () =>
    render().children.filter((node) => node.tag === "section");
  const statusText = {};
  for (const [key, value] of [
    ["loading", undefined],
    ["online", { available: true }],
    ["offline", { available: false }],
  ]) {
    status = value;
    const section = sectionNodes().find((node) => node.id === "ai");
    statusText[key] = section.children[0].children.find(
      (node) => node.tag === "strong",
    ).children;
  }
  const articles = sectionNodes();
  articles
    .find((node) => node.id === "ai")
    .children[0].children.find((node) => node.tag === "strong").children = {
    statusText,
  };
  return articles
    .filter((node) => node.tag === "section")
    .map(({ id, title, children }) => ({ id, title, children }));
}

export async function compiledContent() {
  const course = await bindings(
    entry,
    [
      "Nn",
      "Pn",
      "jn",
      "Mn",
      "Fn",
      "In",
      "Ln",
      "Rn",
      "or",
      "Yn",
      "sr",
      "rr",
      "at",
      "ot",
      "$n",
      "er",
    ],
    "({ lessons: Rn, units: Fn, availableLevels: In, levelDescriptions: Ln, progress: or, vocabCounts: sr, minutes: rr, streak: er })",
  );
  const evaluateAchievements = await bindings(
    "achievements-DIIZM8R4.js",
    ["i"],
    "i",
    {
      e: course.progress,
      t: course.minutes,
      n: course.streak,
      r: course.vocabCounts,
    },
  );
  const empty = {
    activities: [],
    lessons: [],
    vocab: [],
    streaksEnabled: true,
  };
  const achievements = evaluateAchievements(empty).map(
    ({ id, title, description, icon, progress }) => ({
      id,
      title,
      description,
      icon,
      target: progress.target,
    }),
  );
  const i18n = await import(chunk("i18n-DBb69MOl.js"));
  const english = await bindings("i18n-DBb69MOl.js", ["h"], "h");
  const localeChunks = await bindings("i18n-DBb69MOl.js", ["w"], "w");
  const dictionaries = { en: english };
  for (const locale of i18n.f.filter((code) => code !== "en")) {
    // Use the release's own registry to resolve the file and named export.
    const matched = localeChunks[locale]
      .toString()
      .match(/import\(`\.\/([^`]+)`\)\.then\(\w+=>\w+\.(\w+)\)/);
    assert(matched, `Unrecognised locale loader for ${locale}`);
    dictionaries[locale] = (await import(chunk(matched[1])))[matched[2]];
  }
  const vocabulary = await import(chunk("data-Dz1-iQqH.js"));
  const { t: scenarios } = await import(chunk("scenarios-CSJufgkR.js"));
  const { n: brand } = await import(chunk("brand-29nU70PD.js"));
  const landing = await bindings(
    "Landing-BItdrU_K.js",
    ["L", "R"],
    "({features:L,faq:R})",
    {
      i: brand,
      x: course.lessons,
      A: scenarios,
      m: "GraduationCap",
      f: "Sparkles",
      v: "MessageCircle",
      p: "Mic",
      h: "BookBookmark",
      y: "PenLine",
    },
  );
  const catalogues = {
    ...landing,
    ...landingLists({
      w: "Languages",
      f: "Sparkles",
      h: "BookBookmark",
      p: "Mic",
      P: "ShieldCheck",
      M: "Accessibility",
      g: "WifiOff",
    }),
    helpArticles: await helpArticles(brand),
    speakingActivities: await bindings("SpeakingPage-DdXS3g7D.js", ["P"], "P", {
      j: "Ear",
      t: "AudioLines",
      g: "Keyboard",
      n: "Repeat",
      r: "BookOpen",
    }),
    writingModes: await bindings("WritingPage-BYUUGQRC.js", ["w"], "w"),
    tutorPrompts: await bindings("TutorPage-NIENWIWu.js", ["fe"], "fe"),
    scenarioCategories: await bindings(
      "ConversationList-BKBigtTZ.js",
      ["y"],
      "y",
    ),
    activityLabels: await bindings(
      "englishy-eb9f4dbb9de9/Dashboard-CCpx_uau.js",
      ["Y"],
      "Y",
    ),
  };
  return {
    lessons: course.lessons,
    units: course.units,
    levelDescriptions: course.levelDescriptions,
    availableLevels: course.availableLevels,
    grammar: (await import(chunk("data-B9LX0-kj.js"))).t,
    vocabularyTopics: vocabulary.t,
    vocabulary: vocabulary.n,
    guides: (await import(chunk("guides-Ju1Gv_OJ.js"))).t,
    scenarios,
    achievements,
    evaluateAchievements,
    placement: await bindings("PlacementPage-CtwonDDd.js", ["M", "N"], "N"),
    placementSkills: await bindings("PlacementPage-CtwonDDd.js", ["B"], "B"),
    catalogues,
    dictionaries,
    constants: {
      LEVELS: i18n.c,
      LEVEL_LABELS: i18n.l,
      UI_LANGUAGES: i18n.f,
      NATIVE_LANGUAGES: i18n.d,
      LANGUAGE_NAMES: i18n.s,
      GOALS: i18n.o,
      VARIETIES: i18n.p,
      CORRECTION_MODES: i18n.a,
      WRITING_MODES: i18n.m,
      LIMITS: i18n.u,
    },
  };
}
