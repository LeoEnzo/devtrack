import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 18, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#8b7bff" />
          <stop offset="1" stopColor="#35d6b4" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#logo-gradient)" />
      <path
        d="M9 17.5l4.2 4.2L23 11"
        stroke="#0b0d12"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const Plus = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const Search = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

export const Board = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="3" y="4" width="7" height="16" rx="2" />
    <rect x="14" y="4" width="7" height="10" rx="2" />
  </svg>
);

export const Chart = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
);

export const LogOut = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <path d="M10 17l-5-5 5-5M5 12h10" />
  </svg>
);

export const Trash = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M6 7l1 13h10l1-13" />
  </svg>
);

export const Pencil = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 20h4l11-11a2.5 2.5 0 0 0-3.5-3.5L4 16.5V20z" />
  </svg>
);

export const X = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const ExternalLink = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M14 4h6v6M20 4l-9 9" />
    <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
  </svg>
);

export const Calendar = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);

export const Pin = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export const Alert = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 3l9.5 17H2.5L12 3z" />
    <path d="M12 9v5M12 17.5v.5" />
  </svg>
);

export const Spark = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
    <path d="M19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8L19 17z" />
  </svg>
);

export const Check = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 12.5l5 5L20 6.5" />
  </svg>
);
