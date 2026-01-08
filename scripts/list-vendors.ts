import { prisma } from '../src/lib/prisma';

async function listVendors() {
  const vendors = await prisma.vendor.findMany({
    select: {
      id: true,
      name: true,
      contactEmail: true,
      stripeAccountId: true,
      User: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  console.log('\nVendors in database:', vendors.length);
  console.log(JSON.stringify(vendors, null, 2));

  await prisma.$disconnect();
}

listVendors().catch(console.error);
