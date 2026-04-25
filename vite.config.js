import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  base: '',
  build: {
    outDir: 'extension/dashboard',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': '/src',
      '@logic': '/logic',
      '@services': '/services',
      '@storage': '/storage',
      '@profile': '/profile',
    }
  }
})
