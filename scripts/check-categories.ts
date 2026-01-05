import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.productCategory.findMany({
    include: {
      CategoryGroup: {
        select: { name: true },
      },
    },
    orderBy: [{ CategoryGroup: { name: "asc" } }, { name: "asc" }],
  });

  const grouped = categories.reduce((acc, cat) => {
    const groupName = cat.CategoryGroup.name;
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push({ name: cat.name, slug: cat.slug });
    return acc;
  }, {} as Record<string, Array<{ name: string; slug: string }>>);

  console.log("\n=== CATEGORIES BY GROUP ===\n");
  Object.entries(grouped).forEach(([group, cats]) => {
    console.log(`\n${group} (${cats.length} categories):`);
    cats.forEach((cat) => console.log(`  - ${cat.name} (${cat.slug})`));
  });
  console.log("\n" + "=".repeat(50));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
