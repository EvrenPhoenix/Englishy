import { Component, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

/**
 * Catches render errors in a page so the rest of the app keeps working. A failed
 * chunk download (offline or after a new release) gets its own message.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error("View error:", error.name);
  }
  render() {
    if (!this.state.error) return this.props.children;
    const chunkFailed =
      /Loading chunk|dynamically imported module|Failed to fetch/i.test(
        this.state.error.message,
      );
    return (
      <div className="mx-auto max-w-lg py-16 text-center" role="alert">
        <span
          className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-danger-soft text-danger"
          aria-hidden
        >
          <TriangleAlert className="size-6" />
        </span>
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-muted">
          {chunkFailed
            ? "This part of the app could not be loaded. You may be offline, or a new version was released."
            : "Sorry, this part of the app had a problem. Your progress is saved."}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-11 rounded-xl bg-primary px-4 font-medium text-on-primary"
          >
            Reload page
          </button>
          <a
            href="/home"
            className="inline-flex h-11 items-center rounded-xl border border-border-strong px-4 font-medium"
          >
            Go home
          </a>
        </div>
      </div>
    );
  }
}
