import pg from 'pg';
import fs from 'fs';

const connectionString = "postgresql://postgres:bokangMokotjo2%24@db.awcvcvqsxgogtyzojcjd.supabase.co:5432/postgres";

const pool = new pg.Pool({
  connectionString,
});

async function applySchema() {
  try {
    const schemaSql = fs.readFileSync('./supabase/schema.sql', 'utf8');
    console.log("Applying schema to Supabase...");
    await pool.query(schemaSql);
    console.log("Schema applied successfully! You can now delete this file.");
  } catch (err) {
    console.error("Error applying schema:", err);
  } finally {
    await pool.end();
  }
}

applySchema();
