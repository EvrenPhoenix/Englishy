import { Link } from "react-router";
import {
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  Lock,
  Sparkles,
  GraduationCap,
  BookBookmark,
  Mic,
  PenLine,
  MessageCircle,
  Languages,
  Accessibility,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import { BRAND } from "../../../shared/brand";
import { LEVELS, LEVEL_LABELS } from "../../../shared/constants";
import { Brand } from "../components/Brand";
import { ButtonLink } from "../components/ui";
import { ThemeToggle } from "../components/ThemeToggle";
import {
  TutorMark,
  TutorMessage,
  LearnerBubble,
} from "../components/ChatMessages";
import {
  badges,
  steps,
  features,
  learningFeatures,
  trustFeatures,
  faq,
} from "../data/catalogues";
import { availableLevels } from "../data/course-metadata";
import { scenarios } from "../data/scenarios";
import { guides } from "../data/guides";
import { usePageMeta } from "../lib/use-page-meta";
const iconMap = {
  GraduationCap,
  Sparkles,
  MessageCircle,
  Mic,
  BookBookmark,
  PenLine,
  Languages,
  Accessibility,
  ShieldCheck,
  WifiOff,
};
const featureCards = features.map((item) => ({
  ...item,
  icon: iconMap[item.icon],
}));
const learningCards = learningFeatures.map((item) => ({
  ...item,
  icon: iconMap[item.icon],
}));
const trustCards = trustFeatures.map((item) => ({
  ...item,
  icon: iconMap[item.icon],
}));
const toneClasses = {
  primary: "bg-primary-soft text-primary-text",
  indigo: "bg-indigo-soft text-indigo",
  accent: "bg-accent-soft text-accent",
};
export function Landing() {
  usePageMeta({ description: BRAND.description, path: "/" });
  return (
    <div className="min-h-dvh bg-bg">
      <SiteHeader />
      <main id="main">
        <Hero />
        <FirstSteps />
        <Features />
        <ConversationPreview />
        <Levels />
        <LearningFeatures />
        <TrustFeatures />
        <FrequentlyAskedQuestions />
      </main>
      <SiteFooter />
    </div>
  );
}
function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" aria-label={`${BRAND.name} home`} className="rounded-lg">
          <Brand />
        </Link>
        <nav
          aria-label="Site"
          className="hidden items-center gap-1 text-sm font-medium text-muted md:flex"
        >
          {[
            [`#features`, `Features`],
            [`#levels`, `Levels`],
            [`#privacy`, `Privacy`],
            [`#faq`, `FAQ`],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="rounded-full px-3 py-1.5 hover:bg-surface-2 hover:text-text"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <ButtonLink to="/home" variant="secondary" size="sm">
            Open app
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="aurora" aria-hidden={true} />
      <div className="relative z-10 mx-auto max-w-4xl px-4 pt-14 pb-12 text-center sm:px-6 lg:pt-24">
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3.5 py-1.5 text-sm text-muted backdrop-blur">
          <Sparkles className="size-4 text-primary-text" aria-hidden={true} />
          {" Free · No account needed"}
        </p>
        <h1 className="mt-6 text-[2.6rem] leading-[1.06] font-semibold tracking-tight text-balance sm:text-6xl lg:text-[4.25rem]">
          {"Learn English "}
          <span className="text-gradient">from your very first word.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted sm:text-xl">
          {BRAND.tagline}
          {
            " Clear lessons, friendly practice and a patient AI tutor that explains things at your level."
          }
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <ButtonLink
            to="/start"
            size="lg"
            iconEnd={ArrowRight}
            className="px-7"
          >
            Start learning
          </ButtonLink>
          <ButtonLink
            to="/tutor"
            size="lg"
            variant="secondary"
            icon={MessageCircle}
          >
            Try the AI tutor
          </ButtonLink>
        </div>
        <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted">
          {badges.map((badge) => (
            <li key={badge} className="flex items-center gap-1.5">
              <Check className="size-4 text-primary" aria-hidden={true} />{" "}
              {badge}
            </li>
          ))}
        </ul>
      </div>
      <div className="relative z-10 mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <TutorPreview />
      </div>
    </section>
  );
}
function FirstSteps() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
      <ol className="grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.t} className="rounded-3xl bg-surface-2 p-6">
            <span
              className="bg-brand-deep grid size-10 place-items-center rounded-full text-base font-semibold text-white"
              aria-hidden={true}
            >
              {index + 1}
            </span>
            <h2 className="mt-4 text-lg font-semibold">{step.t}</h2>
            <p className="mt-1 text-muted">{step.d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
function Features() {
  return (
    <section
      id="features"
      className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6"
    >
      <div className="max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Everything you need to start speaking
        </h2>
        <p className="mt-3 text-lg text-muted">
          A real course, not just a chatbot. AI helps where it adds value; the
          core lessons work without it.
        </p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featureCards.map(({ icon: Icon, tone, title, text }) => (
          <div key={title} className="card p-6">
            <span
              className={`grid size-12 place-items-center rounded-2xl ${toneClasses[tone]}`}
              aria-hidden={true}
            >
              <Icon className="size-6" />
            </span>
            <h3 className="mt-5 text-lg font-semibold">{title}</h3>
            <p className="mt-1.5 text-muted">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
function ConversationPreview() {
  return (
    <section className="bg-surface-2/60 py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Practise the conversations you will really have
          </h2>
          <p className="mt-4 text-lg text-muted">
            The AI plays a role, like a café server or a hotel receptionist. You
            choose how much help you want: suggested replies, vocabulary,
            sentence starters or a translation. At the end, you get a short
            report with what went well and what to practise next.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {scenarios.slice(0, 8).map((scenario) => (
              <li
                key={scenario.id}
                className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm"
              >
                {scenario.title}
              </li>
            ))}
            <li className="rounded-full px-3 py-1.5 text-sm text-muted">
              {"+ "}
              {scenarios.length - 8}
              {" more"}
            </li>
          </ul>
        </div>
        <figure className="card p-5 shadow-raised sm:p-6">
          <figcaption className="mb-5 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-semibold">Ordering food · Example</span>
            <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted">
              Only big mistakes
            </span>
          </figcaption>
          <div className="space-y-5 text-[0.95rem]">
            <TutorMessage name="Sam">
              Good afternoon! Here is the menu. Can I get you something to drink
              first?
            </TutorMessage>
            <LearnerBubble>Yes, I want one orange juice please.</LearnerBubble>
            <TutorMessage name="Sam">
              Of course, one orange juice. And would you like something to eat?
            </TutorMessage>
            <LearnerBubble>Can I have the soup of the day?</LearnerBubble>
          </div>
          <div className="mt-5 rounded-2xl bg-primary-soft p-4 text-sm">
            <p className="font-semibold text-primary-text">
              From the end-of-conversation report
            </p>
            <p className="mt-1">
              {"More natural: "}
              <strong>“I’d like an orange juice, please.”</strong>
              {" “I’d like” sounds more polite than “I want” when ordering."}
            </p>
          </div>
          <p className="mt-3 text-xs text-muted">
            Illustrative example of the format. Real replies are generated by
            the AI and vary.
          </p>
        </figure>
      </div>
    </section>
  );
}
function Levels() {
  return (
    <section
      id="levels"
      className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6"
    >
      <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Levels
      </h2>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        Lessons follow the Common European Framework of Reference (CEFR). This
        is a learning structure, not an official certificate.
      </p>
      <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {LEVELS.map((level) => {
          const available = availableLevels.some(
            (availableLevel) => availableLevel === level,
          );
          return (
            <li
              key={level}
              className={`rounded-3xl p-5 ${available ? "bg-primary-soft" : "bg-surface-2"}`}
            >
              <p className="flex items-center justify-between">
                <span className="text-xl font-semibold">
                  {LEVEL_LABELS[level].code}
                </span>
                {available ? (
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-on-primary">
                    Available
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-muted">
                    <Lock className="size-3" aria-hidden={true} />
                    {" Planned"}
                  </span>
                )}
              </p>
              <p className="mt-1 text-sm text-muted">
                {LEVEL_LABELS[level].name}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
function LearningFeatures() {
  return (
    <section className="bg-surface-2/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-3">
        <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Learning that adapts to you
        </h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:col-span-2">
          {learningCards.map(({ icon: Icon, t: title, d: description }) => (
            <li key={title} className="flex gap-4">
              <span
                className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-primary-text shadow-card"
                aria-hidden={true}
              >
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-muted">{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
function TrustFeatures() {
  return (
    <section
      id="privacy"
      className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6"
    >
      <div className="grid gap-4 md:grid-cols-3">
        {trustCards.map(({ icon: Icon, t: title, d: description }) => (
          <div key={title} className="card p-6">
            <Icon className="size-6 text-primary" aria-hidden={true} />
            <h2 className="mt-4 text-lg font-semibold">{title}</h2>
            <p className="mt-1.5 text-muted">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
function FrequentlyAskedQuestions() {
  return (
    <section
      id="faq"
      className="mx-auto max-w-3xl scroll-mt-20 px-4 pb-20 sm:px-6"
    >
      <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Frequently asked questions
      </h2>
      <div className="mt-8 divide-y divide-border rounded-3xl border border-border bg-surface">
        {faq.map((entry) => (
          <details key={entry.q} className="group px-6 py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
              {entry.q}
              <ChevronDown
                className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180"
                aria-hidden={true}
              />
            </summary>
            <p className="mt-3 text-muted">{entry.a}</p>
          </details>
        ))}
      </div>
      <div className="bg-brand-deep relative mt-12 overflow-hidden rounded-[2rem] px-6 py-12 text-center text-white">
        <h2 className="text-3xl font-semibold tracking-tight">
          Ready for your first lesson?
        </h2>
        <p className="mt-2 text-white/90">
          It takes about a minute to set up. You can skip every question.
        </p>
        <Link
          to="/start"
          className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 font-medium text-[#0b3b37] transition-transform hover:bg-white/90 active:scale-[0.98]"
        >
          {"Start learning "}
          <ArrowRight
            className="size-[1.1em] rtl:-scale-x-100"
            aria-hidden={true}
          />
        </Link>
      </div>
    </section>
  );
}
function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <Brand />
          <p className="mt-3 text-sm text-muted">{BRAND.tagline}</p>
        </div>
        <nav aria-label="Learn">
          <h2 className="text-sm font-semibold">Learn</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link className="hover:text-text" to="/learn">
                Course
              </Link>
            </li>
            <li>
              <Link className="hover:text-text" to="/grammar">
                Grammar library
              </Link>
            </li>
            <li>
              <Link className="hover:text-text" to="/vocabulary">
                Vocabulary
              </Link>
            </li>
            <li>
              <Link className="hover:text-text" to="/conversation">
                Conversation practice
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Guides">
          <h2 className="text-sm font-semibold">Guides</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {guides.map((guide) => (
              <li key={guide.slug}>
                <Link className="hover:text-text" to={`/guides/${guide.slug}`}>
                  {guide.short}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="About">
          <h2 className="text-sm font-semibold">About</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link className="hover:text-text" to="/help">
                {"Help & About"}
              </Link>
            </li>
            <li>
              <Link className="hover:text-text" to="/help#privacy">
                Privacy
              </Link>
            </li>
            <li>
              <Link className="hover:text-text" to="/help#accessibility">
                Accessibility
              </Link>
            </li>
            <li>
              <Link className="hover:text-text" to="/settings">
                Settings
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <p className="border-t border-border px-4 py-5 text-center text-xs text-muted">
        {BRAND.name}
        {
          " is a free learning project. AI features are powered by NVIDIA models. Not affiliated with any examination board."
        }
      </p>
    </footer>
  );
}
function TutorPreview() {
  return (
    <div
      className="relative"
      role="img"
      aria-label={`Example: ${BRAND.tutorName} corrects “I am go to market yesterday.” and explains why.`}
    >
      <div
        className="absolute -inset-3 -z-10 rounded-[2.5rem] bg-gradient-to-br from-primary-soft via-transparent to-indigo-soft opacity-80"
        aria-hidden={true}
      />
      <div className="card overflow-hidden rounded-[1.75rem] text-start shadow-raised">
        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <TutorMark className="size-8" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {BRAND.tutorName}
              {" · AI tutor"}
            </p>
            <p className="text-xs text-muted">Level A1 · explains in Spanish</p>
          </div>
        </div>
        <div className="space-y-6 px-5 py-6 text-[0.97rem]">
          <LearnerBubble>I am go to market yesterday.</LearnerBubble>
          <TutorMessage>
            <p>Good try! I understood what you meant. 😊</p>
            <p className="mt-2">
              {"A more natural sentence is: "}
              <strong className="text-primary-text">
                I went to the market yesterday.
              </strong>
            </p>
            <p className="mt-2">
              {"We use "}
              <em>went</em>
              {" because the action happened in the past. "}
              <span className="text-muted">(“went” = “fui”)</span>
            </p>
            <p className="mt-2">
              Can you tell me something else you did yesterday?
            </p>
          </TutorMessage>
        </div>
        <div className="px-4 pb-4" aria-hidden={true}>
          <div className="flex items-center justify-between gap-3 rounded-full border border-border bg-surface py-1.5 ps-5 pe-1.5 text-muted">
            <span className="truncate text-sm">
              {"Ask "}
              {BRAND.tutorName}
              {" anything about English…"}
            </span>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
              <ArrowUp className="size-4.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
