import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isLocal = process.env.NODE_ENV === 'development'

export default defineConfig({
  plugins: [react()],

  server: {
    host: true,
    port: 5173,
    proxy: isLocal
      ? {
          '/api': {
            target: 'http://localhost:8000',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, '')
          }
        }
      : undefined
  },

  preview: {
    host: true,
    port: 10000,
    allowedHosts: [
      "zenvy-w6ey.onrender.com"
    ]
  }
})
