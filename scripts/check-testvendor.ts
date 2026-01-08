import { prisma } from '../src/lib/prisma';

async function checkTestVendor() {
  const user = await prisma.user.findUnique({
    where: { email: 'testvendor@stripe-test.com' },
    include: { Vendor: true },
  });

  if (user) {
    console.log('✓ User found:');
    console.log(JSON.stringify(user, null, 2));
  } else {
    console.log('✗ User testvendor@stripe-test.com not found in database');
  }

  await prisma.$disconnect();
}

checkTestVendor().catch(console.error);
