/* eslint-disable prefer-arrow-callback, func-names */
const { expect } = require('chai');
const {
  sqlTable,
  sqlJoin,
  sqlDistinct,
  sqlTop,
  sqlSelectFields,
  sqlWhere,
  sqlGroupByHaving,
  sqlGroupBy,
  sqlHaving,
  sqlOrderBy,
  sqlLimit,
  sqlInsertInfos,
  sqlUpdateInfos,
} = require('../lib/dml-helper');
const { where, having, or } = require('../lib/dml-where-helper');

describe('dml builder helper', function() {
  describe('sqlTable()', function() {
    const tester = function([desc, expr, expected]) {
      it(desc, function() {
        const result = sqlTable(expr);
        expect(result).to.eq(expected);
      });
    };

    const testCases = [
      // [description, expression, expected result]
      ['string --> trimmed string', ' tb1 ', 'tb1'],
      ['object --> table name with alias', { tb1: 'a' }, `tb1 AS a`],
    ];

    testCases.forEach(tester);

    it('should throw when no table name supplied', function() {
      expect(() => sqlTable()).to.throw('INVALID_TABLE_NAME');
    });
    it('should throw on empty object', function() {
      expect(() => sqlTable({})).to.throw('NO_OBJECT_ENTRY');
    });
    it('should throw on null', function() {
      expect(() => sqlTable({})).to.throw('NO_OBJECT_ENTRY');
    });
    it('should throw when tb is not string or object', function() {
      expect(() => sqlTable(1)).to.throw('INVALID_TABLE_NAME');
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
      // [description, tb, join, expected result]
      [
        'join without table aliases',
        'tb1',
        { type: 'inner', tb: 'tb2', on: ['fd11', 'fd21'] },
        'INNER JOIN tb2 ON tb1.fd11 = tb2.fd21',
      ],
      [
        'join with the first table alias',
        { tb1: 'a' },
        { type: 'left', tb: 'tb2', on: ['fd11', 'fd21'] },
        'LEFT JOIN tb2 ON a.fd11 = tb2.fd21',
      ],
      [
        'join with the second table alias',
        'tb1',
        { type: 'right', tb: { tb2: 'b' }, on: ['fd11', 'fd21'] },
        'RIGHT JOIN tb2 AS b ON tb1.fd11 = b.fd21',
      ],
      [
        'join with table aliases',
        { tb1: 'a' },
        { type: 'cross', tb: { tb2: 'b' }, on: ['fd11', 'fd21'] },
        'CROSS JOIN tb2 AS b ON a.fd11 = b.fd21',
      ],
      [
        'multiple joins',
        { tb1: 'a' },
        [
          { type: 'left', tb: { tb2: 'b' }, on: ['fd11', 'fd21'] },
          { type: 'right', tb: { tb3: 'c' }, on: ['fd21', 'fd31'] },
        ],
        'LEFT JOIN tb2 AS b ON a.fd11 = b.fd21 RIGHT JOIN tb3 AS c ON b.fd21 = c.fd31',
      ],
      [`whitespace --> ''`, 'tb1', '    ', ''],
      [`[] --> ''`, 'tb1', [], ''],
      [`[...invalid join values] --> ''`, 'tb1', [{}, 1, 'join'], ''],
      [`{} --> ''`, 'tb1', {}, ''],
      [`null --> ''`, 'tb1', null, ''],
      [`undefined --> ''`, 'tb1', undefined, ''],
    ];
    testCases.forEach(tester);
  });

  describe('sqlDistinct()', function() {
    const tester = function([desc, expr, expected]) {
      it(desc, function() {
        const result = sqlDistinct(expr);
        expect(result).to.eq(expected);
      });
    };

    const testCases = [
      [`true --> 'DISTINCT'`, true, 'DISTINCT'],
      [`false --> ''`, false, ''],
      [`others --> ''`, 1, ''],
      [`undefined --> ''`, undefined, ''],
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
      [`positive int --> int`, 1, 'TOP 1'],
      ['positive float --> floored number', 1.9, 'TOP 1'],
      ['string of positive number --> parsed number', '1', 'TOP 1'],
      [`non-positive number --> ''`, 0, ''],
      [`non-numeric string --> ''`, 'a', ''],
      [`array of numbers --> ''`, [1, 2, 3], ''],
      [`undefined --> ''`, undefined, ''],
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
      [`whitespace --> '*'`, `   `, `*`],
      [`undefined --> '*'`, undefined, `*`],
      [
        `string --> trimmed string`,
        ` fd1, fd2 AS x, 'str_const', NOW() `,
        `fd1, fd2 AS x, 'str_const', NOW()`,
      ],
      [
        `{ fd1: 'a' } --> 'fd1 AS a'`,
        { fd1: 'a', fd2: 'b' },
        `fd1 AS a, fd2 AS b`,
      ],
      [
        `[...strings] --> joined`,
        ['fd1', 'fd2 AS x', `'str_const'`, 'NOW()'],
        `fd1, fd2 AS x, 'str_const', NOW()`,
      ],
      [
        `[...strings and objects] --> joined`,
        [' fd1 ', { fd2: 'b', fd3: 'c' }],
        `fd1, fd2 AS b, fd3 AS c`,
      ],
      [
        `{ tableAlias: [...fields] } --> tableAlias.field ...`,
        { a: ['fd11', 'fd12'], b: ['fd21', 'fd22'] },
        `a.fd11, a.fd12, b.fd21, b.fd22`,
      ],
      [`[] --> '*'`, [], `*`],
      [`{} --> '*'`, {}, `*`],
      [`null --> '*'`, null, `*`],
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
        'string --> trimmed string',
        ` fd1 = 1 AND fd2 = 'a' `,
        `WHERE fd1 = 1 AND fd2 = 'a'`,
      ],
      [
        'function(= where processor) --> field + operator + escaped value',
        where('fd1', '=', 'a'),
        `WHERE fd1 = 'a'`,
      ],
      [
        'object of simple values --> field = escaped value',
        { fd1: 1, fd2: 'a' },
        `WHERE fd1 = 1 AND fd2 = 'a'`,
      ],
      [
        'array in object --> field IN (...values)',
        { fd1: [1, 'a'] },
        `WHERE fd1 IN (1, 'a')`,
      ],
      [
        'where processor in object -> key as field + operator + escaped value',
        { fd1: where('=', 'a') },
        `WHERE fd1 = 'a'`,
      ],
      [
        'function(non where processor) in object -> key as field = non-escaped string',
        { fd1: () => 'NOW()' },
        `WHERE fd1 = NOW()`,
      ],
      [
        `[...strings] --> joined with 'AND'`,
        ['fd1 = 1', `fd2 = 'a'`],
        `WHERE fd1 = 1 AND fd2 = 'a'`,
      ],
      [
        `object in array --> joined with 'AND'`,
        ['fd1 = 1', { fd2: 'a', fd3: [2, 3, 4] }],
        `WHERE fd1 = 1 AND fd2 = 'a' AND fd3 IN (2, 3, 4)`,
      ],
      [
        `function(where processor) in array --> joined with 'AND'`,
        ['fd1 = 1', where('fd2', '=', 'a')],
        `WHERE fd1 = 1 AND fd2 = 'a'`,
      ],
      [`whitespace --> ''`, '    ', ''],
      [`funtion without string return --> ''`, () => 1, ''],
      [`[] --> ''`, [], ''],
      [`{} --> ''`, {}, ''],
      [`null --> ''`, null, ''],
      [`undefined --> ''`, undefined, ''],
    ];

    testCases.forEach(tester);

    it('should ignore OR of the first item', function() {
      const wheres = [or('fd1 = 1'), `fd2 = 'a'`];
      const expected = `WHERE fd1 = 1 AND fd2 = 'a'`;
      const result = sqlWhere(wheres);
      expect(result).to.eq(expected);
    });
  });

  describe('sqlGroupByHaving()', function() {
    const tester = function([desc, groupBy, havings, expected]) {
      it(desc, function() {
        const result = sqlGroupByHaving(groupBy, havings);
        expect(result).to.eq(expected);
      });
    };

    const testCases = [
      // [description, expression, expected result]
      [
        'groupBy + havings',
        ['fd1', 'fd2'],
        having('SUM(fd1)', '>', 10),
        'GROUP BY fd1, fd2 HAVING SUM(fd1) > 10',
      ],
      ['groupBy only', ['fd1', 'fd2'], null, 'GROUP BY fd1, fd2'],
      [`no groupBy --> ''`, null, 'SUM(fd1) > 10', ''],
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
      ['string --> prepend GROUP BY', ' fd1, fd2 ', 'GROUP BY fd1, fd2'],
      ['array --> prepend GROUP BY', ['fd1', 'fd2'], 'GROUP BY fd1, fd2'],
      [`whitespace --> ''`, '    ', ''],
      [`[] --> ''`, [], ''],
      [`{} --> ''`, {}, ''],
      [`null --> ''`, null, ''],
      [`undefined --> ''`, undefined, ''],
    ];

    testCases.forEach(tester);
  });

  describe('sqlHaving()', function() {
    const tester = function([desc, expr, expected]) {
      it(desc, function() {
        const result = sqlHaving(expr);
        expect(result).to.eq(expected);
      });
    };

    const testCases = [
      // [description, expression, expected result]
      ['string --> trimmed string', ` SUM(fd1) > 10 `, `HAVING SUM(fd1) > 10`],
      [
        'function(= having processor) --> field + operator + escaped value',
        having('SUM(fd1)', '>', 10),
        `HAVING SUM(fd1) > 10`,
      ],
      [
        'object of simple values --> field = escaped value',
        { fd1: 1, fd2: 'a' },
        `HAVING fd1 = 1 AND fd2 = 'a'`,
      ],
      [
        'array in object --> field IN (...values)',
        { fd1: [1, 'a'] },
        `HAVING fd1 IN (1, 'a')`,
      ],
      [
        'having processor in object -> key as field + operator + escaped value',
        { fd1: having('=', 'a') },
        `HAVING fd1 = 'a'`,
      ],
      [
        'function(non having processor) in object -> key as field = non-escaped string',
        { fd1: () => 'NOW()' },
        `HAVING fd1 = NOW()`,
      ],
      [
        `[...strings] --> joined with 'AND'`,
        ['SUM(fd1) > 10', `fd2 = 'a'`],
        `HAVING SUM(fd1) > 10 AND fd2 = 'a'`,
      ],
      [
        `object in array --> joined with 'AND'`,
        ['SUM(fd1) > 10', { fd2: 'a', fd3: [2, 3, 4] }],
        `HAVING SUM(fd1) > 10 AND fd2 = 'a' AND fd3 IN (2, 3, 4)`,
      ],
      [
        `function(having processor) in array --> joined with 'AND'`,
        ['SUM(fd1) > 10', having('fd2', '=', 'a')],
        `HAVING SUM(fd1) > 10 AND fd2 = 'a'`,
      ],
      [`whitespace --> ''`, '    ', ''],
      [`funtion without string return --> ''`, () => 1, ''],
      [`[] --> ''`, [], ''],
      [`{} --> ''`, {}, ''],
      [`null --> ''`, null, ''],
      [`undefined --> ''`, undefined, ''],
    ];

    testCases.forEach(tester);

    it('should ignore OR of the first item', function() {
      const havings = [or('fd1 = 1'), `fd2 = 'a'`];
      const expected = `HAVING fd1 = 1 AND fd2 = 'a'`;
      const result = sqlHaving(havings);
      expect(result).to.eq(expected);
    });
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
      [
        'string --> trim and prepend ORDER BY',
        ' fd1, fd2 ',
        'ORDER BY fd1, fd2',
      ],
      ['arry --> prepend ORDER BY', ['fd1', 'fd2'], 'ORDER BY fd1, fd2'],
      [
        'object -> prepend ORDER BY with direction',
        { fd1: 'DESC', fd2: 'ASC' },
        'ORDER BY fd1 DESC, fd2 ASC',
      ],
      [
        'should process object value case insensitively',
        { fd1: 'desc', fd2: 'asc' },
        'ORDER BY fd1 DESC, fd2 ASC',
      ],
      [
        'should process invalid direction value as ASC',
        { fd1: '_INVALID_DIR_' },
        'ORDER BY fd1 ASC',
      ],
      [`whitespace --> ''`, '    ', ''],
      [`[] --> ''`, [], ''],
      [`{} --> ''`, {}, ''],
      [`null --> ''`, null, ''],
      [`undefined --> ''`, undefined, ''],
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
      ['should return empty string on null', null, ''],
    ];

    testCases.forEach(tester);
  });

  describe('sqlInsertInfos()', function() {
    const tester = function([
      desc,
      infos,
      { insertFields: expectedFields, insertValues: expectedValues },
    ]) {
      it(desc, function() {
        const {
          insertFields: resultFields,
          insertValues: resultValues,
        } = sqlInsertInfos(infos);
        expect(resultFields).to.eq(expectedFields);
        expect(resultValues).to.eq(expectedValues);
      });
    };

    const testCases = [
      // [description, expression, expected result]
      [
        'object infos',
        { fd1: 1, fd2: 'a', fd3: () => 'NOW()' },
        { insertFields: `(fd1, fd2, fd3)`, insertValues: `(1, 'a', NOW())` },
      ],
      [
        'array of object infos with same format',
        [{ fd1: 1, fd2: 'a' }, { fd1: 2, fd2: () => 'NOW()' }],
        { insertFields: `(fd1, fd2)`, insertValues: `(1, 'a'), (2, NOW())` },
      ],
      [
        'array of object infos with diffent format',
        [{ fd1: 1, fd2: 'a' }, { fd1: 2, fd3: () => 'NOW()' }],
        {
          insertFields: `(fd1, fd2, fd3)`,
          insertValues: `(1, 'a', DEFAULT), (2, DEFAULT, NOW())`,
        },
      ],
      [
        'array of non object infos',
        [1, 'a', () => 'NOW()'],
        {
          insertFields: '',
          insertValues: `(1, 'a', NOW())`,
        },
      ],
      [
        'array of non object array infos',
        [[1, 'a'], [2, () => 'NOW()']],
        {
          insertFields: '',
          insertValues: `(1, 'a'), (2, NOW())`,
        },
      ],
    ];

    testCases.forEach(tester);
  });

  describe('sqlUpdateInfos()', function() {
    const tester = function([desc, expr, expected]) {
      it(desc, function() {
        const result = sqlUpdateInfos(expr);
        expect(result).to.eq(expected);
      });
    };

    const testCases = [
      // [description, expression, expected result]
      [
        'should return string as it is',
        `  fd1 = 1, fd2 = 'a', fd3 = NOW()  `,
        `fd1 = 1, fd2 = 'a', fd3 = NOW()`,
      ],
      [
        'should return string as it is',
        {
          fd1: 1,
          fd2: 'a',
          fd3: () => 'NOW()',
        },
        `fd1 = 1, fd2 = 'a', fd3 = NOW()`,
      ],
      [
        'should return string as it is',
        ['fd1 = 1', `fd2 = 'a'`, 'fd3 = NOW()'],
        `fd1 = 1, fd2 = 'a', fd3 = NOW()`,
      ],
      [
        'should return string as it is',
        [
          'fd1 = 1',
          {
            fd2: 'a',
            fd3: () => 'NOW()',
          },
        ],
        `fd1 = 1, fd2 = 'a', fd3 = NOW()`,
      ],
    ];

    testCases.forEach(tester);
  });
});
