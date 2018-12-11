/**
 * @file sqler public interface
 */
const mysqlSqler = require('./sqler-mysql');
// TODO: pgSqler
// TODO: mssqlSqler

const SHARED_POOLS = {};

async function initSharedPool(opts, poolName = 'default') {
  if (SHARED_POOLS[poolName]) {
    return;
  }

  SHARED_POOLS[poolName] = await createPool(opts);
}

function getSharedPool(poolName = 'default') {
  if (SHARED_POOLS[poolName]) {
    return SHARED_POOLS[poolName];
  }

  throw new Error('POOL_NOT_INITIALIZED');
}

async function createPool({ engine, connOpts }) {
  const {
    createPool: engineCreatePool,
    poolQueryFactory,
    poolEndFactory,
    poolBeginFactory,
    queryEnhancer,
  } = getEngineSqler(engine);

  const pool = engineCreatePool(connOpts);

  const query = poolQueryFactory(pool);
  const end = poolEndFactory(pool);
  const begin = poolBeginFactory(pool);

  const select = queryEnhancer(query, 'select');
  const insert = queryEnhancer(query, 'insert');
  const update = queryEnhancer(query, 'update');
  const del = queryEnhancer(query, 'delete');
  const selectRow = queryEnhancer(query, 'selectRow');
  const selectValue = queryEnhancer(query, 'selectValue');

  return {
    query,
    begin,
    end,
    select,
    insert,
    update,
    delete: del,
    selectRow,
    selectValue,
  };
}

function getEngineSqler(engine) {
  switch (engine) {
    case 'mysql':
      return mysqlSqler;
    // case 'pg':
    //   return pgSqler;
    // case 'mssql':
    //   return mssqlSqler;
    default:
      throw new Error(`NOT_SUPPORTED_DB_ENGINE(${engine})`);
  }
}

module.exports = {
  createPool,
  initSharedPool,
  getSharedPool,
};
