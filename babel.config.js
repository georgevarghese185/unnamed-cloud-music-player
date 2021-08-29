/* eslint-env node */
const fs = require('fs-extra');
let extend = undefined;

if (fs.existsSync('./.babelrc')) {
  extend = './.babelrc';
}

module.exports = api => {
  return {
    presets: [
      [
        '@quasar/babel-preset-app',
        api.caller(caller => caller && caller.target === 'node')
          ? { targets: { node: 'current' } }
          : {}
      ]
    ],
    extends: extend,
  }
}

