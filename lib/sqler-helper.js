/**
 * @file helper functions for sqler
 */
const { escape, isNonEmptyString } = require('./util');

/**
 * Generate select fields list.
 * @param {*} fields
 */
function sqlSelectFields(fields = '*') {
  // TODO: full implementation. simple implentation for testing
  return fields;
}

/**
 * Genereate `WHERE` clause.
 *   wheres -> parseWheres() -> makeConditionsString() -> sqlWheres()
 *               \- parseWhereExprInObject()
 * @param {string|object|array} wheres
 * @param {boolean} [calledAsOr=false]
 * @returns {string}
 */
function sqlWhere(wheres) {
  const sql = makeConditionsString(wheres);
  return sql ? `WHERE ${sql}` : '';
}

/**
 * Make sql from parsed expression array.
 * Used in both sqlWheres() and or().
 * [NO TEST]
 * @param {string|object|array} wheres
 */
function makeConditionsString(wheres) {
  const exprs = parseWheres(wheres);
  return exprs.length === 0
    ? ''
    : exprs.reduce(
        (accum, expr) =>
          accum + (expr.startsWith('OR ') ? ` ${expr}` : ` AND ${expr}`)
      ); // must not supply initial value to join correctly with 'AND' or 'OR'
}

/**
 * Parse where expressions.
 * [NO TEST]
 * @param {string|object|array} wheres
 * @param {string} [contextField]
 * @returns {string[]}
 */
function parseWheres(wheres, contextField) {
  if (typeof wheres === 'string' && wheres.trim()) {
    return [wheres.trim()];
  }

  if (typeof wheres === 'function') {
    return [wheres(contextField)];
  }

  // parse array items with `parseWheres()` itself to handel below cases,
  //   string in array: ['fd1 = 1']
  //   object in array: [{ fd1: 1, fd2: 'a' }]
  //   function in array [where('fd1', '>', 1)]
  // array in array is not a valid expression and will be parsed incorrectly.
  //   (INVALID) array in array: [['fd1 = 1', { fd1: 1, fd2: 'a' }]]
  if (Array.isArray(wheres)) {
    return wheres.reduce(
      (accum, whereCond) => [...accum, ...parseWheres(whereCond)],
      []
    );
  }

  if (typeof wheres === 'object') {
    return Object.entries(wheres).map(parseWhereExprInObject);
  }

  return [];
}

/**
 * Parse `{ fd: val }` type where expression.
 * [NO TEST]
 * @param {function|array|*} param
 * @returns {string}
 */
function parseWhereExprInObject([field, val]) {
  // { fd1: where('<', 1 )}
  if (typeof val === 'function') {
    return val(field);
  }

  // { fd1: [1, 2, 3] }
  if (Array.isArray(val)) {
    return `${field} IN (${escape(val)})`;
  }

  return `${field} = ${escape(val)}`;
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
  sqlWhere,
  makeConditionsString,
  sqlOrderBy,
  sqlLimit,
};
