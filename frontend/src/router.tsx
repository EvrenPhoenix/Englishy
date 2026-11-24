import { Onboarding } from "./pages/Onboarding";
import { PlacementPage } from "./pages/PlacementPage";
import { lazy } from "react";
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
};

export const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/guides/:slug", element: <Guide /> },
  {
    element: <Outlet />,
    children: [
      { path: "/start", element: <Onboarding /> },
      { path: "/placement", element: <PlacementPage /> },
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
      {
        path: "/grammar/:topicId",
        element: <Placeholder title="Grammar topic" />,
      },
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
