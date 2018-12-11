/**
 * @file dml builder
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
} = require('./dml-helper');
const { isNonEmptyString } = require('./util');

/**
 * SELECT
 */
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

/**
 * UNION
 */
function union({ selects, orderBy } = {}) {
  const sqls = [
    selects
      .map(select)
      .filter(isNonEmptyString)
      .join(' UNION '),
    sqlOrderBy(orderBy),
  ];

  return sqls.filter(isNonEmptyString).join(' ');
}

/**
 * UNION ALL
 */
function unionAll({ selects, orderBy } = {}) {
  const sqls = [
    selects
      .map(select)
      .filter(isNonEmptyString)
      .join(' UNION ALL '),
    sqlOrderBy(orderBy),
  ];

  return sqls.filter(isNonEmptyString).join(' ');
}

/**
 * DELETE
 */
function del({ tb, wheres, orderBy, limit } = {}) {
  const sqls = [
    'DELETE FROM',
    sqlTable(tb),
    sqlWhere(wheres),
    sqlOrderBy(orderBy),
    sqlLimit(limit),
  ];

  return sqls.filter(isNonEmptyString).join(' ');
}

module.exports = {
  select,
  subquery,
  union,
  unionAll,
  delete: del,
};
