import { PrismaClient } from "../src/generated/prisma/client.js";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.material.upsert({
    where: { sapPn: "8473921" },
    update: {},
    create: {
      sapPn: "8473921",
      name: "Fiber Optic Cable 100ft",
      description: "Outdoor rated",
      unit: "ea",
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
