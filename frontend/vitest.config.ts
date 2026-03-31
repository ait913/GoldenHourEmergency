import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // テストファイルからの相対パス解決のため
      '../../components': path.resolve(__dirname, './src/components'),
      '../../lib': path.resolve(__dirname, './src/lib'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.tsx', 'src/**/*.test.ts'],
    root: '.',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
})
