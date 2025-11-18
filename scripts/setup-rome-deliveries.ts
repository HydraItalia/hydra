/**
 * Setup 5 test deliveries in Rome for route optimization testing
 */

import { prisma } from "../src/lib/prisma";

// Sample addresses in Rome, Italy
const ROME_LOCATIONS = [
  {
    lat: 41.9028,
    lng: 12.4964,
    address: "Piazza del Colosseo, 00184 Roma, Italy",
  },
  {
    lat: 41.9009,
    lng: 12.4833,
    address: "Via dei Fori Imperiali, 00186 Roma, Italy",
  },
  {
    lat: 41.8986,
    lng: 12.4768,
    address: "Piazza Venezia, 00186 Roma, Italy",
  },
  {
    lat: 41.9022,
    lng: 12.4539,
    address: "Piazza Navona, 00186 Roma, Italy",
  },
  {
    lat: 41.9029,
    lng: 12.4534,
    address: "Campo de' Fiori, 00186 Roma, Italy",
  },
];

const DELIVERY_STATUSES = ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "ASSIGNED", "PICKED_UP"] as const;

async function setupRomeDeliveries() {
  console.log("Setting up 5 deliveries in Rome...\n");

  // Get the demo client and driver
  const demoClient = await prisma.client.findFirst({
    where: { name: { contains: "Demo" } },
  });

  const demoDriver = await prisma.driver.findFirst();

  if (!demoClient || !demoDriver) {
    console.error("❌ Could not find demo client or driver!");
    return;
  }

  console.log(`Found client: ${demoClient.name}`);
  console.log(`Found driver: ${demoDriver.name}\n`);

  // Get or create demo user for submitter
  const demoUser = await prisma.user.findFirst({
    where: { email: { contains: "demo" } },
  });

  if (!demoUser) {
    console.error("❌ Could not find demo user!");
    return;
  }

  // Get existing deliveries
  const existingDeliveries = await prisma.delivery.findMany({
    where: { driverId: demoDriver.id },
    include: {
      order: true,
    },
  });

  console.log(`Found ${existingDeliveries.length} existing deliveries\n`);

  // Update existing deliveries with Rome coordinates
  for (let i = 0; i < existingDeliveries.length && i < ROME_LOCATIONS.length; i++) {
    const delivery = existingDeliveries[i];
    const location = ROME_LOCATIONS[i];
    const status = DELIVERY_STATUSES[i];

    await prisma.order.update({
      where: { id: delivery.orderId },
      data: {
        deliveryLat: location.lat + (Math.random() - 0.5) * 0.001,
        deliveryLng: location.lng + (Math.random() - 0.5) * 0.001,
        deliveryAddress: location.address,
      } as any,
    });

    await prisma.delivery.update({
      where: { id: delivery.id },
      data: { status: status as any },
    });

    console.log(`✓ Updated delivery #${i + 1}: ${location.address} (${status})`);
  }

  // Create additional deliveries if needed
  const deliveriesToCreate = 5 - existingDeliveries.length;

  if (deliveriesToCreate > 0) {
    console.log(`\nCreating ${deliveriesToCreate} additional deliveries...\n`);

    for (let i = 0; i < deliveriesToCreate; i++) {
      const locationIndex = existingDeliveries.length + i;
      const location = ROME_LOCATIONS[locationIndex];
      const status = DELIVERY_STATUSES[locationIndex];

      // Create order
      const order = await prisma.order.create({
        data: {
          clientId: demoClient.id,
          submitterUserId: demoUser.id,
          orderNumber: `HYD-ROME-${Date.now()}-${i}`,
          status: "SUBMITTED",
          totalCents: Math.floor(Math.random() * 50000) + 10000,
          region: "Lazio",
          deliveryLat: location.lat + (Math.random() - 0.5) * 0.001,
          deliveryLng: location.lng + (Math.random() - 0.5) * 0.001,
          deliveryAddress: location.address,
        } as any,
      });

      // Create delivery
      const delivery = await prisma.delivery.create({
        data: {
          orderId: order.id,
          driverId: demoDriver.id,
          status: status as any,
        },
      });

      console.log(`✓ Created delivery #${locationIndex + 1}: ${location.address} (${status})`);
    }
  }

  console.log(`\n✅ Setup complete! You now have 5 deliveries in Rome.`);
  console.log(`\nRefresh /dashboard/route to see the optimized route through Rome!`);
}

setupRomeDeliveries()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
