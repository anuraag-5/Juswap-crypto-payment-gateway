import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
  				DEFAULT: '#FF6200',
  				background: '#FFEFE3',
  				secondary: '#FFB658'
  			},
      },
      screens: {
        'xl-custom': '1579px',
      },
      fontFamily: {
        itim: "var(--font-itim)", 
      },
    },
  },
  plugins: [],
} satisfies Config;
