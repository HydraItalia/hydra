import { prisma } from '../src/lib/prisma';

async function check() {
  const delivery = await prisma.delivery.findUnique({
    where: { id: 'de88uvsdhqfhxxzh02tlr1pq' },
    include: {
      SubOrder: {
        select: {
          id: true,
          subOrderNumber: true,
          stripeChargeId: true,
          paymentStatus: true,
        }
      }
    }
  });

  console.log('Delivery you clicked:');
  console.log(JSON.stringify(delivery, null, 2));

  await prisma.$disconnect();
}

check();
