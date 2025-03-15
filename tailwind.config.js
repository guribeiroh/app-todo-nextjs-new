/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6366F1",
        secondary: "#10B981",
        danger: "#F43F5E",
        warning: "#F59E0B",
        dark: {
          DEFAULT: "#111827",
          lighter: "#1F2937",
          card: "#262F3F",
          accent: "#323B4B"
        },
        light: "#F9FAFB",
        accent: "#8B5CF6",
        gray: {
          '50': '#f9fafb',
          '100': '#f3f4f6',
          '200': '#e5e7eb',
          '300': '#d1d5db',
          '400': '#9ca3af',
          '500': '#6b7280',
          '600': '#4b5563',
          '700': '#374151',
          '750': '#2d3748',
          '800': '#1f2937',
          '900': '#111827',
          '950': '#030712',
        },
      },
      animation: {
        "slide-in": "slideIn 0.3s ease-out forwards",
        "fade-in": "fadeIn 0.3s ease-out forwards",
        "bounce-light": "bounceLight 1s infinite",
        "pulse-subtle": "pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
      },
      keyframes: {
        slideIn: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" }
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 }
        },
        bounceLight: {
          "0%, 100%": { transform: "translateY(-5%)" },
          "50%": { transform: "translateY(0)" }
        },
        pulseSubtle: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.85 }
        }
      },
      boxShadow: {
        'inner-top': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'glow': '0 0 15px rgba(99, 102, 241, 0.5)',
        'neon': '0 0 5px theme(colors.primary), 0 0 20px rgba(99, 102, 241, 0.3)'
      },
      backdropBlur: {
        'xs': '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")"
      }
    }
  },
  plugins: []
} 