/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            fontFamily: {
                outfit: ["Outfit_400Regular"],
                "outfit-medium": ["Outfit_500Medium"],
                "outfit-bold": ["Outfit_700Bold"],
            },
            colors: {
                primary: "#2563EB", // Electric Blue
                secondary: "#1E293B", // Slate
                background: "#F8FAFC", // Light Gray
                surface: "#FFFFFF",
            },
        },
    },
    plugins: [],
}
