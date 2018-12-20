/**
 * @file dml builder helper
 */
const { escape, isNonEmptyString, firstObjectEntry } = require('./util');

/**
 * Generate the SELECT table expression.
 * @param {string|object} tb
 * @returns {string}
 */
function sqlTable(tb) {
  if (typeof tb === 'string' && tb.trim()) {
    return tb.trim();
  }

  if (typeof tb === 'object') {
    const { key: tbName, value: tbAlias } = firstObjectEntry(tb);
    return `${tbName} AS ${tbAlias.trim()}`;
  }

  throw new Error('INVALID_TABLE_NAME');
}

/**
 * Generate the SELECT `JOIN` clause.
 * Default join type is 'INNER'.
 * @param {string|object} tb
 * @param {object|object[]} joins
 * @returns {string}
 */
function sqlJoin(tb, joins) {
  if (typeof joins !== 'object' || joins === null) {
    return '';
  }

  if (Array.isArray(joins)) {
    let firstTable = tb;
    return joins
      .map(join => {
        const sql = parseJoin(firstTable, join);
        firstTable = join.tb;
        return sql;
      })
      .filter(isNonEmptyString)
      .join(' ');
  }

  return parseJoin(tb, joins);
}

/**
 * Generate the SELECT `JOIN` clause from single join options.
 * [NO TEST] tested by `sqlJoin()`
 * @param {string|object} tb
 * @param {object|object[]} join
 */
function parseJoin(tb, join) {
  const { type, tb: tb2, on } = join;
  if (!(type && tb2 && on)) {
    return '';
  }

  const allowedJoinTypes = ['INNER', 'LEFT', 'RIGHT', 'CROSS'];
  const joinType = allowedJoinTypes.includes(type.toUpperCase())
    ? type.toUpperCase()
    : 'INNER';

  const firstTable =
    typeof tb === 'object' ? firstObjectEntry(tb).value.trim() : tb.trim();
  const secondTable =
    typeof tb2 === 'object' ? firstObjectEntry(tb2).value.trim() : tb2.trim();
  const [onFirstTableField, onSecondTableField] = on;

  return `${joinType} JOIN ${sqlTable(
    tb2
  )} ON ${firstTable}.${onFirstTableField} = ${secondTable}.${onSecondTableField}`;
}

/**
 * Generate SELECT `DISTINCT` clause.
 *
 * @param {boolean} distinct
 * @returns {string}
 */
function sqlDistinct(distinct) {
  return distinct === true ? 'DISTINCT' : '';
}

/**
 * Generate the SELECT `TOP` clause.
 * TOP is only supported in mssql.
 * `sqler` as DML builder does not care about which DBMS is used.
 * @param {number|string} top
 * @returns {string}
 */
function sqlTop(top) {
  if (typeof top !== 'number' && typeof top !== 'string') {
    return '';
  }

  const parsedTop = parseInt(top);
  return parsedTop > 0 ? `TOP ${parsedTop}` : '';
}

/**
 * Generate the SELECT fields list.
 * @param {string|array|object} fields
 * @return {string}
 */
function sqlSelectFields(fields) {
  if (typeof fields === 'string') {
    return fields.trim() || '*';
  }

  if (Array.isArray(fields)) {
    return fields.map(sqlSelectFields).join(', ') || '*';
  }

  if (typeof fields === 'object' && fields !== null) {
    return (
      Object.entries(fields)
        .map(parseObjectField)
        .join(', ') || '*'
    );
  }

  return '*';
}

/**
 * Parse object field item.
 * @param {array} field
 * @param {string} field[0]
 * @param {array|string} field[1]
 * @return {string}
 */
function parseObjectField([key, value]) {
  // { a: ['fd1', 'fd2'] } --> 'a.fd1, a.fd2'
  if (Array.isArray(value)) {
    return value.map(field => `${key}.${field}`).join(', ');
  }

  // { fd1: 'a' } --> 'fd1 As a'
  return `${key} AS ${value}`;
}

/**
 * Genereate the SELECT `WHERE` clause.
 *   wheres -> parseWheres() -> makeConditionsString() -> sqlWheres()
 *               \- parseWhereExprInObject()
 * @param {string|object|array} wheres
 * @returns {string}
 */
function sqlWhere(wheres) {
  const sql = makeConditionsString(wheres);
  return sql ? `WHERE ${sql}` : '';
}

/**
 * Make sql string from an arrary of parsed expressions.
 * Used in both sqlWheres(), sqlHaving() and sqlerWhereProcessor.or().
 * [NO TEST] tested by `sqlWhere()`
 * @param {string|object|array} wheres
 * @returns {string}
 */
