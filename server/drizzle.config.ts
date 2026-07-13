import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./src/db/drizzle",
  dbCredentials: {
    url: isProduction
      ? process.env.UN_ADMISSION_DB_PROD_URL
      : process.env.UN_ADMISSION_DB_DEV_URL,
  },
});
