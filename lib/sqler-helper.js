/**
 * @file helper functions for sqler
 */

const { isNonEmptyString } = require('./util');

/**
 * Generate select fields list.
 * @param {*} fields
 */
function sqlSelectFields(fields = '*') {
  // TODO: full implementation. simple implentation for testing
  return fields;
}

/**
 * Generate ORDER BY sql clauses.
 * @param {string|object|array} orderBy
 * @returns {string}
 */
function sqlOrderBy(orderBy) {
  let sql = '';
  if (typeof orderBy === 'string' && orderBy.trim()) {
    sql = orderBy.trim();
  } else if (Array.isArray(orderBy) && orderBy.length > 0) {
    sql = orderBy
      .filter(isNonEmptyString)
      .map(order => order.trim())
      .join(', ');
  } else if (typeof orderBy === 'object') {
    sql = Object.entries(orderBy)
      .map(
        ([field, direction]) =>
          `${field} ${direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`
      )
      .join(', ');
  }

  return sql ? `ORDER BY ${sql}` : '';
}

/**
 * Generate LIMIT sql clause.
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
  sqlOrderBy,
  sqlLimit,
};
