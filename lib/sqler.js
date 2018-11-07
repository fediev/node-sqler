/**
 * @file sqler main lib file
 */
const {
  sqlTable,
  sqlJoin,
  sqlTop,
  sqlSelectFields,
  sqlWhere,
  sqlGroupBy,
  sqlHaving,
  sqlOrderBy,
  sqlLimit,
} = require('./sqler-helper');
const { isNonEmptyString } = require('./util');

function select({
  tb,
  joins,
  top,
  fields,
  wheres,
  groupBy,
  havings,
  orderBy,
  limit,
} = {}) {
  const sqls = [
    'SELECT',
    sqlTop(top),
    sqlSelectFields(fields),
    'FROM',
    sqlTable(tb),
    sqlJoin(tb, joins),
    sqlWhere(wheres),
    sqlGroupBy(groupBy),
    sqlHaving(havings, groupBy),
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
