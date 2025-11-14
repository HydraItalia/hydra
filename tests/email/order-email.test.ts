import {
  buildOrderConfirmationEmail,
  sendOrderConfirmationEmail,
  type OrderEmailPayload,
} from "@/lib/email";

describe("buildOrderConfirmationEmail", () => {
  const mockOrderData = {
    orderNumber: "HYD-20251114-0001",
    createdAt: new Date("2025-11-14T20:30:00Z"),
    totalCents: 15000, // €150.00
    clientEmail: "test@example.com",
    clientName: "Test Client",
    items: [
      {
        productName: "Ghiaccio alimentare 10kg",
        vendorName: "Ghiaccio Facile",
        quantity: 10,
        priceCents: 450, // €4.50
      },
      {
        productName: "Acqua frizzante 1L x 12",
        vendorName: "Freezco",
        quantity: 5,
        priceCents: 900, // €9.00
      },
      {
        productName: "Pasta trafilata al bronzo 5kg",
        vendorName: "Freezco",
        quantity: 3,
        priceCents: 1550, // €15.50
      },
    ],
  };

  it("should generate non-empty subject, text, and html", () => {
    const result = buildOrderConfirmationEmail(mockOrderData);

    expect(result.subject).toBeTruthy();
    expect(result.subject.length).toBeGreaterThan(0);
    expect(result.text).toBeTruthy();
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.html).toBeTruthy();
    expect(result.html.length).toBeGreaterThan(0);
  });

  it("should include order number in subject", () => {
    const result = buildOrderConfirmationEmail(mockOrderData);

    expect(result.subject).toContain(mockOrderData.orderNumber);
  });

  it("should include order number in text body", () => {
    const result = buildOrderConfirmationEmail(mockOrderData);

    expect(result.text).toContain(mockOrderData.orderNumber);
  });

  it("should include order number in html body", () => {
    const result = buildOrderConfirmationEmail(mockOrderData);

    expect(result.html).toContain(mockOrderData.orderNumber);
  });

  it("should use client email as 'to' field", () => {
    const result = buildOrderConfirmationEmail(mockOrderData);

    expect(result.to).toBe(mockOrderData.clientEmail);
  });

  it("should include client name in text body", () => {
    const result = buildOrderConfirmationEmail(mockOrderData);

    expect(result.text).toContain(mockOrderData.clientName);
  });

  it("should include client name in html body", () => {
    const result = buildOrderConfirmationEmail(mockOrderData);

    expect(result.html).toContain(mockOrderData.clientName);
  });

  it("should handle null client name gracefully", () => {
    const dataWithoutName = {
      ...mockOrderData,
      clientName: null,
    };

    const result = buildOrderConfirmationEmail(dataWithoutName);

    expect(result.text).toBeTruthy();
    expect(result.html).toBeTruthy();
    // Should default to "Cliente" in Italian
    expect(result.text).toContain("Cliente");
    expect(result.html).toContain("Cliente");
  });

  it("should include each item's product name in text", () => {
    const result = buildOrderConfirmationEmail(mockOrderData);

    mockOrderData.items.forEach((item) => {
      expect(result.text).toContain(item.productName);
    });
  });

  it("should include each item's product name in html", () => {
    const result = buildOrderConfirmationEmail(mockOrderData);

    mockOrderData.items.forEach((item) => {
      expect(result.html).toContain(item.productName);
    });
  });

  it("should include each item's vendor name in text", () => {
    const result = buildOrderConfirmationEmail(mockOrderData);

    mockOrderData.items.forEach((item) => {
      expect(result.text).toContain(item.vendorName);
    });
  });

  it("should include each item's vendor name in html", () => {
    const result = buildOrderConfirmationEmail(mockOrderData);

    mockOrderData.items.forEach((item) => {
      expect(result.html).toContain(item.vendorName);
    });
  });

  it("should include each item's quantity in text", () => {
    const result = buildOrderConfirmationEmail(mockOrderData);

    mockOrderData.items.forEach((item) => {
      expect(result.text).toContain(`× ${item.quantity}`);
    });
  });

  it("should include formatted prices in text", () => {
    const result = buildOrderConfirmationEmail(mockOrderData);

    // Check for formatted prices - Italian locale uses non-breaking space before €
    expect(result.text).toMatch(/4,50\s+€/);
    expect(result.text).toMatch(/9,00\s+€/);
    expect(result.text).toMatch(/15,50\s+€/);
  });

  it("should include formatted total in text", () => {
    const result = buildOrderConfirmationEmail(mockOrderData);

    // Total should have Italian formatting with non-breaking space
    expect(result.text).toMatch(/150,00\s+€/);
  });

  it("should include formatted total in html", () => {
    const result = buildOrderConfirmationEmail(mockOrderData);

    expect(result.html).toMatch(/150,00\s+€/);
  });

  it("should have Italian subject line", () => {
    const result = buildOrderConfirmationEmail(mockOrderData);

    expect(result.subject).toContain("Conferma Ordine");
  });

  it("should include Hydra branding in html", () => {
    const result = buildOrderConfirmationEmail(mockOrderData);

    expect(result.html.toUpperCase()).toContain("HYDRA");
  });

  it("should have proper html structure", () => {
    const result = buildOrderConfirmationEmail(mockOrderData);

    expect(result.html).toContain("<!DOCTYPE html>");
    expect(result.html).toContain("<html");
    expect(result.html).toContain("</html>");
    expect(result.html).toContain("<body");
    expect(result.html).toContain("</body>");
  });

  it("should include footer message in text", () => {
    const result = buildOrderConfirmationEmail(mockOrderData);

    expect(result.text).toContain("Questo è un ordine generato da Hydra");
  });

  it("should include footer message in html", () => {
    const result = buildOrderConfirmationEmail(mockOrderData);

    expect(result.html).toContain("Questo è un ordine generato da Hydra");
  });
});

