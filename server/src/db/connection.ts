import postgres from "postgres";

const isProduction = process.env.NODE_ENV === "production";

const databaseURL = isProduction
  ? process.env.UN_ADMISSION_DB_PROD_URL!
  : process.env.UN_ADMISSION_DB_DEV_URL!;

export async function checkDatabaseConnection(): Promise<boolean> {
  const client = postgres(databaseURL, { max: 20, idle_timeout: 30 });
  try {
    await client`SELECT 1`;
    return true;
  } catch (err) {
    console.error("Database connection check failed:", err);
    return false;
  } finally {
    await client.end();
  }
}
