import {
  PrismaClient,
  Role,
  UserStatus,
  CategoryGroupType,
  ProductUnit,
  PriceMode,
  OrderStatus,
  DeliveryStatus,
  DriverStatus,
  FuelLevel,
} from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const prisma = new PrismaClient();

// ===== CSV IMPORT HELPERS =====

type CsvRow = {
  vendor_name: string;
  category: string;
  name: string;
  unit: string;
  price_cents: string;
  in_stock: string;
  product_code: string;
  source_price_raw?: string;
};

// Category name to CategoryGroup mapping
const categoryGroupMap: Record<string, CategoryGroupType> = {
  Beverage: "BEVERAGE",
  Beverages: "BEVERAGE",
  Drinks: "BEVERAGE",
  Wine: "BEVERAGE",
  Spirits: "BEVERAGE",
  Beer: "BEVERAGE",
  Food: "FOOD",
  Produce: "FOOD",
  Seafood: "FOOD",
  Fish: "FOOD",
  Meat: "FOOD",
  Dairy: "FOOD",
  Bakery: "FOOD",
  Pantry: "FOOD",
  Frozen: "FOOD",
  "Specialty Produce": "FOOD",
  Services: "SERVICES",
  Packaging: "SERVICES",
  Supplies: "SERVICES",
  Disposables: "SERVICES",
  "Cleaning & Disposables": "SERVICES",
};

// Normalize unit strings to ProductUnit enum
function normalizeUnit(unitStr: string): ProductUnit {
  const normalized = unitStr.toLowerCase().trim();

  if (normalized.includes("kg") || normalized.includes("kilogram")) {
    return "KG";
  }
  if (
    normalized.includes("l") ||
    normalized.includes("liter") ||
    normalized.includes("litre") ||
    normalized.includes("ml") ||
    normalized.includes("cl")
  ) {
    return "L";
  }
  if (
    normalized.includes("box") ||
    normalized.includes("case") ||
    normalized.includes("crate")
  ) {
    return "BOX";
  }
  if (normalized.includes("service") || normalized.includes("delivery")) {
    return "SERVICE";
  }
  return "PIECE";
}

// Get or create CategoryGroup for a category name
async function getOrCreateCategoryGroup(categoryName: string): Promise<string> {
  const groupType = categoryGroupMap[categoryName] || "FOOD";

  const group = await prisma.categoryGroup.upsert({
    where: { name: groupType },
    update: {},
    create: { id: createId(), name: groupType },
  });

  return group.id;
}

