"use client";

import { useState } from "react";
import { VendorSettings, updateVendorSettings } from "@/actions/vendor-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save } from "lucide-react";

interface VendorSettingsFormProps {
  initialData: VendorSettings;
}

export function VendorSettingsForm({ initialData }: VendorSettingsFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState<VendorSettings>(initialData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const result = await updateVendorSettings(formData);

      if (result.success) {
        toast.success("Settings updated successfully");
        // Update form data with the response to ensure sync
        if (result.data) {
          setFormData(result.data);
        }
      } else {
        toast.error(result.error || "Failed to update settings");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Settings update error:", error);
    } finally {
      setIsPending(false);
    }
  };

  const handleInputChange = (
    field: keyof VendorSettings,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Business Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="required">
          Business Name
        </Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          placeholder="Your business name"
          required
          disabled={isPending}
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground">
          This name will be displayed to clients and in order communications
        </p>
      </div>

      {/* Contact Email */}
      <div className="space-y-2">
        <Label htmlFor="contactEmail">Contact Email</Label>
        <Input
          id="contactEmail"
          type="email"
          value={formData.contactEmail || ""}
          onChange={(e) => handleInputChange("contactEmail", e.target.value)}
          placeholder="contact@yourbusiness.com"
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Primary email for business communications
        </p>
      </div>

      {/* Contact Phone */}
      <div className="space-y-2">
        <Label htmlFor="contactPhone">Contact Phone</Label>
        <Input
          id="contactPhone"
          type="tel"
          value={formData.contactPhone || ""}
          onChange={(e) => handleInputChange("contactPhone", e.target.value)}
          placeholder="+39 123 456 7890"
          disabled={isPending}
          maxLength={50}
        />
        <p className="text-xs text-muted-foreground">
          Phone number for urgent order matters
        </p>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">Business Address</Label>
        <Textarea
          id="address"
          value={formData.address || ""}
          onChange={(e) => handleInputChange("address", e.target.value)}
          placeholder="Via Example 123, 00100 Rome, Italy"
          disabled={isPending}
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">
          Your business location for deliveries and correspondence
        </p>
      </div>

      {/* Business Hours */}
      <div className="space-y-2">
        <Label htmlFor="businessHours">Business Hours</Label>
        <Input
          id="businessHours"
          type="text"
          value={formData.businessHours || ""}
          onChange={(e) => handleInputChange("businessHours", e.target.value)}
          placeholder="Mon-Fri 9:00-18:00"
          disabled={isPending}
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground">
          Operating hours displayed to clients and drivers
        </p>
      </div>

      {/* Default Order Notes */}
      <div className="space-y-2">
        <Label htmlFor="defaultOrderNotes">Default Order Notes</Label>
        <Textarea
          id="defaultOrderNotes"
          value={formData.defaultOrderNotes || ""}
          onChange={(e) =>
            handleInputChange("defaultOrderNotes", e.target.value)
          }
          placeholder="Special delivery instructions, minimum order requirements, etc."
          disabled={isPending}
          rows={4}
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground">
          These notes will appear to clients and drivers on your orders
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={isPending} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
