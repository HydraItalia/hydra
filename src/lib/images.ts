/**
 * Image utilities for product images
 * Uses Pexels API for category-based placeholder images with randomization
 */

import { getImageKeyForCategorySlug } from "@/lib/taxonomy";

/**
 * Map category slugs to arrays of Pexels photo IDs for variety
 * Multiple images per category for randomization based on product name
 */
const categoryImageMap: Record<string, string[]> = {
  // GROUP-LEVEL FALLBACKS (when products don't have specific categories)
  beverage: [
    // Mix of all beverage images
    "https://images.pexels.com/photos/1407846/pexels-photo-1407846.jpeg", // Wine
    "https://images.pexels.com/photos/1552630/pexels-photo-1552630.jpeg", // Beer
    "https://images.pexels.com/photos/602750/pexels-photo-602750.jpeg", // Spirits
    "https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg", // Soft drinks
    "https://images.pexels.com/photos/1695052/pexels-photo-1695052.jpeg", // Coffee
    "https://images.pexels.com/photos/1089930/pexels-photo-1089930.jpeg", // Craft beer
    "https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg", // Whiskey
    "https://images.pexels.com/photos/1292294/pexels-photo-1292294.jpeg", // Soda
    "https://images.pexels.com/photos/1802476/pexels-photo-1802476.jpeg", // Wine bottles
    "https://images.pexels.com/photos/894695/pexels-photo-894695.jpeg", // Coffee beans
  ],
  food: [
    // Mix of all food images
    "https://images.pexels.com/photos/1907228/pexels-photo-1907228.jpeg", // Fish
    "https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg", // Meat
    "https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg", // Vegetables
    "https://images.pexels.com/photos/1487511/pexels-photo-1487511.jpeg", // Pasta
    "https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg", // Seafood
    "https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg", // Produce
    "https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg", // Butcher
    "https://images.pexels.com/photos/1438672/pexels-photo-1438672.jpeg", // Pasta making
    "https://images.pexels.com/photos/264537/pexels-photo-264537.jpeg", // Fresh veggies
    "https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg", // Salmon
  ],
  services: [
    "https://images.pexels.com/photos/5691530/pexels-photo-5691530.jpeg",
    "https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg",
    "https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg",
    "https://images.pexels.com/photos/1249611/pexels-photo-1249611.jpeg",
  ],

  // FOOD categories
  pesce: [
    "https://images.pexels.com/photos/1907228/pexels-photo-1907228.jpeg",
    "https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg",
    "https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg",
    "https://images.pexels.com/photos/1093836/pexels-photo-1093836.jpeg",
    "https://images.pexels.com/photos/416528/pexels-photo-416528.jpeg",
    "https://images.pexels.com/photos/1683545/pexels-photo-1683545.jpeg",
    "https://images.pexels.com/photos/2144112/pexels-photo-2144112.jpeg",
    "https://images.pexels.com/photos/1862143/pexels-photo-1862143.jpeg",
    "https://images.pexels.com/photos/1395964/pexels-photo-1395964.jpeg",
    "https://images.pexels.com/photos/128408/pexels-photo-128408.jpeg",
  ],
  carne: [
    "https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg",
    "https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg",
    "https://images.pexels.com/photos/3688/food-dinner-lunch-unhealthy.jpg",
    "https://images.pexels.com/photos/1539684/pexels-photo-1539684.jpeg",
    "https://images.pexels.com/photos/1431415/pexels-photo-1431415.jpeg",
    "https://images.pexels.com/photos/361184/asparagus-steak-veal-steak-veal-361184.jpeg",
    "https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg",
    "https://images.pexels.com/photos/618773/pexels-photo-618773.jpeg",
  ],
  "orto-frutta": [
    "https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg",
    "https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg",
    "https://images.pexels.com/photos/264537/pexels-photo-264537.jpeg",
    "https://images.pexels.com/photos/1266104/pexels-photo-1266104.jpeg",
    "https://images.pexels.com/photos/1656666/pexels-photo-1656666.jpeg",
    "https://images.pexels.com/photos/1306559/pexels-photo-1306559.jpeg",
    "https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg",
    "https://images.pexels.com/photos/128402/pexels-photo-128402.jpeg",
    "https://images.pexels.com/photos/1414651/pexels-photo-1414651.jpeg",
    "https://images.pexels.com/photos/1352199/pexels-photo-1352199.jpeg",
  ],
  "pastificio-artigianale": [
    "https://images.pexels.com/photos/1487511/pexels-photo-1487511.jpeg",
    "https://images.pexels.com/photos/1438672/pexels-photo-1438672.jpeg",
    "https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg",
    "https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg",
    "https://images.pexels.com/photos/1340116/pexels-photo-1340116.jpeg",
    "https://images.pexels.com/photos/1854652/pexels-photo-1854652.jpeg",
    "https://images.pexels.com/photos/4518844/pexels-photo-4518844.jpeg",
  ],
  monouso: [
    "https://images.pexels.com/photos/6347888/pexels-photo-6347888.jpeg",
    "https://images.pexels.com/photos/4099354/pexels-photo-4099354.jpeg",
    "https://images.pexels.com/photos/6256004/pexels-photo-6256004.jpeg",
    "https://images.pexels.com/photos/3735218/pexels-photo-3735218.jpeg",
    "https://images.pexels.com/photos/4099093/pexels-photo-4099093.jpeg",
    "https://images.pexels.com/photos/6530877/pexels-photo-6530877.jpeg",
  ],

  // BEVERAGE categories
  distillati: [
    "https://images.pexels.com/photos/602750/pexels-photo-602750.jpeg",
    "https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg",
    "https://images.pexels.com/photos/1509961/pexels-photo-1509961.jpeg",
    "https://images.pexels.com/photos/4021983/pexels-photo-4021983.jpeg",
    "https://images.pexels.com/photos/1270968/pexels-photo-1270968.jpeg",
    "https://images.pexels.com/photos/1238318/pexels-photo-1238318.jpeg",
    "https://images.pexels.com/photos/5530300/pexels-photo-5530300.jpeg",
    "https://images.pexels.com/photos/2848686/pexels-photo-2848686.jpeg",
  ],
  "soft-drink": [
    "https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg",
    "https://images.pexels.com/photos/1292294/pexels-photo-1292294.jpeg",
    "https://images.pexels.com/photos/1571848/pexels-photo-1571848.jpeg",
    "https://images.pexels.com/photos/2775860/pexels-photo-2775860.jpeg",
    "https://images.pexels.com/photos/2983100/pexels-photo-2983100.jpeg",
    "https://images.pexels.com/photos/2983099/pexels-photo-2983099.jpeg",
    "https://images.pexels.com/photos/4021983/pexels-photo-4021983.jpeg",
    "https://images.pexels.com/photos/1629149/pexels-photo-1629149.jpeg",
  ],
  vini: [
    "https://images.pexels.com/photos/1407846/pexels-photo-1407846.jpeg",
    "https://images.pexels.com/photos/1802476/pexels-photo-1802476.jpeg",
    "https://images.pexels.com/photos/87224/pexels-photo-87224.jpeg",
    "https://images.pexels.com/photos/2909095/pexels-photo-2909095.jpeg",
    "https://images.pexels.com/photos/34426/pexels-photo.jpg",
    "https://images.pexels.com/photos/2775860/pexels-photo-2775860.jpeg",
    "https://images.pexels.com/photos/1123260/pexels-photo-1123260.jpeg",
    "https://images.pexels.com/photos/1850629/pexels-photo-1850629.jpeg",
    "https://images.pexels.com/photos/3009754/pexels-photo-3009754.jpeg",
  ],
  birre: [
    "https://images.pexels.com/photos/1552630/pexels-photo-1552630.jpeg",
    "https://images.pexels.com/photos/1089930/pexels-photo-1089930.jpeg",
    "https://images.pexels.com/photos/1566837/pexels-photo-1566837.jpeg",
    "https://images.pexels.com/photos/1267360/pexels-photo-1267360.jpeg",
    "https://images.pexels.com/photos/159291/beer-alcohol-pub-bar-159291.jpeg",
    "https://images.pexels.com/photos/1672304/pexels-photo-1672304.jpeg",
    "https://images.pexels.com/photos/1269025/pexels-photo-1269025.jpeg",
    "https://images.pexels.com/photos/52994/beer-drinks-guinness-beer-glass-52994.jpeg",
  ],
  caffettiera: [
    "https://images.pexels.com/photos/1695052/pexels-photo-1695052.jpeg",
    "https://images.pexels.com/photos/894695/pexels-photo-894695.jpeg",
    "https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg",
    "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg",
    "https://images.pexels.com/photos/373639/pexels-photo-373639.jpeg",
    "https://images.pexels.com/photos/1251175/pexels-photo-1251175.jpeg",
    "https://images.pexels.com/photos/1278682/pexels-photo-1278682.jpeg",
    "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg",
  ],
  "bar-tool": [
    "https://images.pexels.com/photos/2795026/pexels-photo-2795026.jpeg",
    "https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg",
    "https://images.pexels.com/photos/1269025/pexels-photo-1269025.jpeg",
    "https://images.pexels.com/photos/667986/pexels-photo-667986.jpeg",
    "https://images.pexels.com/photos/1089932/pexels-photo-1089932.jpeg",
    "https://images.pexels.com/photos/2480523/pexels-photo-2480523.jpeg",
  ],

  // SERVICES categories
  manutenzione: [
    "https://images.pexels.com/photos/5691530/pexels-photo-5691530.jpeg",
    "https://images.pexels.com/photos/1249611/pexels-photo-1249611.jpeg",
    "https://images.pexels.com/photos/159358/construction-site-build-construction-work-159358.jpeg",
    "https://images.pexels.com/photos/1249610/pexels-photo-1249610.jpeg",
  ],
  "social-media-manager": [
    "https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg",
    "https://images.pexels.com/photos/1591062/pexels-photo-1591062.jpeg",
    "https://images.pexels.com/photos/147413/twitter-facebook-together-exchange-of-information-147413.jpeg",
    "https://images.pexels.com/photos/270637/pexels-photo-270637.jpeg",
  ],
  licenze: [
    "https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg",
    "https://images.pexels.com/photos/4427430/pexels-photo-4427430.jpeg",
    "https://images.pexels.com/photos/7735656/pexels-photo-7735656.jpeg",
    "https://images.pexels.com/photos/6476589/pexels-photo-6476589.jpeg",
  ],
  "cleaning-disposables": [
    "https://images.pexels.com/photos/6347888/pexels-photo-6347888.jpeg", // Disposables
    "https://images.pexels.com/photos/4099354/pexels-photo-4099354.jpeg", // Paper products
    "https://images.pexels.com/photos/6256004/pexels-photo-6256004.jpeg", // Eco disposables
    "https://images.pexels.com/photos/3735218/pexels-photo-3735218.jpeg", // Cleaning supplies
    "https://images.pexels.com/photos/4099093/pexels-photo-4099093.jpeg", // Disposable items
    "https://images.pexels.com/photos/6530877/pexels-photo-6530877.jpeg", // Cleaning products
  ],
};

