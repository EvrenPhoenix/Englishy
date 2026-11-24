import { Onboarding } from "./pages/Onboarding";
import { PlacementPage } from "./pages/PlacementPage";
import { lazy, Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Landing } from "./pages/Landing";
import { Guide } from "./pages/Guide";
import { Help } from "./pages/Help";
import { NotFound } from "./pages/NotFound";
import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { AppShell } from "./components/AppShell";
import { navItems, type Destination } from "./components/navigation";
import { Placeholder } from "./pages/Placeholder";

const Dashboard = lazy(async () => ({
  default: (await import("./pages/Dashboard")).Dashboard,
}));
const LearnPage = lazy(async () => ({
  default: (await import("./pages/LearnPage")).LearnPage,
}));
const ProgressPage = lazy(async () => ({
  default: (await import("./pages/ProgressPage")).ProgressPage,
}));
const GrammarPage = lazy(async () => ({
  default: (await import("./pages/GrammarPage")).GrammarPage,
}));
const GrammarTopicPage = lazy(async () => ({
  default: (await import("./pages/GrammarTopicPage")).GrammarTopicPage,
}));
const VocabularyPage = lazy(async () => ({
  default: (await import("./pages/VocabularyPage")).VocabularyPage,
}));
const Settings = lazy(async () => ({
  default: (await import("./pages/Settings")).Settings,
}));
const ConversationList = lazy(async () => ({
  default: (await import("./pages/ConversationList")).ConversationList,
}));

const pages: Partial<Record<Destination, React.ReactElement>> = {
  home: <Dashboard />,
  progress: <ProgressPage />,
  conversation: <ConversationList />,
  learn: <LearnPage />,
  grammar: <GrammarPage />,
  help: <Help />,
  settings: <Settings />,
  vocabulary: <VocabularyPage />,
};

/** Public pages get the same error boundary and loading state as the app shell. */
const publicPage = (page: ReactNode) => (
  <ErrorBoundary>
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl p-6">
          <div className="space-y-3" role="status" aria-label="Loading…">
            <div
              className="animate-pulse rounded-2xl bg-surface-2 h-9 w-1/2"
              aria-hidden
            />
            <div
              className="animate-pulse rounded-2xl bg-surface-2 h-28 w-full"
              aria-hidden
            />
            <div
              className="animate-pulse rounded-2xl bg-surface-2 h-28 w-full"
              aria-hidden
            />
          </div>
        </div>
      }
    >
      {page}
    </Suspense>
  </ErrorBoundary>
);

export const router = createBrowserRouter([
  { path: "/", element: publicPage(<Landing />) },
  { path: "/guides/:slug", element: publicPage(<Guide />) },
  {
    element: <Outlet />,
    children: [
      { path: "/start", element: publicPage(<Onboarding />) },
      { path: "/placement", element: publicPage(<PlacementPage />) },
    ],
  },
  {
    element: <AppShell />,
    children: [
      ...(Object.keys(navItems) as Destination[]).map((id) => ({
        path: `/${id}`,
        element: pages[id] ?? <Placeholder message={`nav.${id}`} />,
      })),
      { path: "/learn/:lessonId", element: <Placeholder title="Lesson" /> },
      { path: "/grammar/:topicId", element: <GrammarTopicPage /> },
      {
        path: "/conversation/:scenarioId",
        element: <Placeholder title="Conversation" />,
      },
      { path: "/practice", element: <Navigate replace to="/practise" /> },
      { path: "/privacy", element: <Navigate replace to="/help#privacy" /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