function makeConditionsString(wheres) {
  const exprs = parseWheres(wheres);
  const result =
    exprs.length === 0
      ? ''
      : exprs.reduce(
          (accum, expr) =>
            accum + (expr.startsWith('OR ') ? ` ${expr}` : ` AND ${expr}`)
        );
  // must not supply an initial value to reduce() to join items correctly

  // ignore 'OR' of the first item
  return result.startsWith('OR ') ? result.substring(3) : result;
}

/**
 * Parse where expressions.
 * [NO TEST] tested by `sqlWhere()`
 * @param {string|object|array} wheres
 * @param {string} [contextField]
 * @returns {string[]}
 */
function parseWheres(wheres, contextField) {
  if (typeof wheres === 'string' && wheres.trim()) {
    return [wheres.trim()];
  }

  if (typeof wheres === 'function') {
    const result = wheres(contextField);
    return typeof result === 'string' ? [result] : [''];
  }

  // parse array items with `parseWheres()` itself to handel below cases,
  //   string in array: ['fd1 = 1']
  //   object in array: [{ fd1: 1, fd2: 'a' }]
  //   function in array [where('fd1', '>', 1)]
  // array in array is not a valid expression and will be parsed incorrectly.
  // This case is not handled by program. User should use correctly.
  //   (INVALID) array in array: [['fd1 = 1', { fd1: 1, fd2: 'a' }]]
  if (Array.isArray(wheres)) {
    return wheres.reduce(
      (accum, whereCond) => [...accum, ...parseWheres(whereCond)],
      []
    );
  }

  if (typeof wheres === 'object' && wheres !== null) {
    return Object.entries(wheres).map(parseWhereExprInObject);
  }

  return [];
}

/**
 * Parse `{ fd: val }` type where expression.
 * [NO TEST] tested by `sqlWhere()`
 * @param {string} field
 * @param {function|array|*} val
 * @returns {string}
 */
function parseWhereExprInObject([field, val]) {
  // { fd1: where('<', 1 )} --> where('fd1', '<', 1) --> 'fd1 < 1' --> 'fd1 < 1'
  // { fd1: () => 'NOW()' }                          --> 'NOW()'   --> 'fd1 = NOW()'
  if (typeof val === 'function') {
    const result = val(field);
    return result.startsWith(`${field} `) ? result : `${field} = ${result}`;
  }

  // { fd1: [1, 2, 3] }
  if (Array.isArray(val)) {
    return `${field} IN (${escape(val)})`;
  }

  // { fd1: 'a' }
  return `${field} = ${escape(val)}`;
}

/**
 * Generate the `GROUP BY` and `HAVING` clause.
 * @param {string|array} groupBy
 * @param {string|object|array} havings
 * @returns {string}
 */
function sqlGroupByHaving(groupBy, havings) {
  const groupBySql = sqlGroupBy(groupBy);

  if (!groupBySql) {
    return '';
  }

  const havingSql = sqlHaving(havings);

  return `${groupBySql}${havingSql ? ' ' : ''}${havingSql}`;
}

/**
 * Generate the `GROUP BY` clause.
 * @param {string|array} groupBy
 * @returns {string}
 */
function sqlGroupBy(groupBy) {
  let sql = '';
  if (typeof groupBy === 'string') {
    sql = groupBy.trim();
  } else if (Array.isArray(groupBy)) {
    sql = groupBy
      .filter(isNonEmptyString)
      .map(order => order.trim())
      .join(', ');
  }

  return sql ? `GROUP BY ${sql}` : '';
}

/**
 * Generate the `HAVING` clause.
 * `makeConditionsString()` for `sqlWhere()` is used.
 * @param {string|object|array} havings
 * @returns {string}
 */
function sqlHaving(havings) {
  const sql = makeConditionsString(havings);
  return sql ? `HAVING ${sql}` : '';
}

/**
 * Generate the `ORDER BY` sql clause.
 * @param {string|object|array} orderBy
 * @returns {string}
 */
