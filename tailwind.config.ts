import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // ── Color tokens (Linear density + Apple semantics + Notion surfaces) ──
      colors: {
        hlb: {
          DEFAULT: '#0055B3',
          hover:   '#00429A',
          light:   '#EBF2FF',
          muted:   '#C2D9F5',
        },
        surface: {
          page:    'var(--surface-page)',
          card:    'var(--surface-card)',
          raised:  'var(--surface-raised)',
          overlay: 'var(--surface-overlay)',
        },
        border: {
          subtle:  'var(--border-subtle)',
          DEFAULT: 'var(--border-default)',
          strong:  'var(--border-strong)',
        },
        ink: {
          DEFAULT:   'var(--ink-primary)',
          secondary: 'var(--ink-secondary)',
          tertiary:  'var(--ink-tertiary)',
          disabled:  'var(--ink-disabled)',
          inverse:   '#FFFFFF',
        },
        success: { DEFAULT: '#1B9950', light: '#EBF7F0', text: '#166B38' },
        warning: { DEFAULT: '#E07B14', light: '#FEF4E7', text: '#9B5210' },
        danger:  { DEFAULT: '#D93026', light: '#FEEEED', text: '#9B1B13' },
        info:    { DEFAULT: '#0A7AFF', light: '#EAF2FF', text: '#0055CC' },
        accent:  { DEFAULT: '#5E6AD2', light: '#EEEFFE', text: '#3D48A9' },
      },

      // ── Typography ──
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.02em' }],
        xs:    ['11px', { lineHeight: '16px' }],
        sm:    ['12px', { lineHeight: '18px' }],
        base:  ['13px', { lineHeight: '20px' }],
        md:    ['14px', { lineHeight: '22px' }],
        lg:    ['16px', { lineHeight: '24px' }],
        xl:    ['18px', { lineHeight: '28px' }],
        '2xl': ['22px', { lineHeight: '32px' }],
      },

      // ── Border radius ──
      borderRadius: {
        none: '0',
        sm:   '4px',
        DEFAULT: '6px',
        md:   '8px',
        lg:   '10px',
        xl:   '12px',
        '2xl': '16px',
        full: '9999px',
      },

      // ── Shadows (Apple depth — barely-there) ──
      boxShadow: {
        xs:   '0 1px 2px rgba(0,0,0,0.04)',
        sm:   '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        DEFAULT: '0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        md:   '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        lg:   '0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
        none: 'none',
        focus:     '0 0 0 3px rgba(10,122,255,0.22)',
        focusBlue: '0 0 0 3px rgba(0,85,179,0.22)',
      },

      transitionDuration: { DEFAULT: '150ms', fast: '100ms', slow: '250ms' },
      transitionTimingFunction: { DEFAULT: 'cubic-bezier(0.16,1,0.3,1)' },
    },
  },
  plugins: [],
};
export default config;
