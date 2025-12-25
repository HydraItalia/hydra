/**
 * CSV Client Import Script
 *
 * Imports clients from CSV file into the database
 *
 * Usage: npx tsx scripts/import-clients.ts <path-to-csv>
 */

import { PrismaClient } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

type CSVRow = {
  nome: string;
  Indirizzo: string;
  "Colore Pin": string;
  Nascosto: string;
  Referente: string;
  Email: string;
  Telefono: string;
  Cellulare: string;
  Mandanti: string;
  "P.IVA/C.F.": string;
  "Freezco ": string; // Note: has trailing space in CSV
  consegna: string;
  bonifico: string;
  fattura: string;
  incasso: string;
  "incasso mancato": string;
  proroga: string;
  "Visite Totali": string;
  "visita dal cliente": string;
  telefonata: string;
  email: string;
  altro: string;
  "Ultima Visita": string;
  Latitudine: string; // Changed from deliveryLat
  Longitudine: string; // Changed from deliveryLng
  Note: string;
  GentmoID: string;
};

/**
 * Parse CSV file
 */
function parseCSV(filePath: string): CSVRow[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  if (lines.length === 0) {
    throw new Error("CSV file is empty");
  }

  // Parse header (semicolon-delimited)
  const headers = lines[0].split(";").map((h) => h.trim());

  // Parse rows
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = line.split(";");
    const row: any = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ? values[index].trim() : "";
    });

    rows.push(row as CSVRow);
  }

  return rows;
}

/**
 * Parse boolean from CSV (empty string or "0" = false, anything else = true)
 */
function parseBoolean(value: string): boolean {
  return value !== "" && value !== "0";
}

/**
 * Parse integer from CSV
 */
function parseInt(value: string): number {
  const num = Number(value);
  return isNaN(num) ? 0 : Math.floor(num);
}

/**
 * Parse float from CSV
 */
function parseFloat(value: string): number | null {
  const num = Number(value);
  return isNaN(num) ? null : num;
}

/**
 * Parse date from CSV (format: DD/MM/YY)
 */
function parseDate(value: string): Date | null {
  if (!value || value.trim() === "") return null;

  const parts = value.split("/");
  if (parts.length !== 3) return null;

  const day = Number(parts[0]);
  const month = Number(parts[1]) - 1; // JS months are 0-indexed
  const year = Number(parts[2]) + 2000; // Assuming 20XX

  const date = new Date(year, month, day);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Combine phone numbers
 */
function combinePhones(telefono: string, cellulare: string): string | null {
  const phones = [telefono, cellulare].filter((p) => p && p.trim() !== "");
  return phones.length > 0 ? phones.join(", ") : null;
}

/**
 * Import clients from CSV
 */
async function importClients(csvPath: string, dryRun: boolean = false) {
  console.log(`📂 Reading CSV from: ${csvPath}`);
  console.log(
    `🔍 Mode: ${dryRun ? "DRY RUN (preview only)" : "LIVE IMPORT"}\n`
  );

  const rows = parseCSV(csvPath);
  console.log(`📊 Found ${rows.length} clients to import\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      // Check if client already exists by externalId OR name
      let existing = null;

      if (row.GentmoID) {
        existing = await prisma.client.findUnique({
          where: { externalId: row.GentmoID },
        });
      }

      // Also check by name to avoid duplicating existing demo clients
      if (!existing && row.nome) {
        existing = await prisma.client.findFirst({
          where: { name: row.nome },
        });
      }

      if (existing) {
        console.log(
          `⏭️  Skipping ${row.nome} (already exists${
            row.GentmoID ? `: ${row.GentmoID}` : ""
          })`
        );
        skipped++;
        continue;
      }

      if (dryRun) {
        console.log(`✅ Would import: ${row.nome}`);
        imported++;
        continue;
      }

      // Create client
      const client = await prisma.client.create({
        data: {
          id: createId(),
          name: row.nome,

          // Address & Location
          deliveryAddress: row.Indirizzo || null,
          deliveryLat: parseFloat(row.Latitudine),
          deliveryLng: parseFloat(row.Longitudine),
          fullAddress: row.Indirizzo || null,

          // Contact Info
          contactPerson: row.Referente || null,
          email: row.Email || null,
          phone: combinePhones(row.Telefono, row.Cellulare),
          taxId: row["P.IVA/C.F."] || null,

          // Display/UI
          pinColor: row["Colore Pin"] || null,
          hidden: parseBoolean(row.Nascosto),

          // Integration/Migration
          externalId: row.GentmoID || null,
          freezco: parseBoolean(row["Freezco "]), // Note: trailing space
          mandanti: row.Mandanti || null,

          // Tracking
          lastVisitAt: parseDate(row["Ultima Visita"]),

          notes: row.Note || null,
        },
      });

      // Create client stats
      await prisma.clientStats.create({
        data: {
          id: createId(),
          clientId: client.id,

          // Visit/Contact Statistics
          totalVisits: parseInt(row["Visite Totali"]),
          clientVisits: parseInt(row["visita dal cliente"]),
          phoneCalls: parseInt(row.telefonata),
          emails: parseInt(row.email),
          other: parseInt(row.altro),

          // Business Statistics
          deliveryCount: parseInt(row.consegna),
          bankTransferCount: parseInt(row.bonifico),
          invoiceCount: parseInt(row.fattura),
          collectionCount: parseInt(row.incasso),
          failedCollectionCount: parseInt(row["incasso mancato"]),
          extensionCount: parseInt(row.proroga),
        },
      });

      console.log(`✅ Imported: ${row.nome}`);
      imported++;
    } catch (error) {
      console.error(`❌ Error importing ${row.nome}:`, error);
      errors++;
    }
  }

  console.log("\n📈 Import Summary:");
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📊 Total: ${rows.length}`);
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(
      "Usage: npx tsx scripts/import-clients.ts <path-to-csv> [--dry-run]"
    );
    console.error("\nOptions:");
    console.error(
      "  --dry-run    Preview what will be imported without making changes"
    );
    process.exit(1);
  }

  const dryRun = args.includes("--dry-run");
  const csvPath = path.resolve(args[0]);

  if (!fs.existsSync(csvPath)) {
    console.error(`Error: File not found: ${csvPath}`);
    process.exit(1);
  }

  try {
    await importClients(csvPath, dryRun);

    if (dryRun) {
      console.log(
        "\n💡 This was a dry run. Run without --dry-run to actually import."
      );
    }
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
