import { describe, it, expect } from "vitest";
import { setParam, parseBoolParam, buildQueryString } from "@/lib/url";

describe("URL Helpers", () => {
  describe("setParam", () => {
    it("should set a parameter on a URL", () => {
      const url = new URL("https://example.com");
      setParam(url, "foo", "bar");
      expect(url.searchParams.get("foo")).toBe("bar");
    });

    it("should update an existing parameter", () => {
      const url = new URL("https://example.com?foo=old");
      setParam(url, "foo", "new");
      expect(url.searchParams.get("foo")).toBe("new");
    });

    it("should delete parameter when value is null", () => {
      const url = new URL("https://example.com?foo=bar");
      setParam(url, "foo", null);
      expect(url.searchParams.has("foo")).toBe(false);
    });

    it("should delete parameter when value is undefined", () => {
      const url = new URL("https://example.com?foo=bar");
      setParam(url, "foo", undefined);
      expect(url.searchParams.has("foo")).toBe(false);
    });

    it("should delete parameter when value is empty string", () => {
      const url = new URL("https://example.com?foo=bar");
      setParam(url, "foo", "");
      expect(url.searchParams.has("foo")).toBe(false);
    });

    it("should handle multiple parameters", () => {
      const url = new URL("https://example.com");
      setParam(url, "foo", "bar");
      setParam(url, "baz", "qux");
      expect(url.searchParams.get("foo")).toBe("bar");
      expect(url.searchParams.get("baz")).toBe("qux");
    });

    it("should preserve other parameters when deleting one", () => {
      const url = new URL("https://example.com?foo=bar&baz=qux");
      setParam(url, "foo", null);
      expect(url.searchParams.has("foo")).toBe(false);
      expect(url.searchParams.get("baz")).toBe("qux");
    });

    it("should handle special characters in values", () => {
      const url = new URL("https://example.com");
      setParam(url, "q", "hello world");
      expect(url.searchParams.get("q")).toBe("hello world");
    });

    it("should URL-encode values", () => {
      const url = new URL("https://example.com");
      setParam(url, "q", "foo&bar=baz");
      expect(url.searchParams.toString()).toContain("foo%26bar%3Dbaz");
    });
  });

  describe("parseBoolParam", () => {
    it('should return true when param is "1"', () => {
      const sp = new URLSearchParams("inStock=1");
      expect(parseBoolParam(sp, "inStock")).toBe(true);
    });

    it('should return false when param is not "1"', () => {
      const sp = new URLSearchParams("inStock=0");
      expect(parseBoolParam(sp, "inStock")).toBe(false);
    });

    it('should return false when param is "true" (not "1")', () => {
      const sp = new URLSearchParams("inStock=true");
      expect(parseBoolParam(sp, "inStock")).toBe(false);
    });

    it("should return false when param is missing", () => {
      const sp = new URLSearchParams("");
      expect(parseBoolParam(sp, "inStock")).toBe(false);
    });

    it("should return false when param is empty string", () => {
      const sp = new URLSearchParams("inStock=");
      expect(parseBoolParam(sp, "inStock")).toBe(false);
    });

    it("should handle multiple params and only check the specified one", () => {
      const sp = new URLSearchParams("foo=1&bar=0");
      expect(parseBoolParam(sp, "foo")).toBe(true);
      expect(parseBoolParam(sp, "bar")).toBe(false);
    });
  });

  describe("buildQueryString", () => {
    it("should build query string from object", () => {
      const params = { foo: "bar", baz: "qux" };
      const qs = buildQueryString(params);
      // Order may vary, so check both possibilities
      const isValid = qs === "foo=bar&baz=qux" || qs === "baz=qux&foo=bar";
      expect(isValid).toBe(true);
    });

    it("should omit undefined values", () => {
      const params = { foo: "bar", baz: undefined };
      const qs = buildQueryString(params);
      expect(qs).toBe("foo=bar");
    });

    it("should omit null values", () => {
      const params = { foo: "bar", baz: null };
      const qs = buildQueryString(params);
      expect(qs).toBe("foo=bar");
    });

    it("should omit empty string values", () => {
      const params = { foo: "bar", baz: "" };
      const qs = buildQueryString(params);
      expect(qs).toBe("foo=bar");
    });

    it("should return empty string for empty object", () => {
      const qs = buildQueryString({});
      expect(qs).toBe("");
    });

    it("should return empty string when all values are null/undefined", () => {
      const params = { foo: null, baz: undefined };
      const qs = buildQueryString(params);
      expect(qs).toBe("");
    });

    it("should URL-encode values", () => {
      const params = { q: "hello world" };
      const qs = buildQueryString(params);
      expect(qs).toBe("q=hello+world");
    });

    it("should handle special characters", () => {
      const params = { q: "foo&bar=baz" };
      const qs = buildQueryString(params);
      expect(qs).toContain("foo%26bar%3Dbaz");
    });

    it("should handle multiple params with mixed values", () => {
      const params = {
        group: "food",
        category: "seafood",
        q: undefined,
        inStock: null,
        page: "2",
      };
      const qs = buildQueryString(params);

      // Should only include group, category, and page
      expect(qs).toContain("group=food");
      expect(qs).toContain("category=seafood");
      expect(qs).toContain("page=2");
      expect(qs).not.toContain("q=");
      expect(qs).not.toContain("inStock=");
    });

    it('should preserve "0" as a valid value', () => {
      const params = { page: "0" };
      const qs = buildQueryString(params);
      expect(qs).toBe("page=0");
    });
  });
});
