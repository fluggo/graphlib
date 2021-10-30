#!/usr/bin/env node
/* eslint-env node */

const package = require('../../package.json');
console.log('module.exports = \'' + package.version + '\';');
