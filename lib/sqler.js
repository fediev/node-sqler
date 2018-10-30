/**
 * @file sqler main lib file
 */

const { sqlSelectFields, sqlLimit } = require('./sqler-helper');
const { isNonEmptyString } = require('./util');

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
  const sqls = ['SELECT', sqlSelectFields(fields), 'FROM', tb, sqlLimit(limit)];

  return sqls.filter(isNonEmptyString).join(' ');
}

module.exports = { select };
