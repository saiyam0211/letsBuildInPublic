import js from '@eslint/js'
import globals from 'globals'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          'argsIgnorePattern': '^_',
          'varsIgnorePattern': '^_',
          'args': 'after-used',
          'ignoreRestSiblings': true
        }
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-unused-vars': 'off', // Turn off base rule to avoid conflicts
      'no-console': 'off', // Allow console in backend
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  // Special rules for Mongoose model files
  {
    files: ['src/models/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          'argsIgnorePattern': '^_|^this$',
          'varsIgnorePattern': '^_',
          'args': 'after-used',
          'ignoreRestSiblings': true
        }
      ],
    }
  }
] 