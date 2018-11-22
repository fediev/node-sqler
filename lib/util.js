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
 * When the target is a function and the return value is a string,
 * it returns the result of the function.
 * @param {*} val
 * @returns {string}
 */

function escape(val) {
  if (typeof val === 'function') {
    const result = val();
    return typeof result === 'string' ? result : '';
  }

  return excapeSqlstring(val);
}

/**
 * Get the first entry of the object.
 * Using `Object.entries()` is not an efficient way.
 * @param {object} obj
 * @returns {object} { key, value } or Error('NO_OBJECT_ENTRY')
 */
function firstObjectEntry(obj = {}) {
  // eslint-disable-next-line no-restricted-syntax
  for (const key in obj) {
    if ({}.hasOwnProperty.call(obj, key)) {
      return { key, value: obj[key] };
    }
  }

  throw new Error('NO_OBJECT_ENTRY');
}

module.exports = {
  escape,
  isNonEmptyString,
  firstObjectEntry,
};
