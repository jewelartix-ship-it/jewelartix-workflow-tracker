/**
 * One-time migration: import rows from the legacy Excel workflow into the
 * new database. This is a launch-day tool, not an ongoing feature — the
 * toolbar deliberately has no Import button (see project README).
 *
 * Usage (from backend/):
 *   npm run migrate:excel -- --file ../legacy-client.xlsx --category CLIENT
 *
 * Expected columns in the sheet's header row (case-insensitive, order does
 * not matter): Date, SR, Lot, File Name, CAD Done, Preview Sent, CAD Confirm,
 * STL Send, Render Req, Render Photos, Render Videos, Drive, Note. Any of the
 * checkbox columns may contain TRUE/FALSE, YES/NO, or 1/0 — all are accepted.
 *
 * The script is safe to re-run: rows are matched by (category, sr, lot), and
 * an existing match is skipped with a warning rather than duplicated.
 */
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import * as XLSX from 'xlsx';
import { and, eq } from 'drizzle-orm';
import { db } from '../src/db/client.js';
import { tasks } from '../src/db/schema.js';
import { categorySchema } from '../src/validators/schemas.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i === -1 ? undefined : args[i + 1];
  };
  const file = get('--file');
  const category = get('--category');
  if (!file || !category) {
    console.error('Usage: npm run migrate:excel -- --file <path.xlsx> --category <CLIENT|COLLECTION|THEMATIQUE|SPA>');
    process.exit(1);
  }
  return { file, category: categorySchema.parse(category.toUpperCase()) };
}

function truthy(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  const s = String(value ?? '').trim().toLowerCase();
  return s === 'true' || s === 'yes' || s === '1' || s === 'x' || s === 'done';
}

function excelDateToIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'number') {
    // Excel serial date (days since 1899-12-30)
    const ms = Math.round((value - 25569) * 86400 * 1000);
    return new Date(ms).toISOString().slice(0, 10);
  }
  const parsed = new Date(String(value));
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

function col(row: Record<string, unknown>, ...names: string[]): unknown {
  const keys = Object.keys(row);
  for (const name of names) {
    const key = keys.find((k) => k.trim().toLowerCase() === name.toLowerCase());
    if (key) return row[key];
  }
  return undefined;
}

async function run() {
  const { file, category } = parseArgs();

  const buffer = readFileSync(file);
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: '' });

  console.log(`Read ${rows.length} rows from "${sheetName}" in ${file}`);

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const [index, row] of rows.entries()) {
    const sr = String(col(row, 'SR') ?? '').trim();
    const lot = String(col(row, 'Lot') ?? '').trim();
    const fileName = String(col(row, 'File Name', 'FileName') ?? '').trim();

    if (!sr || !lot || !fileName) {
      console.warn(`Row ${index + 2}: skipped — missing SR, Lot, or File Name`);
      failed++;
      continue;
    }

    const [existing] = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.category, category), eq(tasks.sr, sr), eq(tasks.lot, lot)))
      .limit(1);

    if (existing) {
      console.warn(`Row ${index + 2}: skipped — ${category} ${sr}/${lot} already exists`);
      skipped++;
      continue;
    }

    const now = new Date();
    await db.insert(tasks).values({
      id: randomUUID(),
      category,
      date: excelDateToIso(col(row, 'Date')),
      sr,
      lot,
      fileName,
      cadDone: truthy(col(row, 'CAD Done')),
      previewSent: truthy(col(row, 'Preview Sent')),
      cadConfirm: truthy(col(row, 'CAD Confirm', 'CAD Confirmation')),
      stlSend: truthy(col(row, 'STL Send')),
      renderReq: truthy(col(row, 'Render Req', 'Render Required', 'Render Req.')),
      renderPhotos: truthy(col(row, 'Render Photos', 'Photo', 'Photo Render')),
      renderVideos: truthy(col(row, 'Render Videos', 'Video', 'Video Render')),
      driveLink: String(col(row, 'Drive', 'Drive Link') ?? '').trim() || null,
      note: String(col(row, 'Note', 'Notes') ?? '').trim() || null,
      createdAt: now,
      updatedAt: now,
    });
    imported++;
  }

  console.log(`\nDone. Imported ${imported}, skipped ${skipped} duplicates, ${failed} rows failed validation.`);
}

await run();