function sqlOrderBy(orderBy) {
  let sql = '';
  if (typeof orderBy === 'string') {
    sql = orderBy.trim();
  } else if (Array.isArray(orderBy)) {
    sql = orderBy
      .filter(isNonEmptyString)
      .map(order => order.trim())
      .join(', ');
  } else if (typeof orderBy === 'object' && orderBy !== null) {
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
 * Generate the `LIMIT` sql clause.
 * `LIMIT` is only supported in mysql and postgresql.
 * `LIMIT offset, count` syntax is only supported in mysql.
 * `sqler` as DML builder does not care about which DBMS is used.
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

  if (Array.isArray(limit)) {
    const [countOrOffset, count = 0] = limit;
    return countOrOffset
      ? `LIMIT ${countOrOffset}${count ? `, ${count}` : ''}`
      : '';
  }

  if (typeof limit === 'object' && limit !== null) {
    const { count = 0, offset = 0 } = limit;
    return count ? `LIMIT ${count}${offset ? ` OFFSET ${offset}` : ''}` : '';
  }

  return '';
}

/**
 * Make INSERT fields and values.
 *
 * @param {array|object} infos
 * @returns {object} { insertFields, insertValues }
 */
function sqlInsertInfos(infos) {
  if (typeof infos !== 'object' || infos === null) {
    throw new Error('INVALID_INSERET_INFOS');
  }

  const isNonArrayObject = !Array.isArray(infos);
  const isArrayOfNonArrayObject =
    Array.isArray(infos) &&
    typeof infos[0] === 'object' &&
    !Array.isArray(infos[0]);
  const isArrayOfArray = Array.isArray(infos) && Array.isArray(infos[0]);

  const isArrayOfInfo = isArrayOfNonArrayObject || isArrayOfArray;
  const hasFields = isNonArrayObject || isArrayOfNonArrayObject;

  // for subtask helpers to handle array of info only
  // eslint-disable-next-line no-param-reassign
  infos = isArrayOfInfo ? infos : [infos];

  const fields = hasFields ? getFieldList(infos) : '';
  const values = hasFields
    ? getValueListOfObjects(fields, infos)
    : getValueListOfNonObject(infos);

  const insertFields = hasFields ? `(${fields.join(', ')})` : '';
  const insertValues = values.join(', ');

  return { insertFields, insertValues };
}

/**
 * Generate field list from object array.
 * [NO TEST] subtask for sqlInsertInfos()
 *
 * @param {object[]} infos
 * @returns {string[]}
 */
function getFieldList(infos) {
  return Array.from(
    // use Set and Set#add() to ignore duplicate fields
    infos.reduce((fieldsSet, info) => {
      Object.keys(info).forEach(key => fieldsSet.add(key));
      return fieldsSet;
    }, new Set())
  );
}

/**
 * Generate value list from object array.
 * [NO TEST] subtask for sqlInsertInfos()
 *
 * @param {object[]} infos
 * @returns {string[]}
 */
function getValueListOfObjects(fields, infos) {
  return infos.map(
    info =>
      `(${fields
        .map(field => info[field] || (() => 'DEFAULT'))
        .map(escape)
        .join(', ')})`
  );
}

/**
 * Generate value list from non object items
 * [NO TEST] subtask for sqlInsertInfos()
 *
 * @param {*} infos
 * @returns {string[]}
 */
function getValueListOfNonObject(infos) {
  return infos.map(info => `(${info.map(escape).join(', ')})`);
}

/**
 * Generate UPDATE SET expression.
 *
 * @param {string|object|array} infos
 * @returns {string}
 */
function sqlUpdateInfos(infos) {
  if (
    typeof infos === 'string' ||
    (typeof infos === 'object' && infos !== null && !Array.isArray(infos))
  ) {
    return parseUpdateInfo(infos);
  }

  if (Array.isArray(infos)) {
    return infos
      .map(parseUpdateInfo)
      .filter(isNonEmptyString)
      .join(', ');
  }

  return '';
}

/**
 * Parse string and object for UPDATE SET expression.
 * [NO TEST] subtask for sqlUpdateInfos()
 *
 * @param {*} info
 * @returns
 */
function parseUpdateInfo(info) {
  if (typeof info === 'string') {
    return info.trim();
  }

  if (typeof info === 'object' && !Array.isArray(info)) {
    return Object.entries(info)
      .map(([key, val]) => `${key} = ${escape(val)}`)
      .join(', ');
  }

  return '';
}

module.exports = {
  sqlTable,
  sqlJoin,
  sqlDistinct,
  sqlTop,
  sqlSelectFields,
  sqlWhere,
  sqlGroupByHaving,
  sqlGroupBy,
  sqlHaving,
  sqlOrderBy,
  sqlLimit,
  sqlInsertInfos,
  sqlUpdateInfos,
  // expose to use in `sqlerWhereProcessor.or()`
  makeConditionsString,
};
