import js from '@eslint/js';
import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import pluginQuasar from '@quasar/app-vite/eslint';
import vueTsEslintConfig from '@vue/eslint-config-typescript';
import prettierSkipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import pluginImport from 'eslint-plugin-import';

export default [
  {
    ignores: ['scripts/license-check.js'],
  },

  ...pluginQuasar.configs.recommended(),
  js.configs.recommended,
  pluginImport.flatConfigs.recommended,
  pluginImport.flatConfigs.typescript,

  /**
   * https://eslint.vuejs.org
   *
   * pluginVue.configs.base
   *   -> Settings and rules to enable correct ESLint parsing.
   * pluginVue.configs[ 'flat/essential']
   *   -> base, plus rules to prevent errors or unintended behavior.
   * pluginVue.configs["flat/strongly-recommended"]
   *   -> Above, plus rules to considerably improve code readability and/or dev experience.
   * pluginVue.configs["flat/recommended"]
   *   -> Above, plus rules to enforce subjective community defaults to ensure consistency.
   */
  ...pluginVue.configs['flat/essential'],

  // https://github.com/vuejs/eslint-config-typescript
  ...vueTsEslintConfig({
    // Optional: extend additional configurations from typescript-eslint'.
    // Supports all the configurations in
    // https://typescript-eslint.io/users/configs#recommended-configurations
    extends: [
      // By default, only the recommended rules are enabled.
      'recommendedTypeChecked',
      // You can also manually enable the stylistic rules.
      // "stylistic",

      // Other utility configurations, such as 'eslintRecommended', (note that it's in camelCase)
      // are also extendable here. But we don't recommend using them directly.
    ],
  }),

  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',

      globals: {
        ...globals.browser,
        ...globals.node, // SSR, Electron, config files
        process: 'readonly', // process.env.*
        ga: 'readonly', // Google Analytics
        cordova: 'readonly',
        Capacitor: 'readonly',
        chrome: 'readonly', // BEX related
        browser: 'readonly', // BEX related
      },
    },

    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },

    // add your custom rules here
    rules: {
      'prefer-promise-reject-errors': 'off',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'import/order': 'error',

      // allow debugger during development only
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      'no-console': 'error',
    },
  },

  {
    files: ['src-pwa/custom-service-worker.ts'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
      },
    },
  },

  {
    files: ['test/**'],
    rules: {
      '@typescript-eslint/await-thenable': 'off',
    },
  },

  prettierSkipFormatting,
];
