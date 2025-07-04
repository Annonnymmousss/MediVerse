import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  mode: 'development',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    host: true
  },
  build: {
    outDir: 'dist'  
  }
});
