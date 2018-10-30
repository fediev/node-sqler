/**
 * Check if target is a string and not empty.
 * @param {*} target
 * @returns {boolean}
 */
function isNonEmptyString(target) {
  return typeof target === 'string' && target.trim();
}

module.exports = {
  isNonEmptyString,
};
