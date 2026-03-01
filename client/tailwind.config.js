/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ['class'],
	content: ['./index.html', './src/**/*.{js,jsx}'],
	theme: {
    	extend: {
    		fontFamily: {
    			sans: [
    				'Inter',
    				'sans-serif'
    			],
    			heading: [
    				'Space Grotesk"',
    				'sans-serif'
    			]
    		},
    		colors: {
    			background: 'hsl(var(--background))',
    			surface: '#18181B',
    			surfaceHover: '#27272A',
    			border: 'hsl(var(--border))',
    			accent: {
    				primary: '#27272A',
    				button: '#FFFFFF',
    				text: '#000000',
    				secondary: '#18181B',
    				link: '#A1A1AA',
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			primary: {
    				'50': '#f0fdf4',
    				'100': '#dcfce7',
    				'200': '#bbf7d0',
    				'300': '#86efac',
    				'400': '#4ade80',
    				'500': '#22c55e',
    				'600': '#16a34a',
    				'700': '#15803d',
    				'800': '#166534',
    				'900': '#14532d',
    				'950': '#052e16',
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			gray: {
    				'50': '#fafafa',
    				'100': '#f4f4f5',
    				'200': '#e4e4e7',
    				'300': '#d4d4d8',
    				'400': '#a1a1aa',
    				'500': '#71717a',
    				'600': '#52525b',
    				'700': '#3f3f46',
    				'800': '#27272a',
    				'900': '#18181b',
    				'950': '#09090b'
    			},
    			foreground: 'hsl(var(--foreground))',
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			}
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
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
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out'
    		}
    	}
    },
	plugins: [require('@tailwindcss/typography'), require("tailwindcss-animate")],
};
