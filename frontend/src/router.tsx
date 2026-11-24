import { LearnPage } from "./pages/LearnPage";
import { GrammarPage } from "./pages/GrammarPage";
import { Landing } from "./pages/Landing";
import { Guide } from "./pages/Guide";
import { Help } from "./pages/Help";
import { NotFound } from "./pages/NotFound";
import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { AppShell } from "./components/AppShell";
import { navItems, type Destination } from "./components/navigation";
import { Placeholder } from "./pages/Placeholder";

const pages: Partial<Record<Destination, React.ReactElement>> = {
  learn: <LearnPage />,
  grammar: <GrammarPage />,
  help: <Help />,
};

export const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/guides/:slug", element: <Guide /> },
  {
    element: (
      <main id="main">
        <Outlet />
      </main>
    ),
    children: [
      { path: "/start", element: <Placeholder title="Onboarding" /> },
      { path: "/placement", element: <Placeholder title="Placement" /> },
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
