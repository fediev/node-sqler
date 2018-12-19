/* eslint-disable prefer-arrow-callback, func-names */
const { expect } = require('chai');
const {
  select,
  subquery,
  union,
  unionAll,
  insert,
  update,
  delete: del,
} = require('../lib/dml-builder');
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
  having,
} = require('../lib/dml-where-helper');

describe('dml builder', function() {
  describe('select()', function() {
    const tester = function([desc, queryOpts, expected]) {
      it(desc, function() {
        const result = select(queryOpts);
        expect(result).to.eq(expected);
      });
    };

    const testCases = [
      // [description, expression, expected result]
      // select table expression examples
      ['table: string', { tb: 'tb1' }, `SELECT * FROM tb1`],
      [
        'table: object for alias',
        { tb: { tb1: 'a' } },
        `SELECT * FROM tb1 AS a`,
      ],

      // JOIN clause examples
      [
        'join: table name without aliases',
        {
          tb: 'tb1',
          joins: { type: 'inner', tb: 'tb2', on: ['fd11', 'fd21'] },
        },
        `SELECT * FROM tb1 INNER JOIN tb2 ON tb1.fd11 = tb2.fd21`,
      ],
      [
        'join: table name with aliases',
        {
          tb: { tb1: 'a' },
          joins: { type: 'left', tb: { tb2: 'b' }, on: ['fd11', 'fd21'] },
        },
        `SELECT * FROM tb1 AS a LEFT JOIN tb2 AS b ON a.fd11 = b.fd21`,
      ],
      [
        'join: multiple joins',
        {
          tb: { tb1: 'a' },
          joins: [
            { type: 'right', tb: { tb2: 'b' }, on: ['fd11', 'fd21'] },
            { type: 'cross', tb: { tb3: 'c' }, on: ['fd21', 'fd31'] },
          ],
        },
        `SELECT * FROM tb1 AS a RIGHT JOIN tb2 AS b ON a.fd11 = b.fd21 CROSS JOIN tb3 AS c ON b.fd21 = c.fd31`,
      ],

      // SELECT `DISTINCT` examples
      [
        'distinct: true',
        { tb: 'tb1', distinct: true },
        'SELECT DISTINCT * FROM tb1',
      ],

      // SELECT `TOP` examples
      [
        'top: positive number',
        { tb: 'tb1', top: 1 },
        'SELECT TOP 1 * FROM tb1',
      ],
      [
        'top: string of positive number',
        { tb: 'tb1', top: '1' },
        'SELECT TOP 1 * FROM tb1',
      ],

      // select fields examples
      [`fields: (not supplied) --> '*'`, { tb: 'tb1' }, `SELECT * FROM tb1`],
      [
        'fields: string --> trimmed string',
        { tb: 'tb1', fields: `fd1, fd2 AS x, 'str_const', NOW()` },
        `SELECT fd1, fd2 AS x, 'str_const', NOW() FROM tb1`,
      ],
      [
        'fields: object --> field with alias',
        { tb: 'tb1', fields: { fd1: 'a', fd2: 'b' } },
        `SELECT fd1 AS a, fd2 AS b FROM tb1`,
      ],
      [
        'fields: array of string',
        { tb: 'tb1', fields: ['fd1', 'fd2 AS x', `'str_const'`, 'NOW()'] },
        `SELECT fd1, fd2 AS x, 'str_const', NOW() FROM tb1`,
      ],
      [
        'fields: array of string and object',
        { tb: 'tb1', fields: [' fd1 ', { fd2: 'b', fd3: 'c' }] },
        `SELECT fd1, fd2 AS b, fd3 AS c FROM tb1`,
      ],

      // join + field
      [
        'JOIN + fields',
        {
          tb: { tb1: 'a' },
          joins: [{ type: 'left', tb: { tb2: 'b' }, on: ['fd11', 'fd21'] }],
          fields: { a: ['fd11', 'fd12'], b: ['fd21', 'fd22'] },
        },
        `SELECT a.fd11, a.fd12, b.fd21, b.fd22 FROM tb1 AS a LEFT JOIN tb2 AS b ON a.fd11 = b.fd21`,
      ],

      // WHERE clause examples
      [
        'wheres: string',
        { tb: 'tb1', wheres: `fd1 = 1 AND fd2 = 'a'` },
        `SELECT * FROM tb1 WHERE fd1 = 1 AND fd2 = 'a'`,
      ],
      [
        'wheres: function (= where operator processor)',
        { tb: 'tb1', wheres: where('fd1', '=', 'a') },
        `SELECT * FROM tb1 WHERE fd1 = 'a'`,
      ],
      [
        'wheres: object with simple values, array, where processor and function',
        {
          tb: 'tb1',
          wheres: {
            fd1: 1,
            fd2: 'a',
            fd3: [2, 3, 4],
            fd4: where('>', 5),
            fd5: () => 'NOW()',
          },
        },
        `SELECT * FROM tb1 WHERE fd1 = 1 AND fd2 = 'a' AND fd3 IN (2, 3, 4) AND fd4 > 5 AND fd5 = NOW()`,
      ],
      [
        'wheres: array of simple values, object and where processor',
        {
          tb: 'tb1',
          wheres: [
            'fd1 = 1',
            { fd2: 'a', fd3: [2, 3, 4] },
            where('fd4', '>', 5),
            'fd5 = NOW()',
          ],
        },
        `SELECT * FROM tb1 WHERE fd1 = 1 AND fd2 = 'a' AND fd3 IN (2, 3, 4) AND fd4 > 5 AND fd5 = NOW()`,
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

      // GROUP BY clause examples
      [
        'group by: string',
        { tb: 'tb1', groupBy: 'fd1, fd2' },
        'SELECT * FROM tb1 GROUP BY fd1, fd2',
      ],
      [
        'group by: array',
        { tb: 'tb1', groupBy: ['fd1', 'fd2'] },
        'SELECT * FROM tb1 GROUP BY fd1, fd2',
      ],

      // HAVING clause examples : same as where
      [
        'havings: string',
        { tb: 'tb1', groupBy: ['fd1', 'fd2'], havings: `COUNT(fd1) > 5` },
        `SELECT * FROM tb1 GROUP BY fd1, fd2 HAVING COUNT(fd1) > 5`,
      ],
      [
        'havings: function(having operator processor)',
        {
          tb: 'tb1',
          groupBy: ['fd1', 'fd2'],
          havings: having('fd1', '=', 'a'),
        },
        `SELECT * FROM tb1 GROUP BY fd1, fd2 HAVING fd1 = 'a'`,
      ],
      [
        'havings: object with simple values, array, having processor and function',
        {
          tb: 'tb1',
          groupBy: ['fd1', 'fd2'],
          havings: {
            fd1: 1,
            fd2: 'a',
            fd3: [2, 3, 4],
            fd4: having('>', 5),
            fd5: () => 'SUM(fd6)',
          },
        },
        `SELECT * FROM tb1 GROUP BY fd1, fd2 HAVING fd1 = 1 AND fd2 = 'a' AND fd3 IN (2, 3, 4) AND fd4 > 5 AND fd5 = SUM(fd6)`,
      ],
      [
        'havings: array of simple values, object and where processor',
        {
          tb: 'tb1',
          groupBy: ['fd1', 'fd2'],
          havings: [
            'fd1 = 1',
            { fd2: 'a', fd3: [2, 3, 4] },
            having('fd4', '>', 5),
            'fd5 = NOW()',
          ],
        },
        `SELECT * FROM tb1 GROUP BY fd1, fd2 HAVING fd1 = 1 AND fd2 = 'a' AND fd3 IN (2, 3, 4) AND fd4 > 5 AND fd5 = NOW()`,
      ],
      [
        'should ignore havings without groupBy',
        {
          tb: 'tb1',
          havings: `COUNT(fd1) > 10`,
        },
        `SELECT * FROM tb1`,
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
        `array ['fd1', 'fd2'] -> ORDER BY fd1, fd2`,
        {
          tb: 'tb1',
          orderBy: ['fd1', 'fd2'],
        },
        'SELECT * FROM tb1 ORDER BY fd1, fd2',
      ],
      [
        `object { fd1: 'DESC', fd2: 'ASC' } -> ORDER BY fd1 DESC, fd2 ASC`,
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

    testCases.forEach(tester);

    it('should throw when table is not supplied', function() {
      expect(() => select()).to.throw('INVALID_TABLE_NAME');
      expect(() => select({ fields: 'fd1' })).to.throw('INVALID_TABLE_NAME');
    });
  });

  describe('subquery()', function() {
    it('should return function of select() result', function() {
      const queryOpts = { tb: 'tb1' };
      const result = subquery(queryOpts)();
      const expected = '(SELECT * FROM tb1)';
      expect(result).to.eql(expected);
    });
  });

  describe('union()', function() {
    const tester = function([desc, queryOpts, expected]) {
      it(desc, function() {
        const result = union(queryOpts);
        expect(result).to.eq(expected);
      });
    };

    const testCases = [
      [
        'should return union sql of selects',
        {
          selects: [{ tb: 'tb1' }, { tb: 'tb2' }],
        },
        `SELECT * FROM tb1 UNION SELECT * FROM tb2`,
      ],
      [
        'should return union sql of selects and orderBy',
        {
          selects: [{ tb: 'tb1' }, { tb: 'tb2' }],
          orderBy: 'fd1',
        },
        `SELECT * FROM tb1 UNION SELECT * FROM tb2 ORDER BY fd1`,
      ],
    ];

    testCases.forEach(tester);
  });

  describe('unionAll()', function() {
    const tester = function([desc, queryOpts, expected]) {
      it(desc, function() {
        const result = unionAll(queryOpts);
        expect(result).to.eq(expected);
      });
    };

    const testCases = [
      [
        'should return union all sql of selects',
        {
          selects: [{ tb: 'tb1' }, { tb: 'tb2' }],
        },
        `SELECT * FROM tb1 UNION ALL SELECT * FROM tb2`,
      ],
      [
        'should return union all sql of selects and orderBy',
        {
          selects: [{ tb: 'tb1' }, { tb: 'tb2' }],
          orderBy: 'fd1',
        },
        `SELECT * FROM tb1 UNION ALL SELECT * FROM tb2 ORDER BY fd1`,
      ],
    ];

    testCases.forEach(tester);
  });

  describe('insert()', function() {
    const tester = function([desc, queryOpts, expected]) {
      it(desc, function() {
        const result = insert(queryOpts);
        expect(result).to.eq(expected);
      });
    };

    const testCases = [
      //
    ];

    testCases.forEach(tester);
  });

  describe('update()', function() {
    const tester = function([desc, queryOpts, expected]) {
      it(desc, function() {
        const result = update(queryOpts);
        expect(result).to.eq(expected);
      });
    };

    const testCases = [
      //
    ];

    testCases.forEach(tester);
  });

  describe('insert()', function() {
    const tester = function([desc, queryOpts, expected]) {
      it(desc, function() {
        const result = insert(queryOpts);
        expect(result).to.eq(expected);
      });
    };

    const testCases = [
      [
        'should return insert sql',
        {
          tb: 'tb1',
          infos: { fd1: 1, fd2: 'a', fd3: () => 'NOW()' },
        },
        `INSERT INTO tb1 (fd1, fd2, fd3) VALUES (1, 'a', NOW())`,
      ],
      [
        'should return insert sql',
        {
          tb: 'tb1',
          infos: [{ fd1: 1, fd2: 'a' }, { fd1: 2, fd2: () => 'NOW()' }],
        },
        `INSERT INTO tb1 (fd1, fd2) VALUES (1, 'a'), (2, NOW())`,
      ],
      [
        'should return insert sql',
        {
          tb: 'tb1',
          infos: [{ fd1: 1, fd2: 'a' }, { fd1: 2, fd3: () => 'NOW()' }],
        },
        `INSERT INTO tb1 (fd1, fd2, fd3) VALUES (1, 'a', DEFAULT), (2, DEFAULT, NOW())`,
      ],
      [
        'should return insert sql',
        {
          tb: 'tb1',
          infos: [1, 'a', () => 'NOW()'],
        },
        `INSERT INTO tb1 VALUES (1, 'a', NOW())`,
      ],
      [
        'should return insert sql',
        {
          tb: 'tb1',
          infos: [[1, 'a'], [2, () => 'NOW()']],
        },
        `INSERT INTO tb1 VALUES (1, 'a'), (2, NOW())`,
      ],
      [
        'should return insert sql',
        {
          tb: 'tb1',
          fields: 'fd1, fd2, fd3',
          values: `1, 'a', NOW()`,
        },
        `INSERT INTO tb1 (fd1, fd2, fd3) VALUES (1, 'a', NOW())`,
      ],
    ];

    testCases.forEach(tester);
  });

  describe('update()', function() {
    const tester = function([desc, queryOpts, expected]) {
      it(desc, function() {
        const result = update(queryOpts);
        expect(result).to.eq(expected);
      });
    };

    const testCases = [
      [
        'should return update sql from object',
        {
          tb: 'tb1',
          infos: { fd1: 1, fd2: 'a', fd3: () => 'NOW()' },
        },
        `UPDATE tb1 SET fd1 = 1, fd2 = 'a', fd3 = NOW()`,
      ],
      [
        'should return update sql from string',
        {
          tb: 'tb1',
          infos: `fd1 = 1, fd2 = 'a', fd3 = NOW()`,
        },
        `UPDATE tb1 SET fd1 = 1, fd2 = 'a', fd3 = NOW()`,
      ],
      [
        'should return update sql from array of string',
        {
          tb: 'tb1',
          infos: ['fd1 = 1', `fd2 = 'a'`, 'fd3 = NOW()'],
        },
        `UPDATE tb1 SET fd1 = 1, fd2 = 'a', fd3 = NOW()`,
      ],
      [
        'should return update sql from array of string and object',
        {
          tb: 'tb1',
          infos: ['fd1 = 1', { fd2: 'a', fd3: () => 'NOW()' }],
        },
        `UPDATE tb1 SET fd1 = 1, fd2 = 'a', fd3 = NOW()`,
      ],
      [
        'should return update sql with where, order by and limit',
        {
          tb: 'tb1',
          infos: { fd1: 1, fd2: 'a', fd3: () => 'NOW()' },
          wheres: { fd1: 2, fd2: 'b' },
          orderBy: ['fd1', 'fd2'],
          limit: 10,
        },
        `UPDATE tb1 SET fd1 = 1, fd2 = 'a', fd3 = NOW() WHERE fd1 = 2 AND fd2 = 'b' ORDER BY fd1, fd2 LIMIT 10`,
      ],
    ];

    testCases.forEach(tester);
  });

  describe('delete()', function() {
    const tester = function([desc, queryOpts, expected]) {
      it(desc, function() {
        const result = del(queryOpts);
        expect(result).to.eq(expected);
      });
    };

    const testCases = [
      [
        'should return delete sql',
        {
          tb: 'tb1',
          wheres: { fd1: 1 },
        },
        `DELETE FROM tb1 WHERE fd1 = 1`,
      ],
      [
        'should return delete sql with orderBy and limit',
        {
          tb: 'tb1',
          wheres: { fd1: 1 },
          orderBy: 'fd1',
          limit: 5,
        },
        `DELETE FROM tb1 WHERE fd1 = 1 ORDER BY fd1 LIMIT 5`,
      ],
    ];

    testCases.forEach(tester);
  });
});
