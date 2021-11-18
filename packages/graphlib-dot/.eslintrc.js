/* eslint-env node */
module.exports = {
  ignorePatterns: ['/dist', '/lib/dot-grammar.ts'],
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    'sourceType': 'module',
    'tsconfigRootDir': __dirname,
    'extraFileExtensions': ['.mjs'],
  },
  plugins: [
    'eslint-plugin-import',
    '@typescript-eslint',
    'deprecation',
  ],
  extends: [
    // Use eslint and typescript-eslint recommended lists
    //
    // See:
    // * https://eslint.org/docs/rules/
    // * https://www.npmjs.com/package/@typescript-eslint/eslint-plugin
    'eslint:recommended',
  ],
  rules: {
    // Correctness rules
    'array-callback-return': 'error',
    'eqeqeq': ['error', 'always'],
    'guard-for-in': 'error',
    'no-bitwise': 'error',
    'no-caller': 'error',
    'no-eval': 'error',
    'no-inner-declarations': ['warn', 'both'],
    'no-new-wrappers': 'error',
    'no-template-curly-in-string': 'error',
    'no-throw-literal': 'error',
    'no-undef-init': 'error',
    'no-unreachable-loop': 'error',
    'no-useless-backreference': 'error',
    'no-mixed-operators': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'semi': 'error',
    'no-loop-func': 'error',

    // Style rules
    'brace-style': ['warn', 'stroustrup'],
    'linebreak-style': [ 'error', 'unix' ],
    'no-trailing-spaces': 'warn',
    'eol-last': 'warn',
    'comma-dangle': ['warn', {
      'arrays': 'always-multiline',
      'objects': 'always-multiline',
      'imports': 'only-multiline',
      'exports': 'only-multiline',
      'functions': 'only-multiline',
    }],
    'indent': ['warn', 2, {
      SwitchCase: 1,
      offsetTernaryExpressions: true,
    }],
    'keyword-spacing': ['warn', {
      overrides: {
        'if': { after: false },
        'for': { after: false },
        'while': { after: false },
      },
    }],
    'quotes': ['warn', 'single', {avoidEscape: true, allowTemplateLiterals: true}],

    // Rules that seem too strict for now
    ...{
      // "return void" is still a useful expression of leaving a function early
      'no-promise-executor-return': 'off',

      // A lot of work for ridiculously little gain
      'arrow-body-style': 'off',
    },
  },
  overrides: [
    {
      // Rules specific to TypeScript
      files: ['**/*.ts'],
      parserOptions: {
        'project': './tsconfig.json',
      },
      extends: [
        // Use eslint and typescript-eslint recommended lists
        //
        // See:
        // * https://eslint.org/docs/rules/
        // * https://www.npmjs.com/package/@typescript-eslint/eslint-plugin
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
      rules: {
        // Correctness rules
        'deprecation/deprecation': 'warn',
        '@typescript-eslint/no-non-null-assertion': 'warn',
        '@typescript-eslint/no-shadow': ['error', { 'hoist': 'all' }],
        '@typescript-eslint/no-unused-expressions': 'error',
        '@typescript-eslint/require-array-sort-compare': 'error',
        '@typescript-eslint/no-base-to-string': 'error',
        '@typescript-eslint/restrict-plus-operands': 'error',
        '@typescript-eslint/no-confusing-non-null-assertion': 'error',
        '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true, ignoreVoidOperator: true }],
        '@typescript-eslint/no-dynamic-delete': 'error',
        '@typescript-eslint/explicit-module-boundary-types': 'error',
        '@typescript-eslint/no-unused-vars': ['error', {args: 'none', caughtErrors: 'all'}],
        '@typescript-eslint/restrict-template-expressions': 'warn',
        '@typescript-eslint/no-unnecessary-condition': 'warn',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-empty-function': 'warn',
        '@typescript-eslint/unbound-method': ['error', { ignoreStatic: true }],
        '@typescript-eslint/no-unsafe-assignment': 'error',
        '@typescript-eslint/no-unsafe-member-access': 'error',
        '@typescript-eslint/no-unsafe-call': 'error',
        '@typescript-eslint/no-unsafe-return': 'error',
        '@typescript-eslint/semi': ['error', 'always'],
        'semi': 'off',

        // Style rules
        '@typescript-eslint/consistent-type-definitions': ['warn', 'interface'],
        '@typescript-eslint/unified-signatures': 'warn',
        '@typescript-eslint/prefer-string-starts-ends-with': 'warn',
        '@typescript-eslint/naming-convention': ['warn',
          {
            // Disable case checking on object literal properties
            selector: ['objectLiteralProperty', 'typeProperty'],
            format: null,
          },
          {
            // Allow enum members to use PascalCase
            selector: 'enumMember',
            format: ['camelCase', 'PascalCase'],
          },
          {
            // Readonly static properties are like constants
            selector: 'classProperty',
            modifiers: ['static', 'readonly'],
            format: ['UPPER_CASE'],
          },
          {
            // Global constants can be a wide variety of things
            selector: 'variable',
            modifiers: ['const', 'global'],
            format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          },
          {
            selector: 'default',
            format: ['camelCase'],
            leadingUnderscore: 'allow',
            trailingUnderscore: 'allow',
          },
          {
            selector: 'variable',
            format: ['camelCase', 'UPPER_CASE'],
            leadingUnderscore: 'allow',
            trailingUnderscore: 'allow',
          },
          {
            selector: 'typeLike',
            format: ['PascalCase'],
          },
        ],
        // '@typescript-eslint/member-ordering': 'warn',
        '@typescript-eslint/no-extra-semi': 'warn',
        '@typescript-eslint/no-inferrable-types': 'warn',
        '@typescript-eslint/type-annotation-spacing': 'warn',
        '@typescript-eslint/prefer-function-type': 'warn',
        '@typescript-eslint/dot-notation': 'warn',
        'quotes': ['off'],
        '@typescript-eslint/quotes': ['warn', 'single', {avoidEscape: true, allowTemplateLiterals: true}],
        // '@typescript-eslint/no-use-before-define': 'warn',
        '@typescript-eslint/member-delimiter-style': ['warn'],
        'keyword-spacing': 'off',
        '@typescript-eslint/keyword-spacing': ['warn', {
          overrides: {
            'if': { after: false },
            'for': { after: false },
            'while': { after: false },
          },
        }],
        '@typescript-eslint/prefer-as-const': 'warn',
        '@typescript-eslint/prefer-for-of': 'warn',
        '@typescript-eslint/prefer-includes': 'warn',
        '@typescript-eslint/prefer-nullish-coalescing': 'warn',
        '@typescript-eslint/prefer-optional-chain': 'warn',
        '@typescript-eslint/prefer-readonly': 'warn',
        '@typescript-eslint/prefer-reduce-type-parameter': 'warn',
        '@typescript-eslint/prefer-regexp-exec': 'warn',

        // Rules that seem too strict for now
        ...{
          // "async" can be useful to make sure errors are always made into rejections
          '@typescript-eslint/require-await': 'off',

          // Despite the rule's documentation, these are still useful
          '@typescript-eslint/triple-slash-reference': 'off',
        },
      },
      overrides: [
        {
          // Rules disabled in test files
          files: ['*.spec.ts'],
          rules: {
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            'no-restricted-properties': [
              'warn',
              {
                object: 'it',
                property: 'only',
                message: "Don't forget to remove this before committing.",
              },
              {
                object: 'describe',
                property: 'only',
                message: "Don't forget to remove this before committing.",
              },
            ],
          },
        },
      ],
    },
  ],
};
