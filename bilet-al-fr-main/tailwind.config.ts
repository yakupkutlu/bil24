import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        theater: {
          black: '#0B0B0D',
          burgundy: '#12070A',
          red: '#7A0C0C',
          gold: '#B8860B',
          ivory: '#F5E8C7'
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif']
      },
      boxShadow: {
        glow: '0 0 45px rgba(184,134,11,.24)',
        strongGlow: '0 0 72px rgba(184,134,11,.34)',
        redGlow: '0 0 50px rgba(122,12,12,.35)'
      },
      backgroundImage: {
        curtain: 'radial-gradient(circle at 50% 0%, rgba(184,134,11,.17), transparent 32%), linear-gradient(135deg, #0B0B0D 0%, #12070A 45%, #22080C 100%)'
      },
      animation: {
        float: 'floatOrb 8s ease-in-out infinite alternate',
        spotlight: 'spotlightSweep 7s ease-in-out infinite'
      }
    }
  },
  plugins: []
} satisfies Config;
