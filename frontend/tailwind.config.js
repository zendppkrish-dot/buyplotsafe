/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                emerald: {
                    500: '#10b981',
                    600: '#059669', // Requested Emerald Green
                    700: '#047857',
                },
                slate: {
                    800: '#1e293b',
                    900: '#0f172a', // Requested Slate
                }
            },
        },
    },
    plugins: [],
}
