import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import path from "path";

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Starting catalog data cleanup...\n");

  // Delete in FK-safe order
  console.log("Deleting order items...");
  const orderItemsDeleted = await prisma.orderItem.deleteMany({});
  console.log(`  ✅ Deleted ${orderItemsDeleted.count} order items`);

  console.log("Deleting cart items...");
  const cartItemsDeleted = await prisma.cartItem.deleteMany({});
  console.log(`  ✅ Deleted ${cartItemsDeleted.count} cart items`);

  console.log("Deleting orders...");
  const ordersDeleted = await prisma.order.deleteMany({});
  console.log(`  ✅ Deleted ${ordersDeleted.count} orders`);

  console.log("Deleting carts...");
  const cartsDeleted = await prisma.cart.deleteMany({});
  console.log(`  ✅ Deleted ${cartsDeleted.count} carts`);

  console.log("Deleting agreements...");
  const agreementsDeleted = await prisma.agreement.deleteMany({});
  console.log(`  ✅ Deleted ${agreementsDeleted.count} agreements`);

  console.log("Deleting vendor products...");
  const vendorProductsDeleted = await prisma.vendorProduct.deleteMany({});
  console.log(`  ✅ Deleted ${vendorProductsDeleted.count} vendor products`);

  console.log("Deleting products...");
  const productsDeleted = await prisma.product.deleteMany({});
  console.log(`  ✅ Deleted ${productsDeleted.count} products`);

  console.log("Deleting categories...");
  const categoriesDeleted = await prisma.productCategory.deleteMany({});
  console.log(`  ✅ Deleted ${categoriesDeleted.count} categories`);

  console.log("Deleting vendors...");
  const vendorsDeleted = await prisma.vendor.deleteMany({});
  console.log(`  ✅ Deleted ${vendorsDeleted.count} vendors`);

  console.log("\n✅ Catalog data wiped successfully!");
  console.log("   (Users, auth, clients, and agents remain intact)");
}

main()
  .catch((error) => {
    console.error("❌ Error resetting catalog:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
