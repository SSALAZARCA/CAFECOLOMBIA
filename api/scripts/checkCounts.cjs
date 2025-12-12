const mysql = require('mysql2/promise');

const dbConfig = {
  host: '193.203.175.58',
  port: 3306,
  user: 'u689528678_SSALAZARCA',
  password: 'Ssc841209*',
  database: 'u689528678_CAFECOLOMBIA',
  charset: 'utf8mb4',
  timezone: '+00:00',
  ssl: { rejectUnauthorized: false }
};

async function main() {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    const [[growers]] = await conn.execute('SELECT COUNT(*) AS count FROM coffee_growers');
    const [[farms]] = await conn.execute('SELECT COUNT(*) AS count FROM farms');
    const [[areas]] = await conn.execute('SELECT ROUND(SUM(total_area), 2) AS total_area, ROUND(SUM(coffee_area), 2) AS coffee_area FROM farms WHERE total_area IS NOT NULL');
    const [[subs]] = await conn.execute("SELECT COUNT(*) AS count FROM subscriptions WHERE status='active'");
    const [[revMonth]] = await conn.execute("SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE status='completed' AND YEAR(created_at)=YEAR(CURDATE()) AND MONTH(created_at)=MONTH(CURDATE())");

    console.log(JSON.stringify({
      coffee_growers: growers.count,
      farms: farms.count,
      total_area: areas.total_area || 0,
      coffee_area: areas.coffee_area || 0,
      active_subscriptions: subs.count,
      monthly_revenue: Number(revMonth.total)
    }, null, 2));
  } catch (err) {
    console.error('ERR', err.message);
    process.exitCode = 1;
  } finally {
    if (conn) await conn.end();
  }
}

main();