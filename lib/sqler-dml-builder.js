/**
 * @file sqler main lib file
 */
const {
  sqlTable,
  sqlJoin,
  sqlTop,
  sqlSelectFields,
  sqlWhere,
  sqlGroupByHaving,
  sqlOrderBy,
  sqlLimit,
} = require('./sqler-dml-helper');
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
    sqlGroupByHaving(groupBy, havings),
    sqlOrderBy(orderBy),
    sqlLimit(limit),
  ];

  return sqls.filter(isNonEmptyString).join(' ');
}

/**
 * Make a function to express subquery.
 * @param {object} queryOpts
 * @returns {function}
 */
function subquery(queryOpts) {
  return () => `(${select(queryOpts)})`;
}

module.exports = {
  select,
  subquery,
};
