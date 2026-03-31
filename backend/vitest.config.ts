import { defineConfig } from 'vitest/config'
import { config } from 'dotenv'
import { resolve } from 'node:path'

// テスト時は .env.test を読み込む
config({ path: resolve(process.cwd(), '.env.test') })

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
    // テスト用DB接続のためシーケンシャル実行
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
})
