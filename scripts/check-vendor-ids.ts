import { prisma } from '../src/lib/prisma';

async function checkVendorIds() {
  const testVendor = await prisma.vendor.findFirst({
    where: {
      User: {
        email: 'testvendor@stripe-test.com',
      },
    },
    include: {
      User: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  const generalBeverage = await prisma.vendor.findFirst({
    where: {
      name: 'General Beverage Distributor',
    },
  });

  console.log('\n📋 Vendor IDs for testing:\n');

  if (testVendor) {
    console.log('Test Vendor:');
    console.log(`  ID: ${testVendor.id}`);
    console.log(`  Name: ${testVendor.name}`);
    console.log(`  User: ${testVendor.User?.email}`);
    console.log(`  Stripe Account: ${testVendor.stripeAccountId || 'NOT SET'}`);
    console.log(`  Charges Enabled: ${testVendor.chargesEnabled ? '✅' : '❌'}`);
  } else {
    console.log('❌ Test Vendor not found');
  }

  console.log('');

  if (generalBeverage) {
    console.log('General Beverage:');
    console.log(`  ID: ${generalBeverage.id}`);
    console.log(`  Name: ${generalBeverage.name}`);
    console.log(`  Stripe Account: ${generalBeverage.stripeAccountId || 'NOT SET'}`);
    console.log(`  Charges Enabled: ${generalBeverage.chargesEnabled ? '✅' : '❌'}`);
  } else {
    console.log('❌ General Beverage not found');
  }

  await prisma.$disconnect();
}

checkVendorIds().catch(console.error);
