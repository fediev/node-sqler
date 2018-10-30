/* eslint-disable prefer-arrow-callback, func-names */
const { expect } = require('chai');
const { sqlLimit } = require('../lib/sqler-helper');

describe('sqlerHelper', function() {
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
