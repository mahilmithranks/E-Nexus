import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      }
    }
  },

  build: {
    chunkSizeWarningLimit: 1600,
    // Split vendor libraries into separate cacheable chunks
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — almost never changes, cached aggressively
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Animation library
          'vendor-motion': ['framer-motion'],
          // Icons
          'vendor-icons': ['lucide-react'],
          // Face detection — large, split out so the rest of the app isn't blocked
          'vendor-faceapi': ['face-api.js'],
          // HTTP client + toast notifications
          'vendor-utils': ['axios', 'react-hot-toast', 'clsx', 'tailwind-merge'],
        }
      }
    },
    // Minify with terser for better compression
    minify: 'esbuild',
    // Generate source maps only in dev
    sourcemap: false,
    // Target modern browsers — smaller output, faster execution
    target: 'es2020',
  }
})
