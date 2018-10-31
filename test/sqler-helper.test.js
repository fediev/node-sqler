/* eslint-disable prefer-arrow-callback, func-names */
const { expect } = require('chai');
const { sqlOrderBy, sqlLimit } = require('../lib/sqler-helper');

describe('sqlerHelper', function() {
  describe('sqlOrderBy()', function() {
    const tests = [
      // [description, limit expression, expected result]
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

    tests.forEach(function([desc, orderBy, expected]) {
      it(desc, function() {
        const result = sqlOrderBy(orderBy);
        expect(result).to.eq(expected);
      });
    });
  });

  describe('sqlLimit()', function() {
    const tests = [
      // [description, limit expression, expected result]
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

    tests.forEach(function([desc, limit, expected]) {
      it(desc, function() {
        const result = sqlLimit(limit);
        expect(result).to.eq(expected);
      });
    });
  });
});
