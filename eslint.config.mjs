import { FlatCompat } from '@eslint/eslintrc';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

/** @type {import('eslint').Linter.Config[]} */
const config = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      '*.config.mjs',
      '*.config.ts',
      '*.config.js',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // React
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ============================================================
      // قاعدة #1: منع النصوص العربية الحرفية في JSX
      // كل نص ظاهر للمستخدم يجب أن يأتي من useTranslations()
      // ============================================================
      'no-restricted-syntax': [
        'error',
        {
          // منع نصوص عربية حرفية مباشرة في JSX (بين وسوم)
          selector:
            'JSXText[value=/[\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF]+/]',
          message:
            '❌ لا تضع نصوصاً عربية مباشرة في JSX. استخدم useTranslations() من next-intl.',
        },
        {
          // منع الأرقام الهندية (U+0660-U+0669) في الكود
          selector: 'Literal[value=/[٠-٩]/]',
          message:
            '❌ الأرقام الهندية (٠-٩) ممنوعة. استخدم الأرقام العربية الأصلية (0-9) فقط.',
        },
        {
          // منع الأرقام الفارسية (U+06F0-U+06F9) في الكود
          selector: 'Literal[value=/[۰-۹]/]',
          message:
            '❌ الأرقام الفارسية (۰-۹) ممنوعة. استخدم الأرقام العربية الأصلية (0-9) فقط.',
        },
        {
          // منع margin/padding اليسار/اليمين المباشر — استخدم Logical Properties
          selector:
            'JSXAttribute[name.name="className"][value.value=/\\b(ml|mr|pl|pr|text-left|text-right|left-|right-)\\d/]',
          message:
            '❌ استخدم Logical Properties بدلاً من Left/Right. مثال: ms- بدلاً من ml-، pe- بدلاً من pr-.',
        },
        {
          // منع localStorage للـ tokens
          selector:
            "MemberExpression[object.name='localStorage'][property.name=/token|jwt|session|auth/i]",
          message:
            '❌ لا تخزّن tokens في localStorage. استخدم httpOnly cookies فقط.',
        },
      ],

      // RTL — تفضيل Logical Properties
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['moment'],
              message: '❌ استخدم date-fns بدلاً من moment.js.',
            },
            {
              group: ['lodash'],
              message: '❌ استخدم lodash-es أو الدوال الأصلية بدلاً من lodash.',
            },
            {
              group: ['axios'],
              message: '❌ استخدم fetch الأصلي بدلاً من axios.',
            },
          ],
        },
      ],
    },
    settings: {
      react: { version: 'detect' },
    },
  },
];

export default config;
