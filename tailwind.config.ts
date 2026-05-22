import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Apple 风格令牌：背景使用纯净灰白 / 深邃黑
        canvas: {
          DEFAULT: '#F5F5F7',
          dark: '#000000',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#1C1C1E',
        },
        elevated: {
          DEFAULT: 'rgba(255,255,255,0.72)',
          dark: 'rgba(28,28,30,0.72)',
        },
        ink: {
          primary: '#1D1D1F',
          secondary: '#6E6E73',
          tertiary: '#86868B',
          inverse: '#F5F5F7',
        },
        hairline: {
          DEFAULT: 'rgba(0,0,0,0.08)',
          strong: 'rgba(0,0,0,0.14)',
          dark: 'rgba(255,255,255,0.10)',
        },
        accent: {
          DEFAULT: '#0071E3',
          hover: '#0077ED',
          mute: 'rgba(0,113,227,0.10)',
        },
        signal: {
          success: '#34C759',
          warning: '#FF9F0A',
          danger: '#FF3B30',
          info: '#5AC8FA',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"PingFang SC"',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: ['"SF Mono"', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontWeight: {
        light: '300',
        regular: '400',
        medium: '500',
        semibold: '600',
      },
      letterSpacing: {
        apple: '-0.022em',
      },
      backdropBlur: {
        xs: '4px',
        apple: '20px',
      },
      boxShadow: {
        hairline: '0 0 0 1px rgba(0,0,0,0.06)',
        floating: '0 12px 40px -8px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.04)',
        mega: '0 24px 60px -12px rgba(0,0,0,0.14)',
      },
      borderRadius: {
        '4xl': '28px',
      },
      transitionTimingFunction: {
        apple: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        caret: {
          '0%, 50%': { opacity: '1' },
          '50.01%, 100%': { opacity: '0' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        caret: 'caret 1s steps(1) infinite',
        rise: 'rise 360ms cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
};

export default config;
