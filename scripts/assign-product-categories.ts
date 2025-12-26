/**
 * Assign Product Categories Script
 *
 * Assigns categories to products based on product names and patterns
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Keyword mapping for category detection
const categoryKeywords: Record<
  string,
  { keywords: string[]; priority: number }
> = {
  // FOOD
  "meat-poultry": {
    keywords: [
      "beef",
      "chicken",
      "pork",
      "turkey",
      "lamb",
      "meat",
      "poultry",
      "sausage",
      "bacon",
      "ham",
      "steak",
      "ground beef",
    ],
    priority: 1,
  },
  seafood: {
    keywords: [
      "fish",
      "salmon",
      "tuna",
      "shrimp",
      "lobster",
      "crab",
      "seafood",
      "shellfish",
      "cod",
      "tilapia",
    ],
    priority: 1,
  },
  "dairy-eggs": {
    keywords: [
      "milk",
      "cheese",
      "yogurt",
      "butter",
      "cream",
      "egg",
      "dairy",
      "mozzarella",
      "cheddar",
      "parmesan",
    ],
    priority: 1,
  },
  produce: {
    keywords: [
      "lettuce",
      "tomato",
      "onion",
      "potato",
      "carrot",
      "apple",
      "banana",
      "orange",
      "vegetable",
      "fruit",
      "salad",
      "greens",
    ],
    priority: 1,
  },
  "bakery-bread": {
    keywords: [
      "bread",
      "roll",
      "baguette",
      "croissant",
      "pastry",
      "bun",
      "bagel",
      "muffin",
      "bakery",
    ],
    priority: 1,
  },
  "frozen-foods": {
    keywords: [
      "frozen",
      "ice cream",
      "popsicle",
      "freezer",
      "gelato",
    ],
    priority: 1,
  },
  "dry-goods-pantry": {
    keywords: [
      "flour",
      "sugar",
      "rice",
      "pasta",
      "cereal",
      "grain",
      "bean",
      "lentil",
      "quinoa",
      "oats",
    ],
    priority: 1,
  },
  "condiments-sauces": {
    keywords: [
      "sauce",
      "ketchup",
      "mustard",
      "mayo",
      "mayonnaise",
      "dressing",
      "vinegar",
      "oil",
      "condiment",
      "seasoning",
      "spice",
    ],
    priority: 1,
  },

  // BEVERAGE
  "alcoholic-beverages": {
    keywords: [
      "beer",
      "wine",
      "vodka",
      "whiskey",
      "rum",
      "gin",
      "tequila",
      "alcohol",
      "liquor",
      "cocktail",
    ],
    priority: 1,
  },
  "soft-drinks": {
    keywords: ["soda", "cola", "pepsi", "sprite", "soft drink", "pop"],
    priority: 1,
  },
  "coffee-tea": {
    keywords: ["coffee", "tea", "espresso", "latte", "cappuccino"],
    priority: 1,
  },
  juices: {
    keywords: ["juice", "orange juice", "apple juice", "lemonade"],
    priority: 1,
  },
  water: { keywords: ["water", "sparkling water", "mineral water"], priority: 1 },
  beverage: {
    keywords: ["drink", "beverage"],
    priority: 0, // Lower priority, catch-all
  },

  // SERVICES
  "cleaning-disposables": {
    keywords: [
      "cleaning",
      "detergent",
      "soap",
      "sanitizer",
      "napkin",
      "towel",
      "disposable",
      "plate",
      "cup",
      "utensil",
      "glove",
    ],
    priority: 1,
  },
  "equipment-supplies": {
    keywords: [
      "equipment",
      "tool",
      "appliance",
      "machine",
      "container",
      "storage",
    ],
    priority: 1,
  },
  "uniforms-linens": {
    keywords: ["uniform", "apron", "linen", "tablecloth", "towel"],
    priority: 1,
  },
};

function findBestCategory(productName: string): string | null {
  const nameLower = productName.toLowerCase();
  let bestMatch: { slug: string; priority: number } | null = null;

  for (const [slug, config] of Object.entries(categoryKeywords)) {
    for (const keyword of config.keywords) {
      if (nameLower.includes(keyword.toLowerCase())) {
        if (
          !bestMatch ||
          config.priority > bestMatch.priority ||
          (config.priority === bestMatch.priority &&
            keyword.length > nameLower.indexOf(keyword))
        ) {
          bestMatch = { slug, priority: config.priority };
        }
      }
    }
  }

  return bestMatch?.slug || null;
}

async function main() {
  console.log("🔍 Checking all products for better category matches...\n");

  // Get all products (we want to reassign generic categories to specific ones)
  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      categoryId: true,
    },
  });

  console.log(`Found ${products.length} products to check\n`);

  // Get all categories
  const categories = await prisma.productCategory.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });

  const categoryMap = new Map(categories.map((c) => [c.slug, c]));

  let assigned = 0;
  let unassigned = 0;
  const unassignedProducts: string[] = [];

  console.log("📝 Assigning better categories...\n");

  for (const product of products) {
    const categorySlug = findBestCategory(product.name);

    if (categorySlug && categoryMap.has(categorySlug)) {
      const category = categoryMap.get(categorySlug)!;

      // Only update if the category is different
      if (product.categoryId !== category.id) {
        await prisma.product.update({
          where: { id: product.id },
          data: { categoryId: category.id },
        });

        console.log(`  ✅ ${product.name} → ${category.name}`);
        assigned++;
      }
    } else {
      // Keep current category if no better match found
      unassignedProducts.push(product.name);
      unassigned++;
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log(`📊 Summary:`);
  console.log(`   ✅ Assigned: ${assigned}`);
  console.log(`   ❌ Unassigned: ${unassigned}`);

  if (unassignedProducts.length > 0) {
    console.log(`\n⚠️  Products without matches:`);
    unassignedProducts.forEach((name) => console.log(`   - ${name}`));
    console.log(
      `\n💡 You may need to manually assign categories to these products`
    );
  }
}

main()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
