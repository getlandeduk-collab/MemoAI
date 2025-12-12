// Ensure GPUShaderStage is available globally before any Three.js/WebGL modules load
if (typeof self === 'undefined') {
  (globalThis as any).self = globalThis;
}
if (!(self as any).GPUShaderStage) {
  (self as any).GPUShaderStage = { VERTEX: 1, FRAGMENT: 2, COMPUTE: 4 };
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
