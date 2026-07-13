import postgres from "postgres";

export async function checkDatabaseConnection(): Promise<boolean> {
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
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
