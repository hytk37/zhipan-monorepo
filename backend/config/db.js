/**
 * MySQL 连接池
 *
 * 设计要点：
 *   1. mysql2 采用「懒加载」——没装驱动或没配数据库时，API 服务仍能正常启动
 *      （路由继续走内存 Mock），只是调用 db 相关方法会抛出可读的错误。
 *   2. 只导出 { pool, query, queryOne, transaction, healthCheck }，
 *      业务代码不直接碰 mysql2，将来换驱动只改这一个文件。
 *   3. 所有查询都必须使用占位符（?）传参，禁止字符串拼接 SQL。
 */
require('./env');

const cfg = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'zhipan_canteen',
  charset: 'utf8mb4_unicode_ci',
  timezone: process.env.DB_TIMEZONE || '+08:00',
  connectionLimit: parseInt(process.env.DB_POOL_SIZE, 10) || 10,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  dateStrings: ['DATE', 'DATETIME'], // 日期以字符串返回，避免时区偏移
  multipleStatements: false,         // 防注入：禁止一次执行多语句
};

let _pool = null;

/** 获取连接池（首次调用时创建） */
function getPool() {
  if (_pool) return _pool;
  let mysql;
  try {
    mysql = require('mysql2/promise');
  } catch (e) {
    const err = new Error(
      '未安装 mysql2 驱动。请先执行：cd backend && npm install mysql2'
    );
    err.code = 'MYSQL2_MISSING';
    throw err;
  }
  _pool = mysql.createPool(cfg);
  return _pool;
}

const pool = new Proxy(
  {},
  {
    get: function (t, prop) {
      const p = getPool();
      const v = p[prop];
      return typeof v === 'function' ? v.bind(p) : v;
    },
  }
);

/** 查询多行 */
async function query(sql, params) {
  const [rows] = await getPool().execute(sql, params || []);
  return rows;
}

/** 查询单行（无结果返回 null） */
async function queryOne(sql, params) {
  const rows = await query(sql, params);
  return rows.length ? rows[0] : null;
}

/**
 * 事务包装
 *   await transaction(async (conn) => {
 *     await conn.execute('INSERT ...', [...])
 *   })
 * 回调抛错则自动回滚，正常返回则提交。
 */
async function transaction(handler) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const result = await handler(conn);
    await conn.commit();
    return result;
  } catch (e) {
    try {
      await conn.rollback();
    } catch (_) {
      /* 回滚失败时保留原始错误 */
    }
    throw e;
  } finally {
    conn.release();
  }
}

/** 连通性自检：返回 { ok, version, database } 或抛错 */
async function healthCheck() {
  const row = await queryOne('SELECT VERSION() AS version, DATABASE() AS `database`');
  return { ok: true, version: row.version, database: row.database };
}

/** 关闭连接池（测试/脚本结束用） */
async function close() {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}

module.exports = {
  config: cfg,
  pool,
  query,
  queryOne,
  transaction,
  healthCheck,
  close,
};
