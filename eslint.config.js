import eslintReact from '@eslint-react/eslint-plugin'
import js from '@eslint/js'
import nextPlugin from '@next/eslint-plugin-next'
import prettierConfig from 'eslint-config-prettier'
import perfectionist from 'eslint-plugin-perfectionist'
import prettierPlugin from 'eslint-plugin-prettier'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import tailwindcss from 'eslint-plugin-tailwindcss'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'

export default defineConfig(
  // JavaScript推奨設定
  js.configs.recommended,

  // TypeScript推奨設定
  tseslint.configs.recommended,

  // Perfectionist推奨設定（natural順序）
  perfectionist.configs['recommended-natural'],

  // React推奨設定（型情報を利用）
  {
    files: ['**/*.{ts,tsx}'],
    extends: [eslintReact.configs['recommended-type-checked']],
  },

  // React Hooks推奨設定
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      'react-hooks': reactHooksPlugin,
    },
    rules: reactHooksPlugin.configs.recommended.rules,
  },

  // Next.js設定
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },

  // カスタム設定とオーバーライド
  // Tailwind CSS設定
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    extends: [tailwindcss.configs.recommended],
    settings: {
      tailwindcss: {
        cssConfigPath: './src/app/globals.css',
      },
    },
    rules: {
      'tailwindcss/classnames-order': 'warn',
      'tailwindcss/no-custom-classname': 'off',
    },
  },

  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    plugins: {
      prettier: prettierPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',

      // Prettier
      'prettier/prettier': 'warn',
    },
  },

  // Prettierとの競合ルールを無効化（最後に適用）
  prettierConfig,
  {
    ignores: [
      '.next/**/*',
      'node_modules/**/*',
      'out/**/*',
      'test-results/**/*',
      'playwright-report/**/*',
      'public/**/*',
      'src/components/ui/**/*',
      '.eslintrc.js',
      'eslint.config.js',
      'next.config.js',
      'postcss.config.mjs',
      'next-env.d.ts',
    ],
  }
)
