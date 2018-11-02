/* eslint-disable prefer-arrow-callback, func-names */
const { expect } = require('chai');
const {
  sqlSelectFields,
  sqlWhere,
  sqlOrderBy,
  sqlLimit,
} = require('../lib/sqler-helper');
const { where } = require('../lib/sqler-where-processor');

describe('sqlerHelper', function() {
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
