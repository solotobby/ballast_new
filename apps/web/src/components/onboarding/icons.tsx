import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 16, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconCheck({ size = 16, ...props }: IconProps) {
  return (
    <Svg size={size} strokeWidth="2.4" {...props}>
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconFlag({ size = 16, ...props }: IconProps) {
  return (
    <Svg size={size} {...props}>
      <path d="M4 21V4M4 4h13l-2 4 2 4H4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconSpark({ size = 16, ...props }: IconProps) {
  return (
    <Svg size={size} {...props}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconShield({ size = 16, ...props }: IconProps) {
  return (
    <Svg size={size} {...props}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
    </Svg>
  );
}

export function IconPin({ size = 16, ...props }: IconProps) {
  return (
    <Svg size={size} {...props}>
      <path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </Svg>
  );
}

export function IconUser({ size = 16, ...props }: IconProps) {
  return (
    <Svg size={size} {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0114 0" strokeLinecap="round" />
    </Svg>
  );
}

export function IconPlus({ size = 16, ...props }: IconProps) {
  return (
    <Svg size={size} strokeWidth="2.4" {...props}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </Svg>
  );
}

export const STEP_ICONS = {
  shield: IconShield,
  loc: IconPin,
  spark: IconSpark,
  check: IconCheck,
  user: IconUser,
} as const;

export type StepIcon = keyof typeof STEP_ICONS;
