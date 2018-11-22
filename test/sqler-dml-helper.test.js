/* eslint-disable prefer-arrow-callback, func-names */
const { expect } = require('chai');
const {
  sqlTable,
  sqlJoin,
  sqlTop,
  sqlSelectFields,
  sqlWhere,
  sqlGroupBy,
  sqlHaving,
  sqlOrderBy,
  sqlLimit,
} = require('../lib/sqler-dml-helper');
const { where, having } = require('../lib/sqler-where-processor');

describe('sqlerHelper', function() {
  describe('sqlTable()', function() {
    const tester = function([desc, expr, expected]) {
      it(desc, function() {
        const result = sqlTable(expr);
        expect(result).to.eq(expected);
      });
    };

    const testCases = [
      // [description, expression, expected result]
      ['should get table name on string', ' tb1 ', 'tb1'],
      ['should get table name with alias on object', { tb1: 'a' }, `tb1 AS a`],
    ];

    testCases.forEach(tester);

    it('should throw when no table name supplied', function() {
      expect(() => sqlTable()).to.throw('NO_TABLE_SUPPLIED');
    });
    it('should throw on empty object', function() {
      expect(() => sqlTable({})).to.throw('NO_OBJECT_ENTRY');
    });
  });

  describe('sqlJoin()', function() {
    const tester = function([desc, tb, join, expected]) {
      it(desc, function() {
        const result = sqlJoin(tb, join);
        expect(result).to.eq(expected);
      });
    };

    const testCases = [
      // [description, expression, expected result]
      [
        'should join without table aliases',
        'tb1',
        {
          type: 'inner',
          tb: 'tb2',
          on: ['fd11', 'fd21'],
        },
        'INNER JOIN tb2 ON tb1.fd11 = tb2.fd21',
      ],
      [
        'should join with the first table alias',
        { tb1: 'a' },
        {
          type: 'left',
          tb: 'tb2',
          on: ['fd11', 'fd21'],
        },
        'LEFT JOIN tb2 ON a.fd11 = tb2.fd21',
      ],
      [
        'should join with the second table alias',
        'tb1',
        {
          type: 'left',
          tb: { tb2: 'b' },
          on: ['fd11', 'fd21'],
        },
        'LEFT JOIN tb2 AS b ON tb1.fd11 = b.fd21',
      ],
      [
        'should join with table aliases',
        { tb1: 'a' },
        {
          type: 'left',
          tb: { tb2: 'b' },
          on: ['fd11', 'fd21'],
        },
        'LEFT JOIN tb2 AS b ON a.fd11 = b.fd21',
      ],
      [
        'should join multiple joins',
        { tb1: 'a' },
        [
          {
            type: 'left',
            tb: { tb2: 'b' },
            on: ['fd11', 'fd21'],
          },
          {
            type: 'right',
            tb: { tb3: 'c' },
            on: ['fd21', 'fd31'],
          },
        ],
        'LEFT JOIN tb2 AS b ON a.fd11 = b.fd21 RIGHT JOIN tb3 AS c ON b.fd21 = c.fd31',
      ],
      ['should return empty string on empty join array', { tb1: 'a' }, [], ''],
    ];
    testCases.forEach(tester);
  });

  describe('sqlTop()', function() {
    const tester = function([desc, expr, expected]) {
      it(desc, function() {
        const result = sqlTop(expr);
        expect(result).to.eq(expected);
      });
    };

    const testCases = [
      ['should return TOP cluase on number', 1, 'TOP 1'],
      ['should return a floored integer on non-integer number', 1.9, 'TOP 1'],
      ['should return TOP cluase on string of number', '1', 'TOP 1'],
      ['should return empty string on non-positive number', 0, ''],
      ['should return empty string on non-numeric string', 'a', ''],
      ['should return empty string on array of numbers', [1, 2, 3], ''],
    ];

    testCases.forEach(tester);
  });

  describe('sqlSelectFields()', function() {
    const tester = function([desc, expr, expected]) {
      it(desc, function() {
        const result = sqlSelectFields(expr);
        expect(result).to.eq(expected);
      });
    };

    const testCases = [
      // [description, expression, expected result]
      [`should return '*' on whitespace string`, `   `, `*`],
      [`should return '*' when fields is not supplied`, undefined, `*`],
      [
        `should return trimmed string on string`,
        ` fd1, fd2 AS x `,
        `fd1, fd2 AS x`,
      ],
      [
        `should parse alias on object`,
        { fd1: 'a', fd2: 'b' },
        `fd1 AS a, fd2 AS b`,
      ],
      [
        `should return merged on array`,
        [' fd1 ', 'fd2 AS x', 'COUNT(fd3)'],
        `fd1, fd2 AS x, COUNT(fd3)`,
      ],
      [
        `should return merged on array of string and object`,
        [' fd1 ', { fd2: 'b', fd3: 'c' }],
        `fd1, fd2 AS b, fd3 AS c`,
      ],
      [`should return '*' on empty array`, [], `*`],
      [`should return '*' on empty object`, {}, `*`],
    ];

    testCases.forEach(tester);
  });

  describe('sqlWhere()', function() {
    const tester = function([desc, expr, expected]) {
      it(desc, function() {
        const result = sqlWhere(expr);
        expect(result).to.eq(expected);
      });
    };

    const testCases = [
      // [description, expression, expected result]
      [
        'should return string as it is',
        ` fd1 = 1 AND fd2 = 'a' `,
        `WHERE fd1 = 1 AND fd2 = 'a'`,
      ],
      ['should process function', where('fd1', '=', 'a'), `WHERE fd1 = 'a'`],
      [
        'should process simple value in object',
        { fd1: 1, fd2: 'a' },
        `WHERE fd1 = 1 AND fd2 = 'a'`,
      ],
      [
        'should process array in object',
        { fd1: [1, 'a'] },
        `WHERE fd1 IN (1, 'a')`,
      ],
      [
        'should process function(where operator processor) in object',
        { fd1: where('=', 'a') },
        `WHERE fd1 = 'a'`,
      ],
      [
        'should process string in array',
        ['fd1 = 1', `fd2 = 'a'`],
        `WHERE fd1 = 1 AND fd2 = 'a'`,
      ],
      [
        'should process object in array',
        ['fd1 = 1', { fd2: 'a', fd3: [2, 3, 4] }],
        `WHERE fd1 = 1 AND fd2 = 'a' AND fd3 IN (2, 3, 4)`,
      ],
      [
        'should process function(where operator processor) in array',
        ['fd1 = 1', where('fd2', '=', 'a')],
        `WHERE fd1 = 1 AND fd2 = 'a'`,
      ],
      ['should return empty string on whitespace string', '    ', ''],
    ];

    testCases.forEach(tester);
  });

  describe('sqlGroupBy()', function() {
    const tester = function([desc, expr, expected]) {
      it(desc, function() {
        const result = sqlGroupBy(expr);
        expect(result).to.eq(expected);
      });
    };

    const testCases = [
      // [description, expression, expected result]
      ['should return string as it is', ' fd1, fd2 ', 'GROUP BY fd1, fd2'],
      ['should process array', ['fd1', 'fd2'], 'GROUP BY fd1, fd2'],
      ['should return empty string on whitespace string', '    ', ''],
      ['should return empty string on empty array', [], ''],
    ];

    testCases.forEach(tester);
  });

  describe('sqlHaving()', function() {
    const tester = function([desc, expr, expected]) {
      it(desc, function() {
        const result = sqlHaving(expr, 'just for passing groupBy');
        expect(result).to.eq(expected);
      });
    };

    const testCases = [
      // [description, expression, expected result]
      [
        'should return string as it is',
        ` SUM(fd1) > 10 `,
        `HAVING SUM(fd1) > 10`,
      ],
      [
        'should process function',
        having('SUM(fd1)', '>', 10),
        `HAVING SUM(fd1) > 10`,
      ],
      [
        'should process simple value in object',
        { fd1: 1, fd2: 'a' },
        `HAVING fd1 = 1 AND fd2 = 'a'`,
      ],
      [
        'should process array in object',
        { fd1: [1, 'a'] },
        `HAVING fd1 IN (1, 'a')`,
      ],
      [
        'should process function(where operator processor) in object',
        { fd1: where('=', 'a') },
        `HAVING fd1 = 'a'`,
      ],
      [
        'should process string in array',
        ['SUM(fd1) > 10', `fd2 = 'a'`],
        `HAVING SUM(fd1) > 10 AND fd2 = 'a'`,
      ],
      [
        'should process object in array',
        ['SUM(fd1) > 10', { fd2: 'a', fd3: [2, 3, 4] }],
        `HAVING SUM(fd1) > 10 AND fd2 = 'a' AND fd3 IN (2, 3, 4)`,
      ],
      [
        'should process function(where operator processor) in array',
        ['SUM(fd1) > 10', where('fd2', '=', 'a')],
        `HAVING SUM(fd1) > 10 AND fd2 = 'a'`,
      ],
      ['should return empty string on whitespace string', '    ', ''],
    ];

    testCases.forEach(tester);
  });

  describe('sqlOrderBy()', function() {
    const tester = function([desc, expr, expected]) {
      it(desc, function() {
        const result = sqlOrderBy(expr);
        expect(result).to.eq(expected);
      });
    };

    const testCases = [
      // [description, expression, expected result]
      ['should return string as it is', ' fd1, fd2 ', 'ORDER BY fd1, fd2'],
      ['should process array', ['fd1', 'fd2'], 'ORDER BY fd1, fd2'],
      [
        'should process object',
        { fd1: 'DESC', fd2: 'ASC' },
        'ORDER BY fd1 DESC, fd2 ASC',
      ],
      [
        'should process object value case insensitively',
        { fd1: 'desc', fd2: 'asc' },
        'ORDER BY fd1 DESC, fd2 ASC',
      ],
      ['should return empty string on whitespace string', '    ', ''],
      [
        'should process invalid direction value as ASC',
        { fd1: '_INVALID_DIR_' },
        'ORDER BY fd1 ASC',
      ],
    ];

    testCases.forEach(tester);
  });

  describe('sqlLimit()', function() {
    const tester = function([desc, expr, expected]) {
      it(desc, function() {
        const result = sqlLimit(expr);
        expect(result).to.eq(expected);
      });
    };

    const testCases = [
      // [description, expression, expected result]
      ['should return string as it is', ' 1 ', 'LIMIT 1'],
      ['should return row count on number', 1, 'LIMIT 1'],
      ['should return row count on array', [1], 'LIMIT 1'],
      ['should return offset and row count on array', [1, 2], 'LIMIT 1, 2'],
      ['should return row count on object', { count: 1 }, 'LIMIT 1'],
      [
        'should return row count and offset on object',
        { count: 1, offset: 2 },
        'LIMIT 1 OFFSET 2',
      ],
      ['should return empty string on whitespace string', '    ', ''],
      ['should return empty string on negative number', -1, ''],
      ['should return empty string on empty array', [], ''],
      ['should return empty string on invalid object', { offset: 2 }, ''],
    ];

    testCases.forEach(tester);
  });
});
