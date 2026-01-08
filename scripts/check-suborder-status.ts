import { prisma } from '../src/lib/prisma';

async function checkSubOrder() {
  // Get the most recently confirmed SubOrder
  const subOrder = await prisma.subOrder.findFirst({
    where: {
      status: 'CONFIRMED',
    },
    orderBy: {
      updatedAt: 'desc',
    },
    include: {
      Vendor: {
        select: {
          name: true,
          stripeAccountId: true,
          chargesEnabled: true,
        },
      },
      Order: {
        select: {
          orderNumber: true,
          Client: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!subOrder) {
    console.log('❌ No confirmed SubOrders found');
    await prisma.$disconnect();
    return;
  }

  console.log('\n📋 Most Recent Confirmed SubOrder:\n');
  console.log(`SubOrder Number: ${subOrder.subOrderNumber}`);
  console.log(`Order: ${subOrder.Order.orderNumber}`);
  console.log(`Client: ${subOrder.Order.Client.name}`);
  console.log(`Vendor: ${subOrder.Vendor.name}`);
  console.log(`Status: ${subOrder.status}`);
  console.log(`Payment Status: ${subOrder.paymentStatus}`);
  console.log(`Subtotal: €${(subOrder.subTotalCents / 100).toFixed(2)}`);
  console.log(`\nStripe Details:`);
  console.log(`  Vendor Stripe Account: ${subOrder.Vendor.stripeAccountId || 'NOT SET'}`);
  console.log(`  Charges Enabled: ${subOrder.Vendor.chargesEnabled ? '✅' : '❌'}`);
  console.log(`  PaymentIntent ID: ${subOrder.stripeChargeId || 'NOT SET'}`);

  if (subOrder.stripeChargeId) {
    console.log('\n✅ Pre-authorization successful!');
    console.log(`   PaymentIntent: ${subOrder.stripeChargeId}`);
    console.log(`   Payment Status: ${subOrder.paymentStatus}`);
  } else {
    console.log('\n⚠️  Pre-authorization did not run or failed');
    console.log('   No PaymentIntent ID found in database');
  }

  await prisma.$disconnect();
}

checkSubOrder().catch(console.error);
