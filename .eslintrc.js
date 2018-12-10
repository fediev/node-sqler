/**
 * .eslintrc.js with eslint-config-airbnb-base (for non-react projects)
 * r.2
 * eslint v5.9.0, eslint-config-airbnb-base v13.1.0
 */
const OFF = 0;
const WARN = 1;
const ERROR = 2;

const config = {
  root: true,
  env: {
    node: true,
    es6: true,
    mocha: true,
  },
  parser: 'espree',
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

module.exports = config;
