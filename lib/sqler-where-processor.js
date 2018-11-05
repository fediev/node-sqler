/**
 * @file sqler where operator processors
 */

const { escape } = require('./util');
const { makeConditionsString } = require('./sqler-helper');

// Where Operator Processors

// To get the same result from both `{ fd1: where('=', 'a' ) }` and
// `where('fd1', '=', 'a')`, `whereOperator(...args)` return a function
// that will be handle the both execution context.

// processor : (...args) --> fieldInObj --> processedExpression
// primitive processor : (...args) --> processedExpression
// processorFactory : primitive processor --> processor

// primitive processors, when processor called with the full expr argument
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

// whereExists() and whereNotExists() does not need to handle an object context.
const whereExists = squery => () => `EXISTS ${escape(squery)}`;
const whereNotExists = squery => () => `NOT EXISTS ${escape(squery)}`;

/**
 * Make a processor handle the both normal and object context situation.
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

/**
 * Generate `OR` expresion using `sqler.sqlWhere()`.
 * Depending on the number of params, `or()` generates the result differently.
 *   `or(A)` --> 'OR A'
 *   `or(A, B)` --> '(A OR B)'
 * @param {...string|function|array|object} exprs
 * @returns {string}
 */
function or(...exprs) {
  // or(A) --> 'OR A'
  if (exprs.length === 1) {
    return `OR ${makeConditionsString(exprs)}`;
  }

  // or(A, B) --> '(A OR B)'
  if (exprs.length > 1) {
    return `(${exprs
      .map(makeConditionsString)
      .reduce(
        (accum, expr) =>
          accum + (expr.startsWith('OR ') ? ` ${expr}` : ` OR ${expr}`)
      )})`;
  }

  return '';
}

module.exports = {
  ...whereHavingProcessros,
  whereExists,
  whereNotExists,
  or,
};
