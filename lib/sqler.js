/**
 * @file sqler main lib file
 */
const {
  sqlTable,
  sqlSelectFields,
  sqlWhere,
  sqlOrderBy,
  sqlLimit,
} = require('./sqler-helper');
const { isNonEmptyString } = require('./util');

function select({
  /* eslint-disable */
  tb,
  join,
  top,
  fields,
  wheres,
  groupBy,
  havings,
  orderBy,
  limit,
  /* eslint-enable */
} = {}) {
  const sqls = [
    'SELECT',
    sqlSelectFields(fields),
    'FROM',
    sqlTable(tb),
    sqlWhere(wheres),
    sqlOrderBy(orderBy),
    sqlLimit(limit),
  ];

  return sqls.filter(isNonEmptyString).join(' ');
}

/**
 * Make a function to express subquery.
 * @param {object} queryOptions
 * @returns {function}
 */
function subquery(queryOptions) {
  return () => `(${select(queryOptions)})`;
}

module.exports = {
  select,
  subquery,
};
