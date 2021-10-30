/* eslint-env mocha, commonjs */
const expect = require('./chai').expect;

describe('version', function() {
  it('should match the version from package.json', function() {
    const packageVersion = require('../package').version;
    expect(require('../lib/version')).to.equal(packageVersion);
  });
});
