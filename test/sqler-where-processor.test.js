/* eslint-disable prefer-arrow-callback, func-names */
const { expect } = require('chai');
const { subquery } = require('../lib/sqler');
const {
  where,
  whereNot,
  whereLike,
  whereNotLike,
  whereIn,
  whereNotIn,
  whereNull,
  whereNotNull,
  whereBetween,
  whereNotBetween,
  whereExists,
  whereNotExists,
} = require('../lib/sqler-where-processor');

describe('SqlerWhereProcessor', function() {
  describe('where operator processors ', function() {
    const tests = [
      // [description, limit expression, expected result]
      // where(), whereNot()
      ['where() with field', where('fd1', '=', 'a'), `fd1 = 'a'`],
      ['where() in object context', { fd1: where('=', 'a') }, `fd1 = 'a'`],
      ['whereNot() with field', whereNot('fd1', '=', 'a'), `NOT fd1 = 'a'`],
      [
        'whereNot() in object context',
        { fd1: whereNot('=', 'a') },
        `NOT fd1 = 'a'`,
      ],
      // whereLike(), whereNotLike()
      [
        'whereLike() with field',
        whereLike('fd1', '%pattern%'),
        `fd1 LIKE '%pattern%'`,
      ],
      [
        'whereLike() in object context',
        { fd1: whereLike('%pattern%') },
        `fd1 LIKE '%pattern%'`,
      ],
      [
        'whereNotLike() with field',
        whereNotLike('fd1', '%pattern%'),
        `fd1 NOT LIKE '%pattern%'`,
      ],
      [
        'whereNotLike() in object context',
        { fd1: whereNotLike('%pattern%') },
        `fd1 NOT LIKE '%pattern%'`,
      ],
      // whereIn(), whereNotIn()
      ['whereIn() with field', whereIn('fd1', [1, 'a']), `fd1 IN (1, 'a')`],
      [
        'whereIn() in object context',
        { fd1: whereIn([1, 'a']) },
        `fd1 IN (1, 'a')`,
      ],
      [
        'whereNotIn() with field',
        whereNotIn('fd1', [1, 'a']),
        `fd1 NOT IN (1, 'a')`,
      ],
      [
        'whereNotIn() in object context',
        { fd1: whereNotIn([1, 'a']) },
        `fd1 NOT IN (1, 'a')`,
      ],
      [
        'whereNotIn(not_array_value) in object context',
        { fd1: whereNotIn(1) },
        `fd1 NOT IN (1)`,
      ],
      // whereNull(), whereNotNull()
      ['whereNull() with field', whereNull('fd1'), `fd1 IS NULL`],
      ['whereNull() in object context', { fd1: whereNull() }, `fd1 IS NULL`],
      ['whereNotNull() with field', whereNotNull('fd1'), `fd1 IS NOT NULL`],
      [
        'whereNotNull() in object context',
        { fd1: whereNotNull() },
        `fd1 IS NOT NULL`,
      ],
      // whereBetween(), whereNotBetween()
      [
        'whereBetween() with field',
        whereBetween('fd1', 1, 2),
        `fd1 BETWEEN 1 AND 2`,
      ],
      [
        'whereBetween() in object context',
        { fd1: whereBetween(1, 2) },
        `fd1 BETWEEN 1 AND 2`,
      ],
      [
        'whereNotBetween() with field',
        whereNotBetween('fd1', 1, 2),
        `fd1 NOT BETWEEN 1 AND 2`,
      ],
      [
        'whereNotBetween() in object context',
        { fd1: whereNotBetween(1, 2) },
        `fd1 NOT BETWEEN 1 AND 2`,
      ],
      // whereExists(), whereNotExists()
      [
        'whereExists() with field',
        whereExists(subquery({ tb: 'tb1' })),
        `EXISTS (SELECT * FROM tb1)`,
      ],
      [
        'whereNotExists() with field',
        whereNotExists(subquery({ tb: 'tb1' })),
        `NOT EXISTS (SELECT * FROM tb1)`,
      ],
      [
        'whereExists() should not care object context',
        { fd1: whereExists(subquery({ tb: 'tb1' })) },
        `EXISTS (SELECT * FROM tb1)`,
      ],
    ];

    tests.forEach(function([desc, expr, expected]) {
      it(desc, function() {
        if (typeof expr === 'function') {
          // when processor called with field argument
          const result = expr();
          expect(result).to.eq(expected);
        } else if (typeof expr === 'object') {
          // when processor called without field argument in object context
          Object.entries(expr).forEach(([field, processor]) => {
            const result = processor(field);
            expect(result).to.eq(expected);
          });
        }
      });
    });
  });
});
