/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    red: '#E60000',      // Primary Action
                    dark: '#1A1A1A',     // Headings, Text
                    gray: '#F5F5F5',     // Backgrounds
                    border: '#E5E5E5',   // Borders
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
