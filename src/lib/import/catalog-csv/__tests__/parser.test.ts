import { describe, it, expect } from "vitest";
import { parseCsv, CsvParseError } from "../parser";

describe("parseCsv", () => {
  it("parses valid CSV with known columns", () => {
    const csv = `vendor_name,category,name,unit,price_cents,in_stock,product_code
White Dog,Beverage,Red Wine,bottle,1500,true,WD-001
CD Fish,Seafood,Salmon Fillet,kg,2800,true,CF-001`;

    const rows = parseCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      vendor_name: "White Dog",
      category: "Beverage",
      name: "Red Wine",
      unit: "bottle",
      price_cents: "1500",
      in_stock: "true",
      product_code: "WD-001",
    });
  });

  it("strips unknown columns from output", () => {
    const csv = `vendor_name,category,name,unit,price_cents,in_stock,product_code,unknown_col
White Dog,Beverage,Red Wine,bottle,1500,true,WD-001,should-be-stripped`;

    const rows = parseCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0]).not.toHaveProperty("unknown_col");
    expect(rows[0].vendor_name).toBe("White Dog");
  });

  it("throws CsvParseError on empty input", () => {
    expect(() => parseCsv("")).toThrow(CsvParseError);
    expect(() => parseCsv("")).toThrow("CSV input is empty");
  });

  it("throws CsvParseError on header-only CSV", () => {
    const csv =
      "vendor_name,category,name,unit,price_cents,in_stock,product_code\n";
    expect(() => parseCsv(csv)).toThrow(CsvParseError);
    expect(() => parseCsv(csv)).toThrow("CSV contains no data rows");
  });

  it("throws CsvParseError when column count exceeds limit", () => {
    // Create CSV with 21 columns
    const headers = Array.from({ length: 21 }, (_, i) => `col${i}`).join(",");
    const values = Array.from({ length: 21 }, () => "val").join(",");
    const csv = `${headers}\n${values}`;

    expect(() => parseCsv(csv)).toThrow(CsvParseError);
    expect(() => parseCsv(csv)).toThrow("21 columns (max 20)");
  });

  it("handles CSV with source_price_raw column", () => {
    const csv = `vendor_name,category,name,unit,price_cents,in_stock,product_code,source_price_raw
White Dog,Beverage,Red Wine,bottle,1500,true,WD-001,15.00 EUR`;

    const rows = parseCsv(csv);
    expect(rows[0].source_price_raw).toBe("15.00 EUR");
  });

  it("trims whitespace from values", () => {
    const csv = `vendor_name,category,name,unit,price_cents,in_stock,product_code
  White Dog  , Beverage , Red Wine , bottle , 1500 , true , WD-001 `;

    const rows = parseCsv(csv);
    expect(rows[0].vendor_name).toBe("White Dog");
    expect(rows[0].category).toBe("Beverage");
    expect(rows[0].name).toBe("Red Wine");
  });
});
