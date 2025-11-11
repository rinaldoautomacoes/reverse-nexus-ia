import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))', // Agora será ai-purple
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Futuristic custom colors
				neon: {
					cyan: 'hsl(var(--neon-cyan))',
					glow: 'hsl(var(--neon-cyan-glow))'
				},
				slate: {
					dark: 'hsl(var(--dark-slate))',
					darker: 'hsl(var(--darker-slate))'
				},
				ice: 'hsl(var(--ice-white))',
				neural: 'hsl(var(--neural-blue))',
				ai: 'hsl(var(--ai-purple))',
				'warning-yellow': 'hsl(var(--warning-yellow))',
				'success-green': 'hsl(var(--success-green))' // Agora será neon-cyan
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-secondary': 'var(--gradient-secondary)',
				'gradient-dark': 'var(--gradient-dark)'
			},
			boxShadow: {
				'neon': 'var(--shadow-neon)',
				'deep': 'var(--shadow-deep)',
				'card': 'var(--shadow-card)'
			},
			fontFamily: {
				'orbitron': ['Orbitron', 'monospace'],
				'inter': ['Inter', 'sans-serif']
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'pulse-glow': {
					'0%, 100%': { 
						boxShadow: '0 0 10px hsl(var(--neon-cyan) / 0.3)'
					},
					'50%': { 
						boxShadow: '0 0 30px hsl(var(--neon-cyan) / 0.6)'
					}
				},
				'slide-up': {
					from: {
						opacity: '0',
						transform: 'translateY(20px)'
					},
					to: {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'data-flow': {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(100%)' }
				},
                'truck-slide': { // Novo keyframe para o caminhão
                    '0%': { transform: 'translateX(-150%)' }, // Começa bem à esquerda, fora da tela
                    '100%': { transform: 'translateX(150%)' } // Termina bem à direita, fora da tela
                },
                'background-pan': { // Novo keyframe para o movimento de fundo
                    '0%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' },
                }
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'float': 'float 6s ease-in-out infinite',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'slide-up': 'slide-up 0.5s ease-out',
				'data-flow': 'data-flow 3s linear infinite',
                'truck-slide': 'truck-slide 15s linear infinite', // Aplica a nova animação
                'background-pan': 'background-pan 30s linear infinite' // Aplica a nova animação de fundo
			}
		}
	},
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;