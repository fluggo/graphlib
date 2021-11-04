/* eslint-disable */
// Monkeypatch Mocha to show better diffs
// Watching https://github.com/mochajs/mocha/issues/4385 for a better solution
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const mochaUtils = require('mocha/lib/utils');
const util = require('util');
mochaUtils.stringify = val => util.inspect(val, {compact: false, sorted: true});
