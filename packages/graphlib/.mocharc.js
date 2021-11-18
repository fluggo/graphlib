module.exports = {
  require: ['ts-node/register', 'test/setup.ts'],
  spec: ['lib/**/*.spec.ts'],
  ignore: ['node_modules/**'],
  'watch-files': ['**/*.ts'],
};
