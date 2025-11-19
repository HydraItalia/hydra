/**
 * Add test delivery coordinates to existing orders
 * This is a one-time script to populate coordinates for testing Phase 7.2
 */

import { prisma } from "../src/lib/prisma";

// Sample addresses in Rome, Italy
const SAMPLE_LOCATIONS = [
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

async function addDeliveryCoordinates() {
  console.log("Adding delivery coordinates to orders...\n");

  // Get all orders that have deliveries but no coordinates
  const orders = await prisma.order.findMany({
    where: {
      deliveryLat: null,
      Delivery: {
        isNot: null,
      },
    },
    include: {
      Client: {
        select: {
          name: true,
        },
      },
      Delivery: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (orders.length === 0) {
    console.log("No orders need coordinates!");
    return;
  }

  console.log(`Found ${orders.length} orders without coordinates\n`);

  let updateCount = 0;

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    // Cycle through sample locations
    const location = SAMPLE_LOCATIONS[i % SAMPLE_LOCATIONS.length];

    // Add a tiny random offset to avoid exact duplicates
    const randomOffset = () => (Math.random() - 0.5) * 0.002;

    await prisma.order.update({
      where: { id: order.id },
      data: {
        deliveryLat: location.lat + randomOffset(),
        deliveryLng: location.lng + randomOffset(),
        deliveryAddress: `${location.address} (Client: ${order.Client.name})`,
      },
    });

    console.log(
      `✓ Updated order ${order.orderNumber} → ${location.address} (${order.Delivery?.status})`
    );
    updateCount++;
  }

  console.log(`\n✅ Updated ${updateCount} orders with delivery coordinates`);
  console.log("\nYou can now test the route optimization at /dashboard/route");
}

addDeliveryCoordinates()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
