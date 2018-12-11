/* eslint-disable func-names, prefer-arrow-callback */
const { expect } = require('chai');
const sqler = require('../lib/sqler');
const { mysqlSingleQuery } = require('../lib/util');
const { mysqlOpts: opts } = require('../.env.testing');

// ---------------------------------------------------------------------

const sqlCreateTable = `
  CREATE TABLE tb_for_sqler_testing (
    fd1 int NOT NULL AUTO_INCREMENT,
    fd2 varchar(100) NOT NULL,
    PRIMARY KEY (fd1)
  )
`;

const sqlDropTable = `
  DROP TABLE tb_for_sqler_testing
`;

const sqlInsertRows = `
  INSERT tb_for_sqler_testing (fd2)
    VALUES ('item1'), ('item2'), ('item3')
`;

const sqlTruncateTable = `
  TRUNCATE TABLE tb_for_sqler_testing
`;

// ---------------------------------------------------------------------

describe('mysqlSqler', function() {
  before('clean up, check connection and create test table', async function() {
    this.timeout(10 * 1000);
    try {
      await mysqlSingleQuery(opts.connOpts, sqlDropTable);
    } catch (e) {
      if (e.code !== 'ER_BAD_TABLE_ERROR') {
        console.warn('[WARN] testing mysql sqler skipped');
        console.warn('[WARN]   reason :', e.sqlMessage || e.code || e);
        // FIXME: this.skip() does not work. seems like mocha issue.
        this.skip();
        return;
      }
    }
    await mysqlSingleQuery(opts.connOpts, sqlCreateTable);
  });
  after('drop test table', async function() {
    await mysqlSingleQuery(opts.connOpts, sqlDropTable);
  });
  beforeEach('reset test table', async function() {
    await mysqlSingleQuery(opts.connOpts, sqlTruncateTable);
    await mysqlSingleQuery(opts.connOpts, sqlInsertRows);
  });

  const initRowCount = 3;
  const firstRow = { fd1: 1, fd2: 'item1' };
  const lastRow = { fd1: 3, fd2: 'item3' };

  describe('pool.query()', function() {
    let pool = null;
    before(async function() {
      pool = await sqler.createPool(opts);
    });
    after(async function() {
      await pool.end();
    });

    it('should select rows', async function() {
      const sql = `SELECT * FROM tb_for_sqler_testing`;
      const { results } = await pool.query(sql);

      expect(results).to.be.length(initRowCount);
      expect(results[0]).to.include(firstRow);
    });
    it('should insert a row', async function() {
      const sql = `INSERT tb_for_sqler_testing (fd2) VALUES ('insert test')`;
      const expected = {
        affectedRows: 1,
        insertId: initRowCount + 1,
        changedRows: 0,
      };
      const { results } = await pool.query(sql);

      expect(results).to.include(expected);
    });
    it('should update rows', async function() {
      const sql = `UPDATE tb_for_sqler_testing SET fd2 = 'item2' WHERE fd2 LIKE 'item%'`;
      const expected = {
        affectedRows: initRowCount,
        insertId: 0,
        changedRows: initRowCount - 1,
      };
      const { results } = await pool.query(sql);

      expect(results).to.include(expected);
    });
    it('should delete rows', async function() {
      const sql = `DELETE FROM tb_for_sqler_testing WHERE fd2 LIKE 'item%'`;
      const expected = {
        affectedRows: initRowCount,
        insertId: 0,
        changedRows: 0,
      };
      const { results } = await pool.query(sql);

      expect(results).to.include(expected);
    });
  });

  describe('pool.select(), selectRow(), selectValue()', function() {
    let pool = null;
    before(async function() {
      pool = await sqler.createPool(opts);
    });
    after(async function() {
      await pool.end();
    });

    const queryOpts = {
      tb: 'tb_for_sqler_testing',
    };

    it('should return array of rows', async function() {
      const result = await pool.select(queryOpts);

      expect(result).to.have.length(initRowCount);
      expect(result[0]).to.include(firstRow);
    });
    it('should return a row', async function() {
      const result = await pool.selectRow(queryOpts);

      expect(result).to.be.an('object');
      expect(result).to.include(firstRow);
    });
    it('should return a value', async function() {
      const result = await pool.selectValue(queryOpts);
      expect(result).to.eql(firstRow.fd1);
    });
  });

  describe('pool.end()', function() {
    it('should throw error when querying after end() called', async function() {
      const pool = await sqler.createPool(opts);
      let isThrown = false;
      try {
        await pool.end();
        await pool.query('SELECT 1');
      } catch (e) {
        isThrown = true;
        expect(e.code).to.eql('POOL_CLOSED');
      } finally {
        // eslint-disable-next-line no-unused-expressions
        expect(isThrown).to.be.true;
      }
    });
  });

  describe('pool.begin(), trx.query(), trx.commit() and trx.rollback()', function() {
    let pool = null;
    before(async function() {
      pool = await sqler.createPool(opts);
    });
    after(async function() {
      await pool.end();
    });
    const sqlCountRows = `SELECT COUNT(*) AS rowCount FROM tb_for_sqler_testing`;
    const sqlInsertARow = `INSERT tb_for_sqler_testing (fd2) VALUES ('trx test')`;

    it('should insert a row after commit', async function() {
      const trx = await pool.begin();
      await trx.query(sqlInsertARow);

      // in transaction, the row count increases
      expect(await trx.query(sqlCountRows)).to.have.deep.property('results', [
        { rowCount: initRowCount + 1 },
      ]);
      // but the row count does not increase outside of the transaction
      expect(
        await mysqlSingleQuery(opts.connOpts, sqlCountRows)
      ).to.have.deep.property('results', [{ rowCount: initRowCount }]);

      trx.commit();

      // after commit, the row count increases to 4 outside of the transaction too.
      expect(
        await mysqlSingleQuery(opts.connOpts, sqlCountRows)
      ).to.have.deep.property('results', [{ rowCount: initRowCount + 1 }]);
    });

    it('should not insert a row when rollback', async function() {
      const trx = await pool.begin();
      await trx.query(sqlInsertARow);

      // in transaction, the row count increases
      expect(await trx.query(sqlCountRows)).to.have.deep.property('results', [
        { rowCount: initRowCount + 1 },
      ]);
      // but the row count does not increase outside of the transaction
      expect(
        await mysqlSingleQuery(opts.connOpts, sqlCountRows)
      ).to.have.deep.property('results', [{ rowCount: initRowCount }]);

      trx.rollback();

      // after rollback, the row count decrease back to init count
      expect(await trx.query(sqlCountRows)).to.have.deep.property('results', [
        { rowCount: initRowCount },
      ]);
      // the row count does not change outside of the transaction
      expect(
        await mysqlSingleQuery(opts.connOpts, sqlCountRows)
      ).to.have.deep.property('results', [{ rowCount: initRowCount }]);
    });
  });

  describe('pool.union(), unionAll()', function() {
    let pool = null;
    before(async function() {
      pool = await sqler.createPool(opts);
    });
    after(async function() {
      await pool.end();
    });

    it('should fetch union query result', async function() {
      const queryOpts = {
        selects: [
          { tb: 'tb_for_sqler_testing' },
          { tb: 'tb_for_sqler_testing' },
        ],
      };
      const result = await pool.union(queryOpts);
      expect(result).to.have.length(initRowCount);
      expect(result[0]).to.include(firstRow);
    });
    it('should fetch ordered union query result ', async function() {
      const queryOpts = {
        selects: [
          { tb: 'tb_for_sqler_testing' },
          { tb: 'tb_for_sqler_testing' },
        ],
        orderBy: 'fd1 DESC',
      };
      const result = await pool.union(queryOpts);
      expect(result).to.have.length(initRowCount);
      expect(result[0]).to.include(lastRow);
    });

    it('should fetch union all query result', async function() {
      const queryOpts = {
        selects: [
          { tb: 'tb_for_sqler_testing' },
          { tb: 'tb_for_sqler_testing' },
        ],
      };
      const result = await pool.unionAll(queryOpts);
      expect(result).to.have.length(initRowCount * 2);
      expect(result[0]).to.include(firstRow);
    });
    it('should fetch ordered union all query result', async function() {
      const queryOpts = {
        selects: [
          { tb: 'tb_for_sqler_testing' },
          { tb: 'tb_for_sqler_testing' },
        ],
        orderBy: 'fd1 DESC',
      };
      const result = await pool.unionAll(queryOpts);
      expect(result).to.have.length(initRowCount * 2);
      expect(result[0]).to.include(lastRow);
    });
  });
});
