#!/usr/bin/env node
/**
 * Marks the generated Drizzle baseline migration (src/db/drizzle/0000_baseline.sql)
 * as already-applied, WITHOUT running it, against a database that already has this
 * exact schema (created previously by Prisma's migrations). This is required so that
 * `drizzle-kit migrate` / `drizzle-orm`'s migrator doesn't try to re-run CREATE TABLE/
 * CREATE TYPE against tables that already exist.
 *
 * It replicates exactly what drizzle-orm's pg-core migrator does on a fresh DB
 * (see node_modules/drizzle-orm/pg-core/dialect.js `migrate()`): create the
 * `drizzle`.`__drizzle_migrations` bookkeeping schema/table if missing, and insert
 * one row recording this migration's sha256 hash + the journal's "when" timestamp.
 *
 * This script touches ONLY that bookkeeping table — no application tables/data.
 *
 * Usage:
 *   DATABASE_URL="postgresql://...neon-connection-string..." node scripts/drizzle-mark-baseline.cjs
 *
 * Safe to re-run: it checks for an existing row with the same hash first and does
 * nothing if already marked.
 */
require("dotenv/config");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const postgres = require("postgres");

const MIGRATIONS_FOLDER = path.join(__dirname, "..", "src", "db", "drizzle");

async function main() {
  const journalPath = path.join(MIGRATIONS_FOLDER, "meta", "_journal.json");
  const journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));
  const entry = journal.entries[0];
  if (!entry) throw new Error("No entries found in meta/_journal.json");

  const sqlFilePath = path.join(MIGRATIONS_FOLDER, `${entry.tag}.sql`);
  const fileContents = fs.readFileSync(sqlFilePath, "utf8");
  const hash = crypto.createHash("sha256").update(fileContents).digest("hex");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  console.log(`Baselining migration "${entry.tag}" (hash ${hash.slice(0, 12)}...) against:`);
  console.log(`  ${databaseUrl.replace(/:\/\/[^@]+@/, "://<redacted>@")}`);

  const sql = postgres(databaseUrl, { max: 1 });
  try {
    await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
    await sql`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `;

    const existing = await sql`
      SELECT id FROM drizzle.__drizzle_migrations WHERE hash = ${hash}
    `;
    if (existing.length > 0) {
      console.log("Already baselined — nothing to do.");
      return;
    }

    await sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${hash}, ${entry.when})
    `;
    console.log("Baseline recorded. `drizzle-kit migrate` will now treat this schema as already applied.");
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
