import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: "file:./dev.db" }),
});

async function main() {
  console.log("🌱 Seeding database...");

  // =========================
  // USERS
  // =========================
  const adminPasswordHash = await bcrypt.hash("ChangeMe123!", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@workflow.local" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@workflow.local",
      passwordHash: adminPasswordHash,
    },
  });

  console.log("✅ User seeded:", adminUser.email);

  // =========================
  // TEAMS (optional)
  // =========================
  const teams = [
    { name: "C3 Aerial Crew" },
    { name: "Underground Crew" },
    { name: "Fiber Splicing Team" },
  ];

  for (const team of teams) {
    // name is NOT unique → findFirst then create
    const existing = await prisma.team.findFirst({ where: { name: team.name } });
    if (!existing) await prisma.team.create({ data: team });
  }

  console.log("✅ Teams seeded");

  // =========================
  // MATERIALS (sample)
  // =========================
  const materials = [
    {
      sapPn: "1252068",
      name: `1.25" innerduct / conduit plug`,
      description: "Innerduct plug for 1.25 inch conduit",
      unit: "EA",
      isActive: true,
    },
    {
      sapPn: "1252069",
      name: `2.5" innerduct / conduit plug`,
      description: "Innerduct plug for 2.5 inch conduit",
      unit: "EA",
      isActive: true,
    },
  ];

  for (const material of materials) {
    await prisma.material.upsert({
      where: { sapPn: material.sapPn },
      update: {
        name: material.name,
        description: material.description,
        unit: material.unit,
        isActive: material.isActive,
      },
      create: material,
    });
  }

  console.log("✅ Materials seeded");
  console.log("🌱 Seed completed successfully");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
