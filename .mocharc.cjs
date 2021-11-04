module.exports = {
  extension: ['ts'],
  'node-option': ["experimental-specifier-resolution=node", "loader=ts-node/esm"],
  require: ['test/setup.cjs'],
  spec: ['lib/**/*.spec.ts'],
  ignore: ['node_modules/**'],
  'watch-files': ['**/*.ts'],
};
