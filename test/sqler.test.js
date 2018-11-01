/* eslint-disable prefer-arrow-callback, func-names */
const { expect } = require('chai');
const { select, subquery } = require('../lib/sqler');
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
} = require('../lib/sqler-where-processor');

describe('sqler', function() {
  describe('select()', function() {
    const tests = [
      // [description, limit expression, expected result]
      // WHERE clause examples
      [
        'wheres: string',
        {
          tb: 'tb1',
          wheres: ` fd1 = 1 AND fd2 = 'a' `,
        },
        `SELECT * FROM tb1 WHERE fd1 = 1 AND fd2 = 'a'`,
      ],
      [
        'wheres: function(where operator processor)',
        {
          tb: 'tb1',
          wheres: where('fd1', '=', 'a'),
        },
        `SELECT * FROM tb1 WHERE fd1 = 'a'`,
      ],
      [
        'wheres: object with simple value, array and function',
        {
          tb: 'tb1',
          wheres: {
            fd1: 1,
            fd2: 'a',
            fd3: [2, 3, 4],
            fd4: where('>', 5),
          },
        },
        `SELECT * FROM tb1 WHERE fd1 = 1 AND fd2 = 'a' AND fd3 IN (2, 3, 4) AND fd4 > 5`,
      ],
      [
        'wheres: array with simple value, object and function',
        {
          tb: 'tb1',
          wheres: [
            'fd1 = 1',
            { fd2: 'a', fd3: [2, 3, 4] },
            where('fd4', '>', 5),
          ],
        },
        `SELECT * FROM tb1 WHERE fd1 = 1 AND fd2 = 'a' AND fd3 IN (2, 3, 4) AND fd4 > 5`,
      ],
      // WHERE - AND, OR
      [
        'wheres: A OR B OR C',
        {
          tb: 'tb1',
          wheres: ['fd1 = 1', or({ fd2: 'a' }), or(where('fd3', '>', 2))],
        },
        `SELECT * FROM tb1 WHERE fd1 = 1 OR fd2 = 'a' OR fd3 > 2`,
      ],
      [
        'wheres: A AND (B OR C)',
        {
          tb: 'tb1',
          wheres: ['fd1 = 1', or({ fd2: 'a' }, where('fd3', '>', 2))],
        },
        `SELECT * FROM tb1 WHERE fd1 = 1 AND (fd2 = 'a' OR fd3 > 2)`,
      ],
      // WHERE - operator expressions
      [
        'wheres: operator expressions',
        {
          tb: 'tb1',
          wheres: [
            whereLike('fd1', '%hello%'),
            whereNotLike('fd2', '%world%'),
            whereIn('fd3', [1, 2, 3]),
            whereNotIn('fd4', [4, 5, 6]),
            whereNull('fd5'),
            whereNotNull('fd6'),
            whereBetween('fd7', 10, 20),
            whereNotBetween('fd8', 30, 40),
            whereNot('fd9', '<', 8),
          ],
        },
        `SELECT * FROM tb1 WHERE fd1 LIKE '%hello%' AND fd2 NOT LIKE '%world%' AND fd3 IN (1, 2, 3) AND fd4 NOT IN (4, 5, 6) AND fd5 IS NULL AND fd6 IS NOT NULL AND fd7 BETWEEN 10 AND 20 AND fd8 NOT BETWEEN 30 AND 40 AND NOT fd9 < 8`,
      ],
      [
        'wheres: whereExists()',
        {
          tb: 'tb1',
          wheres: [
            whereExists(subquery({ tb: 'tb2' })),
            whereNotExists(subquery({ tb: 'tb3' })),
          ],
        },
        `SELECT * FROM tb1 WHERE EXISTS (SELECT * FROM tb2) AND NOT EXISTS (SELECT * FROM tb3)`,
      ],

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
});
