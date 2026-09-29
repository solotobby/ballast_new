import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 16, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...props}>
      {children}
    </svg>
  );
}

export function IconMail({ size = 22, ...props }: IconProps) {
  return (
    <Svg size={size} strokeWidth="1.9" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" strokeLinecap="round" />
    </Svg>
  );
}

export function IconLink({ size = 22, ...props }: IconProps) {
  return (
    <Svg size={size} strokeWidth="1.9" {...props}>
      <path
        d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1.5 1.5M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1.5-1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function IconBadge({ size = 22, ...props }: IconProps) {
  return (
    <Svg size={size} strokeWidth="1.9" {...props}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconArrowRight({ size = 15, ...props }: IconProps) {
  return (
    <Svg size={size} strokeWidth="2" {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconArrowLeft({ size = 15, ...props }: IconProps) {
  return (
    <Svg size={size} strokeWidth="2" {...props}>
      <path d="M19 12H5M11 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconCheck({ size = 15, ...props }: IconProps) {
  return (
    <Svg size={size} strokeWidth="2.6" {...props}>
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconShieldVerified({ size = 18, ...props }: IconProps) {
  return (
    <Svg size={size} strokeWidth="2" {...props}>
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
    </Svg>
  );
}

export function IconShield({ size = 20, ...props }: IconProps) {
  return (
    <Svg size={size} strokeWidth="2" {...props}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
    </Svg>
  );
}

export function IconLive({ size = 15, ...props }: IconProps) {
  return (
    <Svg size={size} strokeWidth="2" {...props}>
      <path d="M3 12h4l3 8 4-16 3 8h4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconCopy({ size = 15, ...props }: IconProps) {
  return (
    <Svg size={size} strokeWidth="2" {...props}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 012-2h10" strokeLinecap="round" />
    </Svg>
  );
}

export function IconEye({ size = 15, ...props }: IconProps) {
  return (
    <Svg size={size} strokeWidth="2" {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  );
}

export function IconLock({ size = 15, ...props }: IconProps) {
  return (
    <Svg size={size} strokeWidth="2" {...props}>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 018 0v3" strokeLinecap="round" />
    </Svg>
  );
}

export function IconSend({ size = 16, ...props }: IconProps) {
  return (
    <Svg size={size} strokeWidth="2" {...props}>
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconDownload({ size = 15, ...props }: IconProps) {
  return (
    <Svg size={size} strokeWidth="2" {...props}>
      <path d="M12 3v12M7 10l5 5 5-5M4 21h16" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconClose({ size = 18, ...props }: IconProps) {
  return (
    <Svg size={size} strokeWidth="2" {...props}>
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </Svg>
  );
}
