import { prisma } from '../src/lib/prisma';

async function addTestVendor() {
  try {
    // Check if vendor already exists
    const existingVendor = await prisma.vendor.findFirst({
      where: {
        name: 'Test Vendor - Stripe Connect',
      },
    });

    let vendorId: string;

    if (existingVendor) {
      console.log('✓ Test vendor already exists');
      vendorId = existingVendor.id;
    } else {
      // Create the vendor
      const vendor = await prisma.vendor.create({
        data: {
          name: 'Test Vendor - Stripe Connect',
          businessName: 'Test Vendor LLC',
          taxId: 'IT00000000000',
          phone: '+39 000 0000000',
          email: 'testvendor@stripe-test.com',
          categories: ['OTHER'],
          isActive: true,
        },
      });
      vendorId = vendor.id;
      console.log('✓ Created test vendor:', vendor.name);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'testvendor@stripe-test.com' },
    });

    if (existingUser) {
      console.log('✓ User testvendor@stripe-test.com already exists');
    } else {
      // Create the user
      const user = await prisma.user.create({
        data: {
          email: 'testvendor@stripe-test.com',
          name: 'Test Vendor - Stripe Connect',
          role: 'VENDOR',
          vendorId: vendorId,
        },
      });
      console.log('✓ Created user:', user.email);
    }

    console.log('\n✅ Test vendor setup complete!');
  } catch (error) {
    console.error('Error adding test vendor:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addTestVendor().catch(console.error);
