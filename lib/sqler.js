/**
 * @file sqler main lib file
 */

const { sqlSelectFields, sqlLimit } = require('./sqler-helper');

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

  return sqls.filter(hasValue).join(' ');
}

// inner use only
function hasValue(target) {
  return typeof target === 'string' && target.trim();
}

module.exports = { select };
