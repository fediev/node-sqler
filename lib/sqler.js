/**
 * @file sqler main lib file
 */
const { sqlSelectFields, sqlOrderBy, sqlLimit } = require('./sqler-helper');
const { escape, isNonEmptyString } = require('./util');

function select({
  /* eslint-disable */
  tb,
  join,
  top,
  fields = '*',
  wheres,
  groupBy,
  havings,
  orderBy,
  limit,
  /* eslint-enable */
}) {
  const sqls = [
    'SELECT',
    sqlSelectFields(fields),
    'FROM',
    tb,
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

// Where Operator Processors

// To get the same result from both `{ fd1: where('=', 'a' ) }` and
// `where('fd1', '=', 'a')`, `whereXXX(...args)` return a function
// that will be handle the execution context.

// processor : (...args) => fieldInObj => processedExpression
// primitive processor : (...args) => processedExpression
// processorFactory : primitive processor -> processor

// primitive processors, when processor called with expr argument
const whereProcessorPrimatives = {
  where: (expr, oper, val) => `${expr} ${oper} ${escape(val)}`,
  whereNot: (expr, oper, val) => `NOT ${expr} ${oper} ${escape(val)}`,
  whereLike: (expr, val) => `${expr} LIKE ${escape(val)}`,
  whereNotLike: (expr, val) => `${expr} NOT LIKE ${escape(val)}`,
  whereIn: (expr, val) => `${expr} IN (${escape(val)})`,
  whereNotIn: (expr, val) => `${expr} NOT IN (${escape(val)})`,
  whereNull: expr => `${expr} IS NULL`,
  whereNotNull: expr => `${expr} IS NOT NULL`,
  whereBetween: (expr, begin, end) =>
    `${expr} BETWEEN ${escape(begin)} AND ${escape(end)}`,
  whereNotBetween: (expr, begin, end) =>
    `${expr} NOT BETWEEN ${escape(begin)} AND ${escape(end)}`,
};

// whereExists() and whereNotExists() does not need to handle object context.
const whereExists = squery => () => `EXISTS ${escape(squery)}`;
const whereNotExists = squery => () => `NOT EXISTS ${escape(squery)}`;

/**
 * Make a processor handle both normal and object context situation.
 *   normal : where('fd1', '=', 'a')
 *   object context : { fd1: where('=', 'a' ) }
 * @param {function} operator
 * @returns {function}
 */
function processorFactory(operator) {
  return (...args) => fieldInObj => {
    if (fieldInObj) {
      args.unshift(fieldInObj);
    }
    return whereProcessorPrimatives[operator](...args);
  };
}

// 1 primitive processors -> 2 where and having processors
const whereHavingProcessros = Object.keys(whereProcessorPrimatives).reduce(
  (accum, operator) => ({
    ...accum,
    [operator]: processorFactory(operator),
    [operator.replace('where', 'having')]: processorFactory(operator),
  }),
  {}
);

module.exports = {
  select,
  subquery,
  ...whereHavingProcessros,
  whereExists,
  whereNotExists,
};
