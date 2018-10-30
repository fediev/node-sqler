/**
 * @file helper functions for sqler
 */

/**
 * Generate select fields list.
 * @param {*} fields
 */
function sqlSelectFields(fields = '*') {
  // TODO: full implementation. simple implentation for testing
  return fields;
}

/**
 * Generate limit sql clause.
 * @param {string|number|array|object} limit
 * @returns {string}
 */
function sqlLimit(limit) {
  if (typeof limit === 'string' && limit.trim()) {
    return `LIMIT ${limit.trim()}`;
  }

  if (typeof limit === 'number' && limit >= 1) {
    return `LIMIT ${Math.floor(limit)}`;
  }

  if (Array.isArray(limit) && limit.length > 0) {
    const [countOrOffset, count = 0] = limit;
    return countOrOffset
      ? `LIMIT ${countOrOffset}${count ? `, ${count}` : ''}`
      : '';
  }

  if (typeof limit === 'object') {
    const { count = 0, offset = 0 } = limit;
    return count ? `LIMIT ${count}${offset ? ` OFFSET ${offset}` : ''}` : '';
  }

  return '';
}

module.exports = {
  sqlSelectFields,
  sqlLimit,
};
