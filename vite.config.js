import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' : GitHub Pages(저장소 하위 경로)와 Vercel 모두에서 동작
export default defineConfig({
  base: './',
  plugins: [react()],
})
