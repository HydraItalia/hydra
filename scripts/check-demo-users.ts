import { prisma } from '../src/lib/prisma';

async function checkDemoUsers() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: [
          'client.demo@hydra.local',
          'vendor.generalbeverage@hydra.local',
          'testvendor@stripe-test.com',
          'vendor.cdfish@hydra.local',
          'driver.marco@hydra.local',
          'admin@hydra.local',
          'andrea@hydra.local',
        ],
      },
    },
    select: {
      email: true,
      role: true,
      name: true,
    },
  });

  console.log('\nDemo users in database:', users.length);
  console.log(JSON.stringify(users, null, 2));

  await prisma.$disconnect();
}

checkDemoUsers().catch(console.error);
