// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/spine-simulator/',   // ⭐ GitHub 레포 이름과 동일
  plugins: [
    react(),
    tailwindcss(),             // ⭐ Tailwind 플러그인 활성화
  ],
  build: {
    outDir: 'docs',            // ⭐ GitHub Pages용 docs 폴더
  },
})
