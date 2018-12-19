/* eslint-disable prefer-arrow-callback, func-names */
const { expect } = require('chai');
const { firstObjectEntry } = require('../lib/util');
const { subquery } = require('../lib/dml-builder');
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
  or,
} = require('../lib/dml-where-processor');

describe('dml builder where processor', function() {
  describe('where operator processors ', function() {
    const tester = function([desc, expr, expected]) {
      it(desc, function() {
        if (typeof expr === 'function') {
          // when processor called with field argument
          const result = expr();
          expect(result).to.eq(expected);
        } else if (typeof expr === 'object') {
          // when processor called without field argument in object context
          const { key: field, value: processor } = firstObjectEntry(expr);
          const result = processor(field);
          expect(result).to.eq(expected);
        }
      });
    };

    const testCases = [
      // [description, expression, expected result]
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

    testCases.forEach(tester);
  });

  describe('or()', function() {
    const tester = function([desc, expr, expected]) {
      it(desc, function() {
        const result = or(expr);
        expect(result).to.eq(expected);
      });
    };

    const testCases = [
      [`string -> prepend OR`, ' fd1 = 1 ', 'OR fd1 = 1'],
      ['function -> prepend OR', where('fd1', '=', 'a'), `OR fd1 = 'a'`],
      ['object -> prepend OR', { fd1: 1 }, 'OR fd1 = 1'],
      [
        'object with multi properties -> join with AND and prepend OR',
        { fd1: 1, fd2: 'a' },
        `OR fd1 = 1 AND fd2 = 'a'`,
      ],
      [
        'array -> join with AND and prepend OR',
        ['fd1 = 1', `fd2 = 'a'`],
        `OR fd1 = 1 AND fd2 = 'a'`,
      ],
    ];

    testCases.forEach(tester);

    it('multiple args -> join with OR and add (...)', function() {
      const args = [
        'fd1 = 1',
        { fd2: 'a' },
        ['fd3 = 2', 'fd4 > 3'],
        where('fd5', '<', 4),
      ];
      const expected = `(fd1 = 1 OR fd2 = 'a' OR fd3 = 2 AND fd4 > 3 OR fd5 < 4)`;
      const result = or(...args);
      expect(result).to.eq(expected);
    });
    it('should ignore inside or() in or(or(A), B)', function() {
      const args = ['fd1 = 1', or('fd2 = 2'), or({ fd3: 'a' })];
      const expected = `(fd1 = 1 OR fd2 = 2 OR fd3 = 'a')`;
      const result = or(...args);
      expect(result).to.eq(expected);
    });
  });
});
