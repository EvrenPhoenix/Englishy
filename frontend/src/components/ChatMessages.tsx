import type { ReactNode } from "react";
export function TutorMark({ className }: { className: string }) {
  return (
    <span
      className={`bg-brand-mark grid shrink-0 place-items-center rounded-full text-white ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="size-[55%]">
        <path
          d="M6.5 5h11A2.5 2.5 0 0 1 20 7.5v6a2.5 2.5 0 0 1-2.5 2.5H12l-4 3v-3H6.5A2.5 2.5 0 0 1 4 13.5v-6A2.5 2.5 0 0 1 6.5 5Z"
          fill="currentColor"
        />
        <path
          d="M8.5 8.6h7M8.5 10.6h4.6M8.5 12.6h7"
          stroke="#0f766e"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
export function TutorMessage({
  name,
  children,
}: {
  name?: string;
  children: ReactNode;
}) {
  return (
    <div className="group flex gap-3 sm:gap-4">
      <TutorMark className="mt-0.5 size-8" />
      <div className="min-w-0 flex-1">
        {name && <p className="mb-0.5 text-sm font-semibold">{name}</p>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
export function LearnerBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-end">
      <div
        dir="auto"
        className="max-w-[85%] rounded-3xl rounded-ee-lg bg-surface-2 px-4 py-2.5 break-words whitespace-pre-wrap sm:max-w-[75%]"
      >
        {children}
      </div>
    </div>
  );
}
