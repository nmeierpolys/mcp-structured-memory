import { defineConfig } from 'vite'

export default defineConfig({
  // Since this is a Node.js project, we don't need most Vite features
  // This config is primarily for Vitest
  test: {
    // Vitest configuration
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts'
      ]
    }
  }
})