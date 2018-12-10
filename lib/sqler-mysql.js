/* eslint-disable consistent-return, promise/avoid-new */
const { createPool } = require('mysql');

const dmlBuilder = require('./dml-builder');

const poolQueryFactory = pool => sql =>
  new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err) {
        return reject(err);
      }

      conn.query(sql, (error, results, fields) => {
        conn.release();
        if (error) {
          return reject(error);
        }

        return resolve({ results, fields });
      });
    });
  });

const poolEndFactory = pool => () =>
  new Promise((resolve, reject) => {
    pool.end(err => {
      if (err) {
        return reject(err);
      }

      return resolve();
    });
  });

const poolBeginFactory = pool => () =>
  new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err) {
        return reject(err);
      }

      conn.beginTransaction(error => {
        if (error) {
          return reject(error);
        }

        const query = trxQueryFactory(conn);
        const commit = trxCommitFactory(conn);
        const rollback = trxRollbackFactory(conn);

        const select = queryEnhancer(query, 'select');
        const insert = queryEnhancer(query, 'insert');
        const update = queryEnhancer(query, 'update');
        const del = queryEnhancer(query, 'delete');
        const selectRow = queryEnhancer(query, 'selectRow');
        const selectValue = queryEnhancer(query, 'selectValue');

        resolve({
          query,
          commit,
          rollback,
          select,
          insert,
          update,
          delete: del,
          selectRow,
          selectValue,
        });
      });
    });
  });

const trxQueryFactory = conn => sql =>
  new Promise((resolve, reject) => {
    conn.query(sql, (error, results, fields) => {
      if (error) {
        return reject(error);
      }

      return resolve({ results, fields });
    });
  });

const trxCommitFactory = conn => () =>
  new Promise((resolve, reject) => {
    conn.commit(err => {
      if (err) {
        return reject(err);
      }

      conn.release();
      return resolve();
    });
  });

const trxRollbackFactory = conn => () =>
  new Promise(resolve => {
    conn.rollback(() => {
      conn.release();
      resolve();
    });
  });

// ---------------------------------------------------------------------

const extractors = {
  select: ({ results }) => results,
  insert: () => {},
  update: () => {},
  delete: () => {},
  selectRow: () => {},
  selectValue: () => {},
};

const queryEnhancer = (query, command) => queryOpts => {
  const statement = ['selectRow', 'selectValue'].includes(command)
    ? 'select'
    : command;
  const sql = dmlBuilder[statement](queryOpts);
  return extractors[command](query(sql));
};

module.exports = {
  createPool,
  poolQueryFactory,
  poolEndFactory,
  poolBeginFactory,
  queryEnhancer,
};
