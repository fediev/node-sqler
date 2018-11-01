/* eslint-disable prefer-arrow-callback, func-names */
const { expect } = require('chai');
const {
  select,
  subquery
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
});
