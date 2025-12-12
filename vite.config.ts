import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { threeMinifier } from '@yushijinhun/three-minifier-rollup'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    { ...threeMinifier(), enforce: 'pre' },
    react()
  ],
  optimizeDeps: {
    include: ['react-force-graph-3d', 'three'],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'force-graph': ['react-force-graph-3d'],
        }
      }
    }
  },
})
