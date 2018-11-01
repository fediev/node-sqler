/* eslint-disable prefer-arrow-callback, func-names */
const { expect } = require('chai');
const {
  select,
  subquery,
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
} = require('../lib/sqler');

describe('sqler', function() {
  describe('select()', function() {
    const tests = [
      // [description, limit expression, expected result]
      // ORDER BY clause examples
      [
        'string -> ORDER BY fd1, fd2',
        {
          tb: 'tb1',
          orderBy: ' fd1, fd2 ',
        },
        'SELECT * FROM tb1 ORDER BY fd1, fd2',
      ],
      [
        'array ["fd1", "fd2"] -> ORDER BY fd1, fd2',
        {
          tb: 'tb1',
          orderBy: ['fd1', 'fd2'],
        },
        'SELECT * FROM tb1 ORDER BY fd1, fd2',
      ],
      [
        'object { fd1: "DESC", fd2: "ASC" } -> ORDER BY fd1 DESC, fd2 ASC',
        {
          tb: 'tb1',
          orderBy: { fd1: 'DESC', fd2: 'ASC' },
        },
        'SELECT * FROM tb1 ORDER BY fd1 DESC, fd2 ASC',
      ],
      // LIMIT clause examples
      [
        'string -> LIMIT 1, 2',
        {
          tb: 'tb1',
          limit: '  1, 2   ',
        },
        'SELECT * FROM tb1 LIMIT 1, 2',
      ],
      [
        'number -> LIMIT 1',
        {
          tb: 'tb1',
          limit: 1,
        },
        'SELECT * FROM tb1 LIMIT 1',
      ],
      [
        'array [1] -> LIMIT 1',
        {
          tb: 'tb1',
          limit: [1],
        },
        'SELECT * FROM tb1 LIMIT 1',
      ],

      [
        'array [1, 2] -> LIMIT 1, 2',
        {
          tb: 'tb1',
          limit: [1, 2],
        },
        'SELECT * FROM tb1 LIMIT 1, 2',
      ],
      [
        'object { count: 1 } -> LIMIT 1',
        {
          tb: 'tb1',
          limit: { count: 1 },
        },
        'SELECT * FROM tb1 LIMIT 1',
      ],
      [
        'object { count: 1, offset: 2 } -> LIMIT 1, 2',
        {
          tb: 'tb1',
          limit: { count: 1, offset: 2 },
        },
        'SELECT * FROM tb1 LIMIT 1 OFFSET 2',
      ],
    ];

    tests.forEach(function([desc, queryOption, expected]) {
      it(desc, function() {
        const result = select(queryOption);
        expect(result).to.eq(expected);
      });
    });
  });

  describe('subquery()', function() {
    it('should return function of select() result', function() {
      const queryOptions = { tb: 'tb1' };
      const result = subquery(queryOptions)();
      const expected = '(SELECT * FROM tb1)';
      expect(result).to.eql(expected);
    });
  });

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
