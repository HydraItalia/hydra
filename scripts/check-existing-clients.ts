import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkClients() {
  try {
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        deliveryAddress: true,
        externalId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    console.log(`Found ${clients.length} existing clients:\n`);

    clients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.name}`);
      console.log(`   ID: ${client.id}`);
      console.log(`   Email: ${client.email || "N/A"}`);
      console.log(`   Address: ${client.deliveryAddress || "N/A"}`);
      console.log(`   External ID: ${client.externalId || "N/A"}`);
      console.log(`   Created: ${client.createdAt.toLocaleDateString()}`);
      console.log("");
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkClients();
