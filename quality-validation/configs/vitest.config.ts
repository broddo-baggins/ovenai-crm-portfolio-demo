/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    
    // 🚨 CRITICAL: TEXT-ONLY REPORTERS - NO HTML REPORTS!
    reporters: [
      ['default', { summary: false }],
      'json'
    ],
    outputFile: {
      json: 'test-results/vitest-results.json'
    },
    
    // 🚨 CRITICAL: Exclude E2E tests, Playwright tests, and emergency backups
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      // Emergency backup directories
      '**/EMERGENCY_BACKUP/**',
      'emergency-backup/**',
      // E2E and Playwright tests
      '**/e2e/**',
      '**/quality-validation/**',
      '**/*.e2e.{ts,tsx,js,jsx}',
      '**/*.spec.{ts,tsx,js,jsx}', // Playwright tests
      '**/*.playwright.{ts,tsx,js,jsx}',
      // Only include actual unit tests
      '!src/**/*.test.{ts,tsx}',
      '!src/**/__tests__/**'
    ],
    
    // Only include unit tests from src directory
    include: [
      'src/**/*.test.{ts,tsx}',
      'src/**/__tests__/**/*.{ts,tsx}'
    ],
    
    // Coverage settings - text output only
    coverage: {
      reporter: ['text', 'json-summary'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'src/stories/',
        'src/**/*.stories.{ts,tsx}',
        '**/EMERGENCY_BACKUP/**',
        '**/quality-validation/**',
        '**/e2e/**'
      ]
    },
    
    // Prevent hangs
    testTimeout: 10000,
    hookTimeout: 10000,
    bail: 10 // Stop after 10 failures
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
