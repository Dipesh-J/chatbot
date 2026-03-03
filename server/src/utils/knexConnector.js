import knex from 'knex';
import dns from 'dns/promises';

/**
 * Resolve a hostname to its IPv4 address.
 * Falls back to the original host if resolution fails (e.g. already an IP).
 */
async function resolveIPv4(host) {
  try {
    const { address } = await dns.lookup(host, { family: 4 });
    return address;
  } catch {
    return host;
  }
}

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

/**
 * Prepare config for connection — resolves hostname to IPv4 to avoid
 * EHOSTUNREACH on networks without IPv6 connectivity.
 */
export async function prepareConfig(config) {
  const resolved = { ...config, host: await resolveIPv4(config.host) };
  return resolved;
}

export async function testConnection(type, config) {
  const resolvedConfig = await prepareConfig(config);
  const db = createKnexClient(type, resolvedConfig);
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
  const resolvedConfig = await prepareConfig(config);
  const db = createKnexClient(type, resolvedConfig);
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
      try {
        if (type === 'postgresql') {
          const pkResult = await db.raw(`
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            WHERE tc.table_schema = 'public'
              AND tc.table_name = ?
              AND tc.constraint_type = 'PRIMARY KEY'
          `, [tableName]);
          primaryKeys = pkResult.rows.map((r) => r.column_name);
        } else {
          const pkResult = await db.raw(`SHOW KEYS FROM ?? WHERE Key_name = 'PRIMARY'`, [tableName]);
          primaryKeys = pkResult[0].map((r) => r.Column_name);
        }
      } catch {
        // Skip primary key detection if it fails for this table
        primaryKeys = [];
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
