/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  safelist: [
    'opacity-20', 'opacity-100', 'border-amber', 'glow-amber',
    'animate-fade-in', 'animate-fade-out', 'animate-slide-in-right',
    'animate-slide-out-left', 'animate-slide-in-left',
    'service-monolith', 'dimmed', 'selected',
    'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        amber: '#FFC107',
        'amber-glow': '#FFF020',
        surface: '#0D0D0D',
        'surface-2': '#111111',
        zinc: '#A1A1AA',
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        body: ['Poppins', 'sans-serif'],
        ui: ['Nunito', 'sans-serif'],
        display: ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeOut: {
          from: { opacity: '1', transform: 'translateY(0)' },
          to: { opacity: '0', transform: 'translateY(-16px)' },
        },
        pulseAmber: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(255,193,7,0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(255,193,7,0.8), 0 0 60px rgba(255,240,32,0.3)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fadeIn 0.5s ease forwards',
        'fade-out': 'fadeOut 0.5s ease forwards',
        'pulse-amber': 'pulseAmber 2s ease infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