// Import vendors from CSV files
async function importVendorsFromCSV() {
  console.log("📦 Importing vendor products from CSV files...");

  const vendorsDir = path.join(process.cwd(), "prisma", "seed-data", "vendors");

  if (!fs.existsSync(vendorsDir)) {
    console.log("⚠️  No vendor CSV directory found, skipping import");
    return;
  }

  const files = fs.readdirSync(vendorsDir).filter((f) => f.endsWith(".csv"));

  if (files.length === 0) {
    console.log("⚠️  No CSV files found, skipping import");
    return;
  }

  console.log(`   Found ${files.length} vendor CSV file(s)`);

  let totalImported = 0;
  const vendorCache = new Map<string, string>();

  for (const file of files) {
    const filePath = path.join(vendorsDir, file);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const rows: CsvRow[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    let imported = 0;

    for (const row of rows) {
      try {
        if (!row.vendor_name || !row.name || !row.price_cents) {
          continue;
        }

        // Get or create vendor
        const vendorName = row.vendor_name.trim();
        let vendorId = vendorCache.get(vendorName);

        if (!vendorId) {
          let vendor = await prisma.vendor.findFirst({
            where: { name: vendorName },
          });

          if (!vendor) {
            vendor = await prisma.vendor.create({
              data: {
                id: createId(),
                name: vendorName,
              },
            });
          }

          vendorId = vendor.id;
          vendorCache.set(vendorName, vendorId);
        }

        // Get or create category
        const groupId = await getOrCreateCategoryGroup(row.category.trim());
        const categorySlug = row.category
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-");

        const category = await prisma.productCategory.upsert({
          where: { slug: categorySlug },
          update: { groupId },
          create: {
            id: createId(),
            name: row.category.trim(),
            slug: categorySlug,
            groupId,
          },
        });

        // Normalize unit
        const productUnit = normalizeUnit(row.unit || "piece");

        // Get or create product
        let product = await prisma.product.findFirst({
          where: {
            name: row.name.trim(),
            unit: productUnit,
          },
        });

        if (!product) {
          product = await prisma.product.create({
            data: {
              id: createId(),
              name: row.name.trim(),
              description: "",
              unit: productUnit,
              categoryId: category.id,
            },
          });
        }

        const priceCents = parseInt(row.price_cents) || 0;
        const inStock =
          row.in_stock?.toLowerCase() === "true" || row.in_stock === "1";

        // Create or update vendor product
        await prisma.vendorProduct.upsert({
          where: {
            vendorId_productId: {
              vendorId,
              productId: product.id,
            },
          },
          update: {
            basePriceCents: priceCents,
            stockQty: inStock ? 100 : 0,
            vendorSku: row.product_code?.trim() || `SKU-${product.id}`,
            isActive: true,
          },
          create: {
            id: createId(),
            vendorId,
            productId: product.id,
            basePriceCents: priceCents,
            stockQty: inStock ? 100 : 0,
            vendorSku: row.product_code?.trim() || `SKU-${product.id}`,
            leadTimeDays: inStock ? 0 : 7,
            isActive: true,
            currency: "EUR",
          },
        });

        imported++;
        totalImported++;
      } catch (error) {
        console.error(`   ⚠️  Error importing: ${row.name}`, error);
      }
    }

    console.log(`   ✅ ${path.basename(file)}: ${imported} products`);
  }

  console.log(`   📊 Total imported: ${totalImported} products`);
}

async function main() {
  console.log("🌱 Starting seed...");

  // Clean existing data (in order to avoid FK constraints)
  console.log("🧹 Cleaning existing data...");
  await prisma.auditLog.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.driverShift.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.agreement.deleteMany();
  await prisma.agentVendor.deleteMany();
  await prisma.agentClient.deleteMany();
  await prisma.vendorProduct.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.categoryGroup.deleteMany();
  await prisma.client.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  // ===== USERS =====
  console.log("👥 Creating users...");

  const adminUser = await prisma.user.create({
    data: {
      id: createId(),
      email: "admin@hydra.local",
      name: "Admin User",
      role: Role.ADMIN,
      status: UserStatus.APPROVED,
    },
  });

  const brennanGodUser = await prisma.user.create({
    data: {
      id: createId(),
      email: "brennanlazzara@gmail.com",
      name: "Brennan Lazzara",
      role: Role.ADMIN,
      status: UserStatus.APPROVED,
    },
  });

  const andreaAgent = await prisma.user.create({
    data: {
      id: createId(),
      email: "andrea@hydra.local",
      name: "Andrea",
      role: Role.AGENT,
      status: UserStatus.APPROVED,
      agentCode: "ANDREA",
    },
  });

  const manueleAgent = await prisma.user.create({
    data: {
      id: createId(),
      email: "manuele@hydra.local",
      name: "Manuele",
      role: Role.AGENT,
      status: UserStatus.APPROVED,
      agentCode: "MANUELE",
    },
  });

  // ===== VENDORS =====
  // Import vendors and products from CSV files
  await importVendorsFromCSV();

  // Create vendor users for real vendors
  console.log("👥 Creating vendor users...");

  const whiteDog = await prisma.vendor.findFirst({
    where: { name: "White Dog S.r.l." },
  });
  const plustik = await prisma.vendor.findFirst({
    where: { name: "Plustik Service S.r.l." },
  });
  const generalBeverage = await prisma.vendor.findFirst({
    where: { name: "General Beverage Distributor" },
  });
  const cdFish = await prisma.vendor.findFirst({
    where: { name: "CD Fish S.r.l." },
  });

  if (whiteDog) {
    await prisma.user.create({
      data: {
        id: createId(),
        email: "vendor.whitedog@hydra.local",
        name: "White Dog Manager",
        role: Role.VENDOR,
        status: UserStatus.APPROVED,
        vendorId: whiteDog.id,
      },
    });
  }

  if (plustik) {
    await prisma.user.create({
      data: {
        id: createId(),
        email: "vendor.plustik@hydra.local",
        name: "Plustik Manager",
        role: Role.VENDOR,
        status: UserStatus.APPROVED,
        vendorId: plustik.id,
      },
    });
  }

  if (generalBeverage) {
    await prisma.user.create({
      data: {
        id: createId(),
        email: "vendor.generalbeverage@hydra.local",
        name: "General Beverage Manager",
        role: Role.VENDOR,
        status: UserStatus.APPROVED,
        vendorId: generalBeverage.id,
      },
    });
  }

  if (cdFish) {
    await prisma.user.create({
      data: {
        id: createId(),
        email: "vendor.cdfish@hydra.local",
        name: "CD Fish Manager",
        role: Role.VENDOR,
        status: UserStatus.APPROVED,
        vendorId: cdFish.id,
      },
    });
  }

  // ===== CLIENTS =====
  console.log("🍽️  Creating clients...");

  const demoRistorante = await prisma.client.create({
    data: {
      id: createId(),
      name: "Demo Ristorante",
      region: "Lazio",
      notes: "Demo restaurant for testing",
      fullAddress: "Piazza Navona 45, 00186 Roma RM, Italy",
      shortAddress: "Piazza Navona, Roma",
    },
  });

  // Additional clients for demo driver stops
  const trattoriaTrastevere = await prisma.client.create({
    data: {
      id: createId(),
      name: "Trattoria Trastevere",
      region: "Lazio",
      notes: "Traditional Roman cuisine",
      fullAddress:
        "Piazza di Santa Maria in Trastevere 8, 00153 Roma RM, Italy",
      shortAddress: "Trastevere, Roma",
    },
  });

  const osteriaCampoFiori = await prisma.client.create({
    data: {
      id: createId(),
      name: "Osteria Campo de' Fiori",
      region: "Lazio",
      notes: "Wine bar and restaurant",
      fullAddress: "Campo de' Fiori 22, 00186 Roma RM, Italy",
      shortAddress: "Campo de' Fiori, Roma",
    },
  });

  const ristoranteTestaccio = await prisma.client.create({
    data: {
      id: createId(),
      name: "Ristorante Testaccio",
      region: "Lazio",
      notes: "Modern Italian cuisine",
      fullAddress: "Via Marmorata 39, 00153 Roma RM, Italy",
      shortAddress: "Testaccio, Roma",
    },
  });

  const barPantheon = await prisma.client.create({
    data: {
      id: createId(),
      name: "Bar Pantheon",
      region: "Lazio",
      notes: "Coffee bar near Pantheon",
      fullAddress: "Piazza della Rotonda 63, 00186 Roma RM, Italy",
      shortAddress: "Pantheon, Roma",
    },
  });

  // Create CLIENT demo user with configurable email
  // Use HYDRA_DEMO_CLIENT_EMAIL to seed a real email for testing, or default to demo email
  const clientDemoEmail =
    process.env.HYDRA_DEMO_CLIENT_EMAIL?.trim() || "client.demo@hydra.local";

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clientDemoEmail)) {
    throw new Error(
      `Invalid HYDRA_DEMO_CLIENT_EMAIL: "${clientDemoEmail}". Must be a valid email address format (e.g., user@example.com).`,
    );
  }

  const clientDemoUser = await prisma.user.create({
    data: {
      id: createId(),
      email: clientDemoEmail,
      name: "Demo Restaurant Manager",
      role: Role.CLIENT,
      status: UserStatus.APPROVED,
      clientId: demoRistorante.id,
    },
  });
  console.log(`👤 Created CLIENT user: ${clientDemoEmail}`);

  // Category groups and products are created via CSV import

  // ===== AGREEMENTS =====
  console.log("🤝 Creating agreements...");

  if (whiteDog) {
    await prisma.agreement.create({
      data: {
        id: createId(),
        clientId: demoRistorante.id,
        vendorId: whiteDog.id,
        priceMode: PriceMode.DISCOUNT,
        discountPct: 0.05, // 5% discount
        notes: "Preferred beverage supplier - volume discount",
      },
    });
  }

  if (cdFish) {
    await prisma.agreement.create({
      data: {
        id: createId(),
        clientId: demoRistorante.id,
        vendorId: cdFish.id,
        priceMode: PriceMode.DISCOUNT,
        discountPct: 0.1, // 10% discount
        notes: "Fresh seafood supplier - regular customer discount",
      },
    });
  }

  // ===== AGENT ASSIGNMENTS =====
  console.log("👔 Creating agent assignments...");

  // Andrea manages White Dog, CD Fish and Demo Ristorante
  if (whiteDog) {
    await prisma.agentVendor.create({
      data: {
        userId: andreaAgent.id,
        vendorId: whiteDog.id,
      },
    });
  }

  if (cdFish) {
    await prisma.agentVendor.create({
      data: {
        userId: andreaAgent.id,
        vendorId: cdFish.id,
      },
    });
  }

  await prisma.agentClient.create({
    data: {
      userId: andreaAgent.id,
      clientId: demoRistorante.id,
    },
  });

  // Manuele manages General Beverage and Plustik
  if (generalBeverage) {
    await prisma.agentVendor.create({
      data: {
        userId: manueleAgent.id,
        vendorId: generalBeverage.id,
      },
    });
  }

  if (plustik) {
    await prisma.agentVendor.create({
      data: {
        userId: manueleAgent.id,
        vendorId: plustik.id,
      },
    });
  }

  // ===== DEMO ORDERS =====
  console.log("📋 Creating demo orders with real vendor products...");

  // Get some sample products from real vendors
  const whiteDogProducts = whiteDog
    ? await prisma.vendorProduct.findMany({
        where: { vendorId: whiteDog.id, isActive: true, stockQty: { gt: 0 } },
        include: { Product: true, Vendor: true },
        take: 2,
      })
    : [];

  const cdFishProducts = await prisma.vendorProduct.findMany({
    where: { vendorId: cdFish?.id, isActive: true, stockQty: { gt: 0 } },
    include: { Product: true, Vendor: true },
    take: 2,
  });

  const generalBeverageProducts = await prisma.vendorProduct.findMany({
    where: {
      vendorId: generalBeverage?.id,
      isActive: true,
      stockQty: { gt: 0 },
    },
    include: { Product: true, Vendor: true },
    take: 2,
  });

  // Create first demo order with White Dog and CD Fish products
  if (whiteDogProducts.length > 0 || cdFishProducts.length > 0) {
    const orderItems: Array<{
      vp: any;
      qty: number;
      applyDiscount: boolean;
    }> = [];

    if (whiteDogProducts[0]) {
      orderItems.push({
        vp: whiteDogProducts[0],
        qty: 5,
        applyDiscount: true,
      });
    }
    if (cdFishProducts[0]) {
      orderItems.push({
        vp: cdFishProducts[0],
        qty: 3,
        applyDiscount: true,
      });
    }

    const totalCents = orderItems.reduce((sum, item) => {
      const price = item.applyDiscount
        ? Math.round(
            item.vp.basePriceCents *
              (item.vp.Vendor.name.includes("White Dog") ? 0.95 : 0.9),
          )
        : item.vp.basePriceCents;
      return sum + price * item.qty;
    }, 0);

    const demoOrder1 = await prisma.order.create({
      data: {
        id: createId(),
        clientId: demoRistorante.id,
        submitterUserId: clientDemoUser.id,
        orderNumber: "HYD-20241121-0001",
        status: OrderStatus.SUBMITTED,
        totalCents,
        region: "Lazio",
        assignedAgentUserId: andreaAgent.id,
        notes: "Weekly order for restaurant supplies",
        deliveryAddress: "Piazza Navona, 00186 Roma RM, Italy",
        deliveryLat: 41.8992,
        deliveryLng: 12.4731,
      },
    });

    for (const item of orderItems) {
      const unitPrice = item.applyDiscount
        ? Math.round(
            item.vp.basePriceCents *
              (item.vp.Vendor.name.includes("White Dog") ? 0.95 : 0.9),
          )
        : item.vp.basePriceCents;

      await prisma.orderItem.create({
        data: {
          id: createId(),
          orderId: demoOrder1.id,
          vendorProductId: item.vp.id,
          qty: item.qty,
          unitPriceCents: unitPrice,
          lineTotalCents: unitPrice * item.qty,
          productName: item.vp.Product.name,
          vendorName: item.vp.Vendor.name,
        },
      });
    }

    console.log(`   ✅ Created demo order: ${demoOrder1.orderNumber}`);
  }

  // ===== DRIVERS =====
  console.log("🚚 Creating drivers...");

  const marcoDriver = await prisma.driver.create({
    data: {
      id: createId(),
      name: "Marco Rossi",
      phone: "+39 333 1234567",
      status: DriverStatus.ONLINE,
    },
  });

  const giuliaDriver = await prisma.driver.create({
    data: {
      id: createId(),
      name: "Giulia Bianchi",
      phone: "+39 334 7654321",
      status: DriverStatus.OFFLINE,
    },
  });

  // Create driver users
  await prisma.user.create({
    data: {
      id: createId(),
      email: "driver.marco@hydra.local",
      name: "Marco Rossi",
      role: Role.DRIVER,
      status: UserStatus.APPROVED,
      driverId: marcoDriver.id,
    },
  });

  await prisma.user.create({
    data: {
      id: createId(),
      email: "driver.giulia@hydra.local",
      name: "Giulia Bianchi",
      role: Role.DRIVER,
      status: UserStatus.APPROVED,
      driverId: giuliaDriver.id,
    },
  });

  // ===== VEHICLES =====
  console.log("🚐 Creating vehicles...");

  await prisma.vehicle.create({
    data: {
      licensePlate: "HYD-001",
      description: "Fiat Ducato - Refrigerated Van",
    },
  });

  await prisma.vehicle.create({
    data: {
      licensePlate: "HYD-002",
      description: "Iveco Daily - Standard Cargo",
    },
  });

  // ===== DELIVERIES =====
  console.log("📦 Creating deliveries and additional demo orders...");

  // Create order with delivery ASSIGNED status
  if (generalBeverageProducts.length > 0) {
    const vp = generalBeverageProducts[0];
    const qty = 10;
    const totalCents = vp.basePriceCents * qty;

    const order2 = await prisma.order.create({
      data: {
        id: createId(),
        clientId: trattoriaTrastevere.id,
        submitterUserId: clientDemoUser.id,
        orderNumber: "HYD-20241121-0002",
        status: OrderStatus.CONFIRMED,
        totalCents,
        region: "Lazio",
        assignedAgentUserId: manueleAgent.id,
        notes: "Beverage order for weekend",
        deliveryAddress:
          "Piazza di Santa Maria in Trastevere, 00153 Roma RM, Italy",
        deliveryLat: 41.8894,
        deliveryLng: 12.4692,
      },
    });

    await prisma.orderItem.create({
      data: {
        id: createId(),
        orderId: order2.id,
        vendorProductId: vp.id,
        qty,
        unitPriceCents: vp.basePriceCents,
        lineTotalCents: totalCents,
        productName: vp.Product.name,
        vendorName: vp.Vendor.name,
      },
    });

    await prisma.delivery.create({
      data: {
        id: createId(),
        orderId: order2.id,
        driverId: marcoDriver.id,
        status: DeliveryStatus.ASSIGNED,
        notes: "Assigned to Marco - ready for pickup",
      },
    });

    console.log(`   ✅ Created order: ${order2.orderNumber} (ASSIGNED)`);
  }

  // Create order with delivery PICKED_UP status
  if (cdFishProducts.length > 1) {
    const vp = cdFishProducts[1];
    const qty = 5;
    const totalCents = vp.basePriceCents * qty;

    const order3 = await prisma.order.create({
      data: {
        id: createId(),
        clientId: osteriaCampoFiori.id,
        submitterUserId: clientDemoUser.id,
        orderNumber: "HYD-20241121-0003",
        status: OrderStatus.FULFILLING,
        totalCents,
        region: "Lazio",
        assignedAgentUserId: andreaAgent.id,
        notes: "Fresh seafood delivery",
        deliveryAddress: "Campo de' Fiori 22, 00186 Roma RM, Italy",
        deliveryLat: 41.8955,
        deliveryLng: 12.4723,
      },
    });

    await prisma.orderItem.create({
      data: {
        id: createId(),
        orderId: order3.id,
        vendorProductId: vp.id,
        qty,
        unitPriceCents: vp.basePriceCents,
        lineTotalCents: totalCents,
        productName: vp.Product.name,
        vendorName: vp.Vendor.name,
      },
    });

    await prisma.delivery.create({
      data: {
        id: createId(),
        orderId: order3.id,
        driverId: marcoDriver.id,
        status: DeliveryStatus.PICKED_UP,
        notes: "Picked up from CD Fish warehouse",
        pickedUpAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      },
    });

    console.log(`   ✅ Created order: ${order3.orderNumber} (PICKED_UP)`);
  }

  // Create order with delivery IN_TRANSIT status
  if (whiteDogProducts.length > 1) {
    const vp = whiteDogProducts[1];
    const qty = 8;
    const totalCents = vp.basePriceCents * qty;

    const order4 = await prisma.order.create({
      data: {
        id: createId(),
        clientId: ristoranteTestaccio.id,
        submitterUserId: clientDemoUser.id,
        orderNumber: "HYD-20241121-0004",
        status: OrderStatus.FULFILLING,
        totalCents,
        region: "Lazio",
        assignedAgentUserId: andreaAgent.id,
        notes: "Beverage restock",
        deliveryAddress: "Via Marmorata 39, 00153 Roma RM, Italy",
        deliveryLat: 41.8769,
        deliveryLng: 12.4759,
      },
    });

    await prisma.orderItem.create({
      data: {
        id: createId(),
        orderId: order4.id,
        vendorProductId: vp.id,
        qty,
        unitPriceCents: vp.basePriceCents,
        lineTotalCents: totalCents,
        productName: vp.Product.name,
        vendorName: vp.Vendor.name,
      },
    });

    await prisma.delivery.create({
      data: {
        id: createId(),
        orderId: order4.id,
        driverId: giuliaDriver.id,
        status: DeliveryStatus.IN_TRANSIT,
        notes: "On the way to Testaccio",
        pickedUpAt: new Date(Date.now() - 90 * 60 * 1000), // 90 minutes ago
        inTransitAt: new Date(Date.now() - 60 * 60 * 1000), // 60 minutes ago
      },
    });

    console.log(`   ✅ Created order: ${order4.orderNumber} (IN_TRANSIT)`);
  }

  // ===== DRIVER SHIFTS & STOPS =====
  console.log("🗓️  Creating driver shifts and stops...");

  // Get first vehicle for the shift
  const vehicle1 = await prisma.vehicle.findFirst({
    where: { licensePlate: "HYD-001" },
  });

  if (vehicle1) {
    // Create an open shift for Marco for today
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      7, // Start at 7 AM
      30,
      0,
      0,
    );

    const marcoShift = await prisma.driverShift.create({
      data: {
        id: createId(),
        driverId: marcoDriver.id,
        vehicleId: vehicle1.id,
        date: startOfToday,
        startKm: 45230,
        startFuelLevel: FuelLevel.THREE_QUARTERS,
        startTime: startOfToday,
        // endTime is null - shift is still open
      },
    });

    console.log("✅ Created demo shift for Marco");
  }

  console.log("\n✅ Seed completed successfully!");
  console.log("\n📊 Summary:");

  const vendorCount = await prisma.vendor.count();
  const productCount = await prisma.product.count();
  const vendorProductCount = await prisma.vendorProduct.count();
  const categoryCount = await prisma.productCategory.count();
  const orderCount = await prisma.order.count();
  const deliveryCount = await prisma.delivery.count();

  const userCount = await prisma.user.count();

  console.log(`- Users: ${userCount}`);
  console.log(`- Vendors: ${vendorCount} (Real vendors from CSV)`);
  console.log(`- Clients: 5 (with addresses for map links)`);
  console.log(`- Drivers: 2`);
  console.log(`- Vehicles: 2`);
  console.log(`- Categories: ${categoryCount}`);
  console.log(`- Products: ${productCount}`);
  console.log(`- Vendor Products: ${vendorProductCount}`);
  console.log(`- Agreements: 2`);
  console.log(`- Agent Assignments: 5`);
  console.log(`- Demo Orders: ${orderCount}`);
  console.log(`- Deliveries: ${deliveryCount} (various statuses)`);
  console.log(`- Driver Shifts: 1 (open shift for Marco)`);

  console.log("\n🔐 Test Users:");
  console.log("- admin@hydra.local (ADMIN)");
  console.log("- andrea@hydra.local (AGENT - manages White Dog, CD Fish)");
  console.log(
    "- manuele@hydra.local (AGENT - manages General Beverage, Plustik)",
  );
  console.log("- vendor.whitedog@hydra.local (VENDOR - White Dog S.r.l.)");
  console.log("- vendor.cdfish@hydra.local (VENDOR - CD Fish S.r.l.)");
  console.log(
    "- vendor.generalbeverage@hydra.local (VENDOR - General Beverage Distributor)",
  );
  console.log("- vendor.plustik@hydra.local (VENDOR - Plustik Service S.r.l.)");
  console.log(`- ${clientDemoEmail} (CLIENT - Demo Ristorante)`);
  console.log("- driver.marco@hydra.local (DRIVER - has active deliveries)");
  console.log("- driver.giulia@hydra.local (DRIVER - has active deliveries)");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
