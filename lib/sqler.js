/**
 * @file sqler main lib file
 */
const {
  sqlTable,
  sqlJoin,
  sqlTop,
  sqlSelectFields,
  sqlWhere,
  sqlOrderBy,
  sqlLimit,
} = require('./sqler-helper');
const { isNonEmptyString } = require('./util');

function select({
  /* eslint-disable */
  tb,
  joins,
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
    sqlTop(top),
    sqlSelectFields(fields),
    'FROM',
    sqlTable(tb),
    sqlJoin(tb, joins),
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
