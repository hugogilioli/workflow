import * as XLSX from "xlsx";
import path from "node:path";

import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: "file:./dev.db" }),
});

function toStringSafe(v: unknown) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

async function main() {
  // Ajuste o caminho se você mover o arquivo
  const filePath = path.resolve(process.cwd(), "Butch Parts List.xlsx");

  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  // Espera colunas exatamente como no Excel:
  // "SAP PN", "DESCRIPTION", "QTY Requested"
  const normalized = rows
    .map((r) => ({
      sapPn: toStringSafe(r["SAP PN"]),
      name: toStringSafe(r["DESCRIPTION"]),
    }))
    .filter((r) => r.sapPn && r.name);

  console.log(`Found ${normalized.length} materials to import...`);

  let created = 0;
  let updated = 0;

  for (const m of normalized) {
    const result = await prisma.material.upsert({
      where: { sapPn: m.sapPn },
      create: {
        sapPn: m.sapPn,
        name: m.name,
        description: null,
        unit: null,
        isActive: true,
      },
      update: {
        name: m.name,
        isActive: true,
      },
    });

    // Se quiser contar create/update de verdade, teria que comparar antes,
    // mas para MVP isso é suficiente.
    if (result) created++;
  }

  console.log(`✅ Import done. Upserted ~${created} items.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
