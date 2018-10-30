/* eslint-disable prefer-arrow-callback, func-names */
const { expect } = require('chai');
const { select } = require('../lib/sqler');

describe('sqler', function() {
  describe('select()', function() {
    const tests = [
      // [description, limit expression, expected result]

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
});
