/**
 * .eslintrc.js with airbnb
 * r.1
 */
const OFF = 0;
const WARN = 1;
const ERROR = 2;

module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
    mocha: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      impliedStrict: true,
    },
  },
  extends: ['eslint:recommended', 'airbnb-base', 'plugin:prettier/recommended'],
  rules: {
    'no-console': [
      WARN,
      { allow: ['info', 'time', 'timeEnd', 'warn', 'error'] },
    ],
    'no-plusplus': [ERROR, { allowForLoopAfterthoughts: true }],
    'no-use-before-define': OFF,
    radix: [ERROR, 'as-needed'],
  },
};
