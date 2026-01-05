import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const vendors = await prisma.vendor.findMany({
    include: {
      _count: {
        select: { VendorProduct: true },
      },
    },
  });

  console.log("Vendors with product counts:");
  vendors.forEach((v) =>
    console.log(`  - ${v.name}: ${v._count.VendorProduct} products`)
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
