import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// FIX: WebGPU shader constants (GPUShaderStage) being removed/minified in production.
// We force Vite to inject a safe fallback object globally.
const GPUStageFallback = {
  VERTEX: 1,
  FRAGMENT: 2,
  COMPUTE: 4
}

export default defineConfig({
  define: {
    // Ensure WebGPU shader constants ALWAYS exist in production
    'self.GPUShaderStage': JSON.stringify(GPUStageFallback),
  },

  plugins: [react()],

  optimizeDeps: {
    // Ensure three.js & dependencies are not tree-shaken incorrectly
    include: ['react-force-graph-3d', 'three'],
  },

  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },

    // Disable aggressive minification for shader code
    minify: "terser",
    terserOptions: {
      mangle: false,
      compress: false
    },

    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'force-graph': ['react-force-graph-3d'],
        }
      }
    }
  }
})
