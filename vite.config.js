// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command, mode }) => {
  const isElectron = mode === 'electron'
  const isOffline = mode === 'offline'
  const isWeb = mode === 'web'

  return {
    base: command === 'serve'
      ? '/'
      : (isElectron || isOffline ? './' : '/'),

    plugins: [react(), tailwindcss()],

    build: {
      outDir: isElectron ? 'dist-electron' : (isOffline ? 'web-offline' : (isWeb ? 'dist' : 'dist')),
      emptyOutDir: true,
    },
  }
})
