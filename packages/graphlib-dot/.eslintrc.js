/* eslint-env node */
module.exports = {
  ignorePatterns: ['/dist'],
  parserOptions: {
    'tsconfigRootDir': __dirname,
  },
  overrides: [
    {
      // dot-grammar.js is generated, and while we could turn off linting
      // entirely, there are some rules that can help us check our syntax
      // in the grammar file
      files: ['lib/dot-grammar.js'],
      rules: {
        'no-var': 'off',
        'keyword-spacing': 'off',
        'brace-style': 'off',
        'comma-dangle': 'off',
        'quotes': 'off',
        'indent': 'off',
        'no-unused-vars': 'off',
        'no-inner-declarations': 'off',
        'no-control-regex': 'off',
      },
    },
  ],
};
