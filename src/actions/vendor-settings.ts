"use server";

/**
 * Phase 6.4 - Vendor Settings Server Actions
 *
 * Server actions for vendors to view and update their business profile and settings.
 */

import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Vendor settings type (read-only, includes Stripe Connect fields)
export type VendorSettings = {
  name: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  businessHours?: string | null;
  defaultOrderNotes?: string | null;
  // Stripe Connect (Phase 11) - read-only fields
  stripeAccountId?: string | null;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
};

// Input type for updating vendor settings (excludes read-only Stripe fields)
export type VendorSettingsInput = {
  name: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  businessHours?: string | null;
  defaultOrderNotes?: string | null;
};

// Result type for server actions
type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Simple email validation regex
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get vendor settings for the current logged-in vendor
 */
export async function getVendorSettings(): Promise<
  ActionResult<VendorSettings>
> {
  try {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (user.role !== "VENDOR") {
      return { success: false, error: "Unauthorized: Vendor access required" };
    }

    if (!user.vendorId) {
      return {
        success: false,
        error: "No vendor associated with this account",
      };
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: user.vendorId },
      select: {
        name: true,
        contactEmail: true,
        contactPhone: true,
        address: true,
        businessHours: true,
        defaultOrderNotes: true,
        stripeAccountId: true,
        chargesEnabled: true,
        payoutsEnabled: true,
      },
    });

    if (!vendor) {
      return { success: false, error: "Vendor not found" };
    }

    return { success: true, data: vendor };
  } catch (error) {
    console.error("Error fetching vendor settings:", error);
    return {
      success: false,
      error: "Failed to fetch vendor settings",
    };
  }
}

/**
 * Update vendor settings for the current logged-in vendor
 */
export async function updateVendorSettings(
  input: VendorSettingsInput
): Promise<ActionResult<VendorSettings>> {
  try {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (user.role !== "VENDOR") {
      return { success: false, error: "Unauthorized: Vendor access required" };
    }

    if (!user.vendorId) {
      return {
        success: false,
        error: "No vendor associated with this account",
      };
    }

    // Validate business name (required)
    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: "Business name is required" };
    }

    if (input.name.trim().length > 200) {
      return {
        success: false,
        error: "Business name must be 200 characters or less",
      };
    }

    // Validate contact email (if provided)
    if (input.contactEmail && input.contactEmail.trim().length > 0) {
      if (!isValidEmail(input.contactEmail.trim())) {
        return { success: false, error: "Invalid email address" };
      }
    }

    // Validate contact phone (if provided)
    if (input.contactPhone && input.contactPhone.trim().length > 50) {
      return {
        success: false,
        error: "Phone number must be 50 characters or less",
      };
    }

    // Validate address (if provided)
    if (input.address && input.address.trim().length > 500) {
      return {
        success: false,
        error: "Address must be 500 characters or less",
      };
    }

    // Validate business hours (if provided)
    if (input.businessHours && input.businessHours.trim().length > 200) {
      return {
        success: false,
        error: "Business hours must be 200 characters or less",
      };
    }

    // Validate default order notes (if provided)
    if (
      input.defaultOrderNotes &&
      input.defaultOrderNotes.trim().length > 1000
    ) {
      return {
        success: false,
        error: "Default order notes must be 1000 characters or less",
      };
    }

    // Update vendor record - ONLY for this vendor's ID
    const updatedVendor = await prisma.vendor.update({
      where: { id: user.vendorId },
      data: {
        name: input.name.trim(),
        contactEmail: input.contactEmail?.trim() || null,
        contactPhone: input.contactPhone?.trim() || null,
        address: input.address?.trim() || null,
        businessHours: input.businessHours?.trim() || null,
        defaultOrderNotes: input.defaultOrderNotes?.trim() || null,
      },
      select: {
        name: true,
        contactEmail: true,
        contactPhone: true,
        address: true,
        businessHours: true,
        defaultOrderNotes: true,
      },
    });

    // Revalidate paths
    revalidatePath("/dashboard/vendor/settings");
    revalidatePath("/dashboard");

    return { success: true, data: updatedVendor };
  } catch (error) {
    console.error("Error updating vendor settings:", error);
    return {
      success: false,
      error: "Failed to update vendor settings",
    };
  }
}
