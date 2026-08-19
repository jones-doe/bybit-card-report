import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The app talks to api.bybit.com straight from the browser — CORS is allowed on
// that endpoint. The /bybit proxy below stays as an escape hatch: set
// VITE_BYBIT_BASE=/bybit to route requests through the dev server instead.
//
// VITE_BASE is set by the Pages workflow so the build works from a repo
// subpath (https://user.github.io/<repo>/).
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    proxy: {
      '/bybit': {
        target: 'https://api.bybit.com',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/bybit/, ''),
      },
    },
  },
})
