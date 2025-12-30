/**
 * Test script for SetupIntent API endpoint
 *
 * This demonstrates the endpoint but requires authentication to work fully.
 * In production, this would be called from the authenticated frontend.
 */

const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const clientId = "tluf5puru5n29pz5r3phzb3n"; // Demo Ristorante

async function testSetupIntent() {
  console.log("Testing SetupIntent API endpoint...\n");
  console.log(`Base URL: ${BASE_URL}\n`);

  // Test 1: Call without authentication (should fail)
  console.log("Test 1: Without authentication");
  const response1 = await fetch(`${BASE_URL}/api/stripe/setup-intents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId })
  });

  const data1 = await response1.json();
  console.log("Status:", response1.status);
  console.log("Response:", data1);

  if (response1.status === 401) {
    console.log("✅ Correctly requires authentication\n");
  } else {
    console.error("❌ Test failed: Expected 401, got", response1.status);
    process.exit(1);
  }

  // Test 2: Missing clientId
  console.log("Test 2: Missing clientId");
  const response2 = await fetch(`${BASE_URL}/api/stripe/setup-intents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });

  const data2 = await response2.json();
  console.log("Status:", response2.status);
  console.log("Response:", data2);

  if (data2.error?.includes("clientId")) {
    console.log("✅ Correctly validates clientId\n");
  } else {
    console.error("❌ Test failed: Expected error about clientId, got", data2);
    process.exit(1);
  }

  console.log("\nℹ️  To test with authentication:");
  console.log("1. Sign in to the app");
  console.log("2. Use the authenticated session to call:");
  console.log("   POST /api/stripe/setup-intents");
  console.log("   { clientId: 'your-client-id' }");
  console.log("\n3. You'll receive a clientSecret to use with Stripe.js");
}

testSetupIntent().catch((error) => {
  console.error(error);
  process.exit(1);
});
