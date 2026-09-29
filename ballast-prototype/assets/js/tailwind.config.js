/* Ballast design tokens for the Tailwind Play CDN.
   Loaded AFTER the CDN script so Tailwind picks up the theme. */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        /* Signature light-blue brand ramp (primary) */
        brand: {
          50:  '#EFF8FE',
          100: '#D7EEFB',
          200: '#B3E0F7',
          300: '#7FCBF0', /* the light blue */
          400: '#4FB3E6',
          500: '#2E9BD6',
          600: '#1F7DB4', /* solid buttons (white text passes AA for UI) */
          700: '#1A6390',
          800: '#184F71',
          900: '#123A53'
        },
        /* Ink / black */
        ink:  { DEFAULT: '#111418', soft: '#1B222B', 700: '#232B35' },
        /* Neutral grey ramp */
        grey: {
          50:  '#F6F8FA',
          100: '#EEF2F6',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A'
        },
        /* Muted, harmonised status semantics (status is content, not decoration) */
        ok:   { DEFAULT: '#3E9E7A', bg: '#E7F3EE' },
        warn: { DEFAULT: '#C0891F', bg: '#FBF1DC' },
        bad:  { DEFAULT: '#C0503B', bg: '#F8E7E2' }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans:    ['"IBM Plex Sans"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.05)',
        pop:  '0 16px 40px -12px rgba(16,24,40,.22)'
      },
      borderRadius: { xl2: '14px' }
    }
  }
};
