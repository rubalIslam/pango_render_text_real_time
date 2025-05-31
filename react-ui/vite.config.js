import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: '.',           // root folder
  publicDir: 'public', // serve static files from public
  build: {
    outDir: 'dist',
  },
  server: {
    host: '0.0.0.0',
  },
  plugins: [react()],
})
