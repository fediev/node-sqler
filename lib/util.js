/**
 * Check if target is a string and not empty.
 * @param {*} target
 * @returns {boolean}
 */
const { escape: excapeSqlstring } = require('sqlstring');

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
module.exports = {
  escape,
  isNonEmptyString,
};
