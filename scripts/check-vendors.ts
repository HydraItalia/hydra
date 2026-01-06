import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const vendors = await prisma.vendor.findMany({
    select: { id: true, name: true },
  });

  console.log("All vendors in database:");
  vendors.forEach((v) => console.log(`  - ${v.name} (ID: ${v.id})`));
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .then(() => prisma.$disconnect());
