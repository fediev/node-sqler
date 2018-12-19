/**
 * @file dml builder
 */
const {
  sqlTable,
  sqlJoin,
  sqlDistinct,
  sqlTop,
  sqlSelectFields,
  sqlWhere,
  sqlGroupByHaving,
  sqlOrderBy,
  sqlLimit,
  sqlInsertInfos,
  sqlUpdateInfos,
} = require('./dml-helper');
const { isNonEmptyString } = require('./util');

/**
 * SELECT
 */
function select({
  tb,
  joins,
  distinct,
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
    sqlDistinct(distinct),
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
 * INSERT
 */
function insert({ tb, infos, fields, values } = {}) {
  const { insertFields, insertValues } = infos
    ? sqlInsertInfos(infos)
    : { insertFields: `(${fields})`, insertValues: `(${values})` };

  const sqls = [
    'INSERT INTO',
    sqlTable(tb),
    insertFields,
    'VALUES',
    insertValues,
  ];

  return sqls.filter(isNonEmptyString).join(' ');
}

/**
 * UPDATE
 */
function update({ tb, infos, wheres, orderBy, limit } = {}) {
  const sqls = [
    'UPDATE',
    sqlTable(tb),
    'SET',
    sqlUpdateInfos(infos),
    sqlWhere(wheres),
    sqlOrderBy(orderBy),
    sqlLimit(limit),
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
  insert,
  update,
  delete: del,
};
