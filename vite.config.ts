import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // Idhonat-Brand-Kit's Button.tsx reads process.env.NODE_ENV (a Node/CRA convention);
  // Vite doesn't polyfill `process` in the browser, so define it explicitly.
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
}))
