import { Connection, createConnection } from "mysql2/promise";

export async function database<T>(
  callback: (db: Connection) => Promise<T>,
): Promise<T | null> {
  let connection: Connection | null = null;
  let result: T | null = null;

  try {
    connection = await createConnection({
      host: process.env.DB_HOSTNAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });
    result = await callback(connection);
  } finally {
    await connection?.end();
  }

  return result;
}
