// Monkeypatch Mocha to show better diffs
// Watching https://github.com/mochajs/mocha/issues/4385 for a better solution
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mochaUtils = require('mocha/lib/utils');
import { inspect } from 'util';
mochaUtils.stringify = (val: unknown) => inspect(val, {compact: false, sorted: true});
