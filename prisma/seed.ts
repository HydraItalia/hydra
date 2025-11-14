import { PrismaClient, Role, CategoryGroupType, ProductUnit, PriceMode, OrderStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Clean existing data (in order to avoid FK constraints)
  console.log('🧹 Cleaning existing data...')
  await prisma.auditLog.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.cart.deleteMany()
  await prisma.agreement.deleteMany()
  await prisma.agentVendor.deleteMany()
  await prisma.agentClient.deleteMany()
  await prisma.vendorProduct.deleteMany()
  await prisma.product.deleteMany()
  await prisma.productCategory.deleteMany()
  await prisma.categoryGroup.deleteMany()
  await prisma.client.deleteMany()
  await prisma.vendor.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.verificationToken.deleteMany()
  await prisma.user.deleteMany()

  // ===== USERS =====
  console.log('👥 Creating users...')

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@hydra.local',
      name: 'Admin User',
      role: Role.ADMIN,
    },
  })

  const andreaAgent = await prisma.user.create({
    data: {
      email: 'andrea@hydra.local',
      name: 'Andrea',
      role: Role.AGENT,
      agentCode: 'ANDREA',
    },
  })

  const manueleAgent = await prisma.user.create({
    data: {
      email: 'manuele@hydra.local',
      name: 'Manuele',
      role: Role.AGENT,
      agentCode: 'MANUELE',
    },
  })

  // ===== VENDORS =====
  console.log('🏪 Creating vendors...')

  const freezco = await prisma.vendor.create({
    data: {
      name: 'Freezco',
      region: 'Sardegna',
      notes: 'Primary food and beverage supplier',
    },
  })

  const ghiaccioFacile = await prisma.vendor.create({
    data: {
      name: 'Ghiaccio Facile',
      region: 'Sardegna',
      notes: 'Ice and beverage specialist',
    },
  })

  const icelike = await prisma.vendor.create({
    data: {
      name: 'Icelike',
      region: 'Sardegna',
      notes: 'Premium seafood supplier',
    },
  })

  // Create vendor users
  const vendorFreezcoUser = await prisma.user.create({
    data: {
      email: 'vendor.freezco@hydra.local',
      name: 'Freezco Manager',
      role: Role.VENDOR,
      vendorId: freezco.id,
    },
  })

  const vendorGhiaccioUser = await prisma.user.create({
    data: {
      email: 'vendor.ghiaccio@hydra.local',
      name: 'Ghiaccio Facile Manager',
      role: Role.VENDOR,
      vendorId: ghiaccioFacile.id,
    },
  })

  // ===== CLIENTS =====
  console.log('🍽️  Creating clients...')

  const demoRistorante = await prisma.client.create({
    data: {
      name: 'Demo Ristorante',
      region: 'Sardegna',
      notes: 'Demo restaurant for testing',
    },
  })

  const clientDemoUser = await prisma.user.create({
    data: {
      email: 'client.demo@hydra.local',
      name: 'Demo Restaurant Manager',
      role: Role.CLIENT,
      clientId: demoRistorante.id,
    },
  })

  // ===== CATEGORY GROUPS =====
  console.log('📂 Creating category groups...')

  const foodGroup = await prisma.categoryGroup.create({
    data: { name: CategoryGroupType.FOOD },
  })

  const beverageGroup = await prisma.categoryGroup.create({
    data: { name: CategoryGroupType.BEVERAGE },
  })

  const servicesGroup = await prisma.categoryGroup.create({
    data: { name: CategoryGroupType.SERVICES },
  })

  // ===== PRODUCT CATEGORIES =====
  console.log('🏷️  Creating product categories...')

  // Beverage categories
  const distillatiCat = await prisma.productCategory.create({
    data: { groupId: beverageGroup.id, name: 'Distillati', slug: 'distillati' },
  })

  const softDrinkCat = await prisma.productCategory.create({
    data: { groupId: beverageGroup.id, name: 'Soft Drink', slug: 'soft-drink' },
  })

  const viniCat = await prisma.productCategory.create({
    data: { groupId: beverageGroup.id, name: 'Vini', slug: 'vini' },
  })

  const birreCat = await prisma.productCategory.create({
    data: { groupId: beverageGroup.id, name: 'Birre', slug: 'birre' },
  })

  const caffettieraCat = await prisma.productCategory.create({
    data: { groupId: beverageGroup.id, name: 'Caffettiera', slug: 'caffettiera' },
  })

  const barToolCat = await prisma.productCategory.create({
    data: { groupId: beverageGroup.id, name: 'Bar Tool', slug: 'bar-tool' },
  })

  // Food categories
  const ortoFruttaCat = await prisma.productCategory.create({
    data: { groupId: foodGroup.id, name: 'Orto Frutta', slug: 'orto-frutta' },
  })

  const carneCat = await prisma.productCategory.create({
    data: { groupId: foodGroup.id, name: 'Carne', slug: 'carne' },
  })

  const pesceCat = await prisma.productCategory.create({
    data: { groupId: foodGroup.id, name: 'Pesce', slug: 'pesce' },
  })

  const pastificioCat = await prisma.productCategory.create({
    data: { groupId: foodGroup.id, name: 'Pastificio Artigianale', slug: 'pastificio-artigianale' },
  })

  const monoUsoCat = await prisma.productCategory.create({
    data: { groupId: foodGroup.id, name: 'Monouso', slug: 'monouso' },
  })

  // Services categories
  const manutenzioneCat = await prisma.productCategory.create({
    data: { groupId: servicesGroup.id, name: 'Manutenzione', slug: 'manutenzione' },
  })

  const socialMediaCat = await prisma.productCategory.create({
    data: { groupId: servicesGroup.id, name: 'Social Media Manager', slug: 'social-media-manager' },
  })

  const licenzeCat = await prisma.productCategory.create({
    data: { groupId: servicesGroup.id, name: 'Licenze', slug: 'licenze' },
  })

  const haccpCat = await prisma.productCategory.create({
    data: { groupId: servicesGroup.id, name: 'HACCP', slug: 'haccp' },
  })

  const disinfeCat = await prisma.productCategory.create({
    data: { groupId: servicesGroup.id, name: 'Disinfestazioni', slug: 'disinfestazioni' },
  })

  const rilievi3dCat = await prisma.productCategory.create({
    data: { groupId: servicesGroup.id, name: 'Rilievi 3D', slug: 'rilievi-3d' },
  })

  // ===== PRODUCTS =====
  console.log('📦 Creating products...')

  // Beverage products
  const ghiaccioAlimentare = await prisma.product.create({
    data: {
      categoryId: softDrinkCat.id,
      name: 'Ghiaccio alimentare 10kg',
      description: 'Ghiaccio alimentare certificato in sacchi da 10kg',
      unit: ProductUnit.BOX,
    },
  })

  const acquaFrizzante = await prisma.product.create({
    data: {
      categoryId: softDrinkCat.id,
      name: 'Acqua frizzante 1L x 12',
      description: 'Cassa da 12 bottiglie di acqua frizzante da 1L',
      unit: ProductUnit.BOX,
    },
  })

  const birraArtigianale = await prisma.product.create({
    data: {
      categoryId: birreCat.id,
      name: 'Birra artigianale 33cl x 24',
      description: 'Cassa da 24 bottiglie di birra artigianale locale',
      unit: ProductUnit.BOX,
    },
  })

  // Food products
  const filettoBranzino = await prisma.product.create({
    data: {
      categoryId: pesceCat.id,
      name: 'Filetto di branzino 1kg',
      description: 'Filetti di branzino fresco, pescato locale',
      unit: ProductUnit.KG,
    },
  })

  const pastaTrafilata = await prisma.product.create({
    data: {
      categoryId: pastificioCat.id,
      name: 'Pasta trafilata al bronzo 5kg',
      description: 'Pasta artigianale trafilata al bronzo, vari formati',
      unit: ProductUnit.BOX,
    },
  })

  const pomodoroSan = await prisma.product.create({
    data: {
      categoryId: ortoFruttaCat.id,
      name: 'Pomodoro San Marzano 5kg',
      description: 'Pomodori San Marzano DOP',
      unit: ProductUnit.BOX,
    },
  })

  // Services products
  const sanificazione = await prisma.product.create({
    data: {
      categoryId: disinfeCat.id,
      name: 'Sanificazione locale mensile',
      description: 'Servizio di sanificazione professionale mensile',
      unit: ProductUnit.SERVICE,
    },
  })

  const haccpConsulenza = await prisma.product.create({
    data: {
      categoryId: haccpCat.id,
      name: 'Consulenza HACCP annuale',
      description: 'Consulenza e documentazione HACCP annuale',
      unit: ProductUnit.SERVICE,
    },
  })

  // ===== VENDOR PRODUCTS =====
  console.log('💰 Creating vendor products...')

  // Ghiaccio Facile products
  await prisma.vendorProduct.create({
    data: {
      vendorId: ghiaccioFacile.id,
      productId: ghiaccioAlimentare.id,
      vendorSku: 'GF-ICE-10KG',
      basePriceCents: 450, // €4.50
      currency: 'EUR',
      stockQty: 120,
      leadTimeDays: 1,
      minOrderQty: 5,
      isActive: true,
    },
  })

  await prisma.vendorProduct.create({
    data: {
      vendorId: ghiaccioFacile.id,
      productId: sanificazione.id,
      vendorSku: 'GF-SANIF-MONTH',
      basePriceCents: 9900, // €99.00
      currency: 'EUR',
      stockQty: 999,
      leadTimeDays: 7,
      minOrderQty: 1,
      isActive: true,
    },
  })

  // Freezco products
  await prisma.vendorProduct.create({
    data: {
      vendorId: freezco.id,
      productId: acquaFrizzante.id,
      vendorSku: 'FRZ-WATER-12',
      basePriceCents: 900, // €9.00
      currency: 'EUR',
      stockQty: 60,
      leadTimeDays: 2,
      minOrderQty: 3,
      isActive: true,
    },
  })

  await prisma.vendorProduct.create({
    data: {
      vendorId: freezco.id,
      productId: birraArtigianale.id,
      vendorSku: 'FRZ-BEER-24',
      basePriceCents: 3800, // €38.00
      currency: 'EUR',
      stockQty: 40,
      leadTimeDays: 3,
      minOrderQty: 2,
      isActive: true,
    },
  })

  await prisma.vendorProduct.create({
    data: {
      vendorId: freezco.id,
      productId: pastaTrafilata.id,
      vendorSku: 'FRZ-PASTA-5KG',
      basePriceCents: 1550, // €15.50
      currency: 'EUR',
      stockQty: 50,
      leadTimeDays: 2,
      minOrderQty: 2,
      isActive: true,
    },
  })

  await prisma.vendorProduct.create({
    data: {
      vendorId: freezco.id,
      productId: pomodoroSan.id,
      vendorSku: 'FRZ-TOM-5KG',
      basePriceCents: 1899, // €18.99
      currency: 'EUR',
      stockQty: 35,
      leadTimeDays: 2,
      minOrderQty: 3,
      isActive: true,
    },
  })

  // Icelike products
  const icelikeBranzino = await prisma.vendorProduct.create({
    data: {
      vendorId: icelike.id,
      productId: filettoBranzino.id,
      vendorSku: 'ICE-BRAN-1KG',
      basePriceCents: 1899, // €18.99
      currency: 'EUR',
      stockQty: 25,
      leadTimeDays: 2,
      minOrderQty: 2,
      isActive: true,
    },
  })

  // ===== AGREEMENTS =====
  console.log('🤝 Creating agreements...')

  await prisma.agreement.create({
    data: {
      clientId: demoRistorante.id,
      vendorId: ghiaccioFacile.id,
      priceMode: PriceMode.DISCOUNT,
      discountPct: 0.10, // 10% discount
      notes: 'Volume discount for regular customer',
    },
  })

  // ===== AGENT ASSIGNMENTS =====
  console.log('👔 Creating agent assignments...')

  // Andrea manages Ghiaccio Facile and Demo Ristorante
  await prisma.agentVendor.create({
    data: {
      userId: andreaAgent.id,
      vendorId: ghiaccioFacile.id,
    },
  })

  await prisma.agentClient.create({
    data: {
      userId: andreaAgent.id,
      clientId: demoRistorante.id,
    },
  })

  // Manuele manages Freezco
  await prisma.agentVendor.create({
    data: {
      userId: manueleAgent.id,
      vendorId: freezco.id,
    },
  })

  // ===== DEMO ORDER =====
  console.log('📋 Creating demo order...')

  const demoOrder = await prisma.order.create({
    data: {
      clientId: demoRistorante.id,
      submitterUserId: clientDemoUser.id,
      orderNumber: 'HYD-20241101-0001',
      status: OrderStatus.SUBMITTED,
      totalCents: 13950, // Will be calculated: 10*405 + 5*900 + 3*1550
      region: 'Sardegna',
      assignedAgentUserId: andreaAgent.id,
      notes: 'Weekly order for restaurant supplies',
    },
  })

  // Get vendor products for order items
  const ghiaccioVP = await prisma.vendorProduct.findFirst({
    where: { vendorId: ghiaccioFacile.id, productId: ghiaccioAlimentare.id },
    include: {
      product: true,
      vendor: true,
    },
  })

  const acquaVP = await prisma.vendorProduct.findFirst({
    where: { vendorId: freezco.id, productId: acquaFrizzante.id },
    include: {
      product: true,
      vendor: true,
    },
  })

  const pastaVP = await prisma.vendorProduct.findFirst({
    where: { vendorId: freezco.id, productId: pastaTrafilata.id },
    include: {
      product: true,
      vendor: true,
    },
  })

  // Create order items with price snapshots
  if (ghiaccioVP) {
    // Apply 10% discount from agreement
    const effectivePrice = Math.round(ghiaccioVP.basePriceCents * 0.9)
    await prisma.orderItem.create({
      data: {
        orderId: demoOrder.id,
        vendorProductId: ghiaccioVP.id,
        qty: 10,
        unitPriceCents: effectivePrice, // €4.05 after 10% discount
        lineTotalCents: effectivePrice * 10,
        productName: ghiaccioVP.product.name,
        vendorName: ghiaccioVP.vendor.name,
      },
    })
  }

  if (acquaVP) {
    await prisma.orderItem.create({
      data: {
        orderId: demoOrder.id,
        vendorProductId: acquaVP.id,
        qty: 5,
        unitPriceCents: acquaVP.basePriceCents, // €9.00
        lineTotalCents: acquaVP.basePriceCents * 5,
        productName: acquaVP.product.name,
        vendorName: acquaVP.vendor.name,
      },
    })
  }

  if (pastaVP) {
    await prisma.orderItem.create({
      data: {
        orderId: demoOrder.id,
        vendorProductId: pastaVP.id,
        qty: 3,
        unitPriceCents: pastaVP.basePriceCents, // €15.50
        lineTotalCents: pastaVP.basePriceCents * 3,
        productName: pastaVP.product.name,
        vendorName: pastaVP.vendor.name,
      },
    })
  }

  console.log('✅ Seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`- Users: 6 (1 admin, 2 agents, 2 vendors, 1 client)`)
  console.log(`- Vendors: 3`)
  console.log(`- Clients: 1`)
  console.log(`- Category Groups: 3`)
  console.log(`- Categories: 16`)
  console.log(`- Products: 8`)
  console.log(`- Vendor Products: 7`)
  console.log(`- Agreements: 1`)
  console.log(`- Agent Assignments: 3`)
  console.log(`- Demo Orders: 1 with 3 items`)
  console.log('\n🔐 Test Users:')
  console.log('- admin@hydra.local (ADMIN)')
  console.log('- andrea@hydra.local (AGENT)')
  console.log('- manuele@hydra.local (AGENT)')
  console.log('- vendor.freezco@hydra.local (VENDOR)')
  console.log('- vendor.ghiaccio@hydra.local (VENDOR)')
  console.log('- client.demo@hydra.local (CLIENT)')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
