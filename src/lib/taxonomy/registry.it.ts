import { CanonicalCategory } from "./types";

/**
 * Canonical category registry for the Italy (IT) market.
 *
 * Each entry defines:
 *  - the Italian display name
 *  - the slug that exists (or should exist) in ProductCategory
 *  - the CategoryGroupType
 *  - the image key used in src/lib/images.ts categoryImageMap
 *  - aliases (EN/IT synonyms, common misspellings, variant forms)
 *
 * When adding a new category, add it here and it propagates everywhere.
 */
export const IT_CATEGORIES: CanonicalCategory[] = [
  // ─── FOOD ───────────────────────────────────────────────
  {
    name: "Pesce",
    slug: "pesce",
    group: "FOOD",
    imageKey: "pesce",
    aliases: ["seafood", "fish", "pesce", "frutti di mare", "molluschi"],
  },
  {
    name: "Carne",
    slug: "carne",
    group: "FOOD",
    imageKey: "carne",
    aliases: ["meat", "meat-poultry", "carne", "poultry", "pollame"],
  },
  {
    name: "Orto-Frutta",
    slug: "orto-frutta",
    group: "FOOD",
    imageKey: "orto-frutta",
    aliases: [
      "produce",
      "specialty produce",
      "orto-frutta",
      "ortofrutta",
      "frutta",
      "verdura",
      "vegetables",
      "fruits",
    ],
  },
  {
    name: "Pastificio Artigianale",
    slug: "pastificio-artigianale",
    group: "FOOD",
    imageKey: "pastificio-artigianale",
    aliases: [
      "bakery",
      "pastificio artigianale",
      "pastificio",
      "pasta",
      "pane",
      "bread",
    ],
  },
  {
    name: "Latticini",
    slug: "latticini",
    group: "FOOD",
    imageKey: "food",
    aliases: ["dairy", "dairy-eggs", "latticini", "formaggi", "cheese"],
  },
  {
    name: "Surgelati",
    slug: "surgelati",
    group: "FOOD",
    imageKey: "food",
    aliases: ["frozen", "frozen-foods", "surgelati"],
  },
  {
    name: "Dispensa",
    slug: "dispensa",
    group: "FOOD",
    imageKey: "food",
    aliases: ["pantry", "dry-goods-pantry", "dispensa", "dry goods"],
  },
  {
    name: "Food",
    slug: "food",
    group: "FOOD",
    imageKey: "food",
    aliases: ["food", "cibo", "alimentari"],
  },

  // ─── BEVERAGE ───────────────────────────────────────────
  {
    name: "Vini",
    slug: "vini",
    group: "BEVERAGE",
    imageKey: "vini",
    aliases: ["wine", "wines", "vini", "vino"],
  },
  {
    name: "Birre",
    slug: "birre",
    group: "BEVERAGE",
    imageKey: "birre",
    aliases: ["beer", "beers", "birre", "birra"],
  },
  {
    name: "Distillati",
    slug: "distillati",
    group: "BEVERAGE",
    imageKey: "distillati",
    aliases: ["spirits", "distillati", "liquori", "liquor"],
  },
  {
    name: "Soft Drink",
    slug: "soft-drink",
    group: "BEVERAGE",
    imageKey: "soft-drink",
    aliases: [
      "soft drink",
      "soft drinks",
      "soft-drinks",
      "soda",
      "drinks",
      "analcolici",
    ],
  },
  {
    name: "Caffettiera",
    slug: "caffettiera",
    group: "BEVERAGE",
    imageKey: "caffettiera",
    aliases: [
      "coffee",
      "coffee-tea",
      "caffettiera",
      "caffe",
      "caffè",
      "tea",
      "tè",
    ],
  },
  {
    name: "Beverage",
    slug: "beverage",
    group: "BEVERAGE",
    imageKey: "beverage",
    aliases: ["beverage", "beverages", "bevande"],
  },

  // ─── SERVICES ───────────────────────────────────────────
  {
    name: "Monouso",
    slug: "monouso",
    group: "SERVICES",
    imageKey: "monouso",
    aliases: ["disposables", "monouso", "packaging", "supplies"],
  },
  {
    name: "Cleaning & Disposables",
    slug: "cleaning-disposables",
    group: "SERVICES",
    imageKey: "cleaning-disposables",
    aliases: [
      "cleaning & disposables",
      "cleaning-disposables",
      "cleaning",
      "pulizia",
    ],
  },
  {
    name: "Manutenzione",
    slug: "manutenzione",
    group: "SERVICES",
    imageKey: "manutenzione",
    aliases: ["maintenance", "manutenzione"],
  },
  {
    name: "Social Media Manager",
    slug: "social-media-manager",
    group: "SERVICES",
    imageKey: "social-media-manager",
    aliases: ["social media manager", "social media"],
  },
  {
    name: "Licenze",
    slug: "licenze",
    group: "SERVICES",
    imageKey: "licenze",
    aliases: ["licenze", "licenses"],
  },
  {
    name: "Bar Tool",
    slug: "bar-tool",
    group: "SERVICES",
    imageKey: "bar-tool",
    aliases: ["bar tool", "bar tools", "bar-tool", "attrezzatura bar"],
  },
  {
    name: "Services",
    slug: "services",
    group: "SERVICES",
    imageKey: "services",
    aliases: ["services", "servizi"],
  },
];
