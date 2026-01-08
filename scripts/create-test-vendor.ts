import { prisma } from '../src/lib/prisma';
import { createId } from '@paralleldrive/cuid2';
import { Role } from '@prisma/client';

async function createTestVendor() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'testvendor@stripe-test.com' },
    });

    if (existingUser) {
      console.log('✓ User testvendor@stripe-test.com already exists');
      await prisma.$disconnect();
      return;
    }

    // Create the vendor
    const vendor = await prisma.vendor.create({
      data: {
        id: createId(),
        name: 'Test Vendor - Stripe Connect',
        contactEmail: 'testvendor@stripe-test.com',
      },
    });

    console.log('✓ Created vendor:', vendor.name);

    // Create the user
    const user = await prisma.user.create({
      data: {
        id: createId(),
        email: 'testvendor@stripe-test.com',
        name: 'Test Vendor - Stripe Connect',
        role: Role.VENDOR,
        vendorId: vendor.id,
      },
    });

    console.log('✓ Created user:', user.email);
    console.log('\n✅ Test vendor setup complete!');
    console.log('You can now sign in with testvendor@stripe-test.com');
  } catch (error) {
    console.error('Error creating test vendor:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestVendor().catch(console.error);