/**
 * Simple hash function to generate a consistent number from a string
 * Used for selecting images based on product name
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash | 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generates a product image URL
 * Returns database imageUrl if available, otherwise a category-based placeholder
 * Uses product name to consistently select from multiple images per category
 *
 * @param imageUrl - Optional product image URL from database
 * @param productName - Product name for consistent image selection
 * @param categorySlug - Category slug for fallback image
 * @param size - Image size (width)
 * @returns Image URL
 */
export function getProductImageUrl(
  imageUrl: string | null | undefined,
  productName: string,
  categorySlug: string,
  size: number = 400
): string {
  // If product has a custom image URL, use that
  if (imageUrl) {
    return imageUrl;
  }

  // Bridge the DB slug to the image map key (e.g. "seafood" → "pesce")
  const imageKey = getImageKeyForCategorySlug(categorySlug);
  const imageArray = categoryImageMap[imageKey] ?? categoryImageMap[categorySlug];

  if (imageArray && imageArray.length > 0) {
    // Use hash of product name to consistently select an image from the array
    const hash = hashString(productName);
    const index = hash % imageArray.length;
    const baseUrl = imageArray[index];

    // Add Pexels size parameters for optimization
    return `${baseUrl}?auto=compress&cs=tinysrgb&w=${size}`;
  }

  // Fallback: use all beverage/food/service images combined
  // Combine all images from all categories for maximum variety
  const allImages = Object.values(categoryImageMap).flat();
  const hash = hashString(productName + categorySlug);
  const index = hash % allImages.length;
  return `${allImages[index]}?auto=compress&cs=tinysrgb&w=${size}`;
}

/**
 * Get optimized image URL for different display sizes
 */
export function getProductImageUrlOptimized(
  imageUrl: string | null | undefined,
  productName: string,
  categorySlug: string,
  variant: "thumbnail" | "card" | "detail" = "card"
): string {
  const sizeMap = {
    thumbnail: 200,
    card: 400,
    detail: 800,
  };

  return getProductImageUrl(
    imageUrl,
    productName,
    categorySlug,
    sizeMap[variant]
  );
}
