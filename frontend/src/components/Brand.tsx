import { useId } from "react";
import { BRAND } from "../../../shared/brand";

export function Brand({ small = false }: { small?: boolean }) {
  const gradient = useId();
  return (
    <span
      className={`inline-flex items-center font-semibold tracking-tight ${small ? "gap-2" : "gap-2.5 text-lg"}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 64 64"
        className={small ? "size-7" : "size-8"}
      >
        <defs>
          <linearGradient
            id={gradient}
            x1="0"
            y1="0"
            x2="64"
            y2="64"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#14b8a6" />
            <stop offset=".55" stopColor="#0f766e" />
            <stop offset="1" stopColor="#4338ca" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="18" fill={`url(#${gradient})`} />
        <path
          fill="#fff"
          d="M19 15h26a8 8 0 0 1 8 8v13a8 8 0 0 1-8 8H31l-9 7v-7h-3a8 8 0 0 1-8-8V23a8 8 0 0 1 8-8Z"
        />
        {[20, 14, 20].map((width, i) => (
          <rect
            key={i}
            x="22"
            y={21.5 + i * 6.4}
            width={width}
            height="4.2"
            rx="2.1"
            fill="#0f766e"
          />
        ))}
      </svg>
      {BRAND.name}
    </span>
  );
}
