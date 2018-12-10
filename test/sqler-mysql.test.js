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
        // TODO: this.skip() does not work. seems like mocha issue.
        this.skip();
        return;
      }
    }

    await mysqlSingleQuery(opts.connOpts, sqlCreateTable);
    await mysqlSingleQuery(opts.connOpts, sqlInsertRows);
  });
  after('drop test table', async function() {
    await mysqlSingleQuery(opts.connOpts, sqlDropTable);
  });

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

      expect(results).to.be.length(3);
      expect(results[0].fd2).to.eql('item1');
    });
    it('should insert a row', async function() {
      const sql = `INSERT tb_for_sqler_testing (fd2) VALUES ('insert test')`;
      const { results } = await pool.query(sql);

      expect(results.affectedRows).to.eql(1);
      expect(results.insertId).to.eql(4);
      expect(results.changedRows).to.eql(0);
    });
    it('should update rows', async function() {
      const sql = `UPDATE tb_for_sqler_testing SET fd2 = 'item2' WHERE fd2 LIKE 'item%'`;
      const { results } = await pool.query(sql);

      expect(results.affectedRows).to.eql(3);
      expect(results.insertId).to.eql(0);
      expect(results.changedRows).to.eql(2);
    });
    it('should delete rows', async function() {
      const sql = `DELETE FROM tb_for_sqler_testing WHERE fd2 LIKE 'item%'`;
      const { results } = await pool.query(sql);

      expect(results.affectedRows).to.eql(3);
      expect(results.insertId).to.eql(0);
      expect(results.changedRows).to.eql(0);
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
      const { results } = await mysqlSingleQuery(opts.connOpts, sqlCountRows);
      const initCountOfRows = results[0].rowCount;

      const trx = await pool.begin();
      await trx.query(sqlInsertARow);

      // in transaction, the row count increases
      expect(await trx.query(sqlCountRows)).to.have.deep.property('results', [
        { rowCount: initCountOfRows + 1 },
      ]);
      // but the row count does not increase outside of the transaction
      expect(
        await mysqlSingleQuery(opts.connOpts, sqlCountRows)
      ).to.have.deep.property('results', [{ rowCount: initCountOfRows }]);

      trx.commit();

      // after commit, the row count increases to 4 outside of the transaction too.
      expect(
        await mysqlSingleQuery(opts.connOpts, sqlCountRows)
      ).to.have.deep.property('results', [{ rowCount: initCountOfRows + 1 }]);
    });

    it('should not insert a row when rollback', async function() {
      const { results } = await mysqlSingleQuery(opts.connOpts, sqlCountRows);
      const initCountOfRows = results[0].rowCount;
      const trx = await pool.begin();
      await trx.query(sqlInsertARow);

      // in transaction, the row count increases
      expect(await trx.query(sqlCountRows)).to.have.deep.property('results', [
        { rowCount: initCountOfRows + 1 },
      ]);
      // but the row count does not increase outside of the transaction
      expect(
        await mysqlSingleQuery(opts.connOpts, sqlCountRows)
      ).to.have.deep.property('results', [{ rowCount: initCountOfRows }]);

      trx.rollback();

      // after rollback, the row count decrease back to init count
      expect(await trx.query(sqlCountRows)).to.have.deep.property('results', [
        { rowCount: initCountOfRows },
      ]);
      // the row count does not change outside of the transaction
      expect(
        await mysqlSingleQuery(opts.connOpts, sqlCountRows)
      ).to.have.deep.property('results', [{ rowCount: initCountOfRows }]);
    });
  });
});