describe("sendOrderConfirmationEmail", () => {
  const mockPayload: OrderEmailPayload = {
    to: "test@example.com",
    subject: "Test Order Confirmation",
    text: "This is a test email",
    html: "<p>This is a test email</p>",
  };

  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  const originalEnv = process.env;

  beforeEach(() => {
    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Reset env
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    process.env = originalEnv;
  });

  it("should log email when AUTH_EMAIL_DEV_MODE is true", async () => {
    process.env.AUTH_EMAIL_DEV_MODE = "true";

    await sendOrderConfirmationEmail(mockPayload);

    expect(consoleLogSpy).toHaveBeenCalled();
    const logs = consoleLogSpy.mock.calls.flat().join("\n");
    expect(logs).toContain("Hydra EMAIL DEV MODE");
    expect(logs).toContain(mockPayload.to);
    expect(logs).toContain(mockPayload.subject);
  });

  it("should log email when AUTH_EMAIL_DEV_MODE is not set (default)", async () => {
    delete process.env.AUTH_EMAIL_DEV_MODE;

    await sendOrderConfirmationEmail(mockPayload);

    expect(consoleLogSpy).toHaveBeenCalled();
    const logs = consoleLogSpy.mock.calls.flat().join("\n");
    expect(logs).toContain("DEV MODE");
  });

  it("should log email when NODE_ENV is development", async () => {
    delete process.env.AUTH_EMAIL_DEV_MODE;
    process.env.NODE_ENV = "development";

    await sendOrderConfirmationEmail(mockPayload);

    expect(consoleLogSpy).toHaveBeenCalled();
    const logs = consoleLogSpy.mock.calls.flat().join("\n");
    expect(logs).toContain("DEV MODE");
  });

  it("should handle AUTH_EMAIL_DEV_MODE case-insensitively", async () => {
    process.env.AUTH_EMAIL_DEV_MODE = "TRUE";

    await sendOrderConfirmationEmail(mockPayload);

    expect(consoleLogSpy).toHaveBeenCalled();
    const logs = consoleLogSpy.mock.calls.flat().join("\n");
    expect(logs).toContain("DEV MODE");
  });

  it("should show TODO message when AUTH_EMAIL_DEV_MODE is false", async () => {
    process.env.AUTH_EMAIL_DEV_MODE = "false";
    process.env.NODE_ENV = "production";

    await sendOrderConfirmationEmail(mockPayload);

    expect(consoleLogSpy).toHaveBeenCalled();
    const logs = consoleLogSpy.mock.calls.flat().join("\n");
    expect(logs).toContain("TODO");
    expect(logs).toContain(mockPayload.to);
    expect(logs).toContain(mockPayload.subject);
  });

  it("should not throw when email sending fails", async () => {
    process.env.AUTH_EMAIL_DEV_MODE = "true";

    // Mock console.log to throw an error
    consoleLogSpy.mockImplementation(() => {
      throw new Error("Logging failed");
    });

    // Should not throw despite the error
    await expect(sendOrderConfirmationEmail(mockPayload)).resolves.not.toThrow();

    // Error should be logged
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("should be an async function", () => {
    const result = sendOrderConfirmationEmail(mockPayload);
    expect(result).toBeInstanceOf(Promise);
  });
});
