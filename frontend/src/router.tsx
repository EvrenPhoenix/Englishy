import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { AppShell } from "./components/AppShell";
import { navItems, type Destination } from "./components/navigation";
import { Placeholder } from "./pages/Placeholder";

export const router = createBrowserRouter([
  {
    element: (
      <main id="main">
        <Outlet />
      </main>
    ),
    children: [
      { path: "/", element: <Placeholder title="Englishy" /> },
      { path: "/guides/:slug", element: <Placeholder title="Guide" /> },
      { path: "/start", element: <Placeholder title="Onboarding" /> },
      { path: "/placement", element: <Placeholder title="Placement" /> },
    ],
  },
  {
    element: <AppShell />,
    children: [
      ...(Object.keys(navItems) as Destination[]).map((id) => ({
        path: `/${id}`,
        element: <Placeholder message={`nav.${id}`} />,
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
      { path: "*", element: <Placeholder title="Page not found" /> },
    ],
  },
]);
