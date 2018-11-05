/**
 * @file utility functions
 */

const { escape: excapeSqlstring } = require('sqlstring');

/**
 * Check if target is a string and not empty.
 * @param {*} target
 * @returns {boolean}
 */

function isNonEmptyString(target) {
  return typeof target === 'string' && target.trim();
}

/**
 * Extend sqlstring.escape() to express a raw string.
 * When the target is a function, it returns result of the function
 * @param {*} val
 * @returns {string}
 */

function escape(val) {
  if (typeof val === 'function') {
    return val();
  }

  return excapeSqlstring(val);
}

/**
 * Get the first entry of the object.
 * Using `Object.entries()` is not an efficient way.
 * @param {object} obj
 * @returns {object} { key, value }
 */
function firstObjectEntry(obj = {}) {
  // eslint-disable-next-line no-restricted-syntax
  for (const key in obj) {
    if ({}.hasOwnProperty.call(obj, key)) {
      return { key, value: obj[key] };
    }
  }

  return ['', ''];
}

module.exports = {
  escape,
  isNonEmptyString,
  firstObjectEntry,
};
