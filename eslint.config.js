import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { 
    ignores: [
      'dist',
      'node_modules',
      'build',
      '**/*.d.ts',
      'packages/**/*',
      'supabase/**/*',
      'scripts/**/*',
      'credentials/**/*',
      'docs/**/*',
      'documentation/**/*',
      'debug-tools/**/*',
      'testing/**/*',
      'test-*.js',
      'setup-*.js',
      '**/*.test.*',
      '**/*.spec.*',
      '**/*.stories.*',
      '**/test/**/*',
      '**/tests/**/*',
      'src/services/**/*', // Temporarily ignore services with many console.logs
      'src/utils/**/*',    // Temporarily ignore utils with many any types
      'EMERGENCY_BACKUP/**/*', // Ignore backup files
    ] 
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'no-console': 'off',
      'no-empty': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/prefer-as-const': 'off',
      'no-constant-condition': 'off',
      'no-case-declarations': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  // Special rules for test files
  {
    files: ['**/*.test.{ts,tsx,js,mjs}', '**/*.spec.{ts,tsx,js,mjs}', '**/testing/**/*.{ts,tsx,js,mjs}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
      'react-hooks/exhaustive-deps': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
  // Special rules for config files
  {
    files: ['**/*.config.{ts,js,mjs}', '**/.storybook/**/*.{ts,js}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
    },
  },
  // Special rules for compatibility layer (has complex database types)
  {
    files: ['**/src/components/ConversationStarterBank.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'prefer-const': 'off'
    }
  }
); 