import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const isProduction = process.env.NODE_ENV === "production";

const databaseURL = isProduction
  ? process.env.UN_ADMISSION_DB_PROD_URL!
  : process.env.UN_ADMISSION_DB_DEV_URL!;

const client = postgres(databaseURL);

export const db = drizzle(client, { schema });
