import knex from 'knex';

export function createKnexClient(type, config) {
  const client = type === 'postgresql' ? 'pg' : 'mysql2';
  const connection = {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.password,
  };

  if (config.ssl) {
    connection.ssl = { rejectUnauthorized: false };
  }

  return knex({
    client,
    connection,
    pool: { min: 0, max: 2 },
    acquireConnectionTimeout: 10000,
  });
}

export async function testConnection(type, config) {
  const db = createKnexClient(type, config);
  try {
    await db.raw('SELECT 1');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    await db.destroy();
  }
}

export async function introspectSchema(type, config) {
  const db = createKnexClient(type, config);
  try {
    let tables;

    if (type === 'postgresql') {
      const result = await db.raw(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      tables = result.rows.map((r) => r.table_name);
    } else {
      const result = await db.raw(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      tables = result[0].map((r) => r.TABLE_NAME || r.table_name);
    }

    const tableDetails = [];

    for (const tableName of tables) {
      const columnInfo = await db(tableName).columnInfo();

      // Get row count
      const countResult = await db(tableName).count('* as count').first();
      const rowCount = parseInt(countResult.count, 10);

      // Get primary keys
      let primaryKeys = [];
      if (type === 'postgresql') {
        const pkResult = await db.raw(`
          SELECT a.attname
          FROM pg_index i
          JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
          WHERE i.indrelid = ?::regclass AND i.indisprimary
        `, [tableName]);
        primaryKeys = pkResult.rows.map((r) => r.attname);
      } else {
        const pkResult = await db.raw(`SHOW KEYS FROM ?? WHERE Key_name = 'PRIMARY'`, [tableName]);
        primaryKeys = pkResult[0].map((r) => r.Column_name);
      }

      const columns = Object.entries(columnInfo).map(([colName, info]) => ({
        name: colName,
        dataType: info.type,
        nullable: info.nullable,
        isPrimaryKey: primaryKeys.includes(colName),
      }));

      tableDetails.push({ name: tableName, columns, rowCount });
    }

    return tableDetails;
  } finally {
    await db.destroy();
  }
}
