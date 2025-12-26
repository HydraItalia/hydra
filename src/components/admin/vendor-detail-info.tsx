"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VendorEditDialog } from "./vendor-edit-dialog";
import type { VendorDetail } from "@/data/vendors";
import { formatDate } from "@/lib/utils";

type VendorDetailInfoProps = {
  vendor: VendorDetail;
};

function DetailField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="font-medium">{children}</div>
    </div>
  );
}

export function VendorDetailInfo({ vendor }: VendorDetailInfoProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Vendor Information</CardTitle>
          <VendorEditDialog vendor={vendor} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Name & Region */}
        <div className="space-y-2">
          <DetailField label="Vendor Name">{vendor.name}</DetailField>
          {vendor.region && (
            <DetailField label="Region">
              <Badge variant="outline">{vendor.region}</Badge>
            </DetailField>
          )}
        </div>

        {/* Contact Information */}
        <div className="space-y-2 pt-3 border-t">
          <h4 className="text-sm font-semibold">Contact Information</h4>
          {vendor.contactEmail && (
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <a
                href={`mailto:${vendor.contactEmail}`}
                className="font-medium text-primary hover:underline"
              >
                {vendor.contactEmail}
              </a>
            </div>
          )}
          {vendor.contactPhone && (
            <div>
              <div className="text-sm text-muted-foreground">Phone</div>
              <a
                href={`tel:${vendor.contactPhone}`}
                className="font-medium text-primary hover:underline"
              >
                {vendor.contactPhone}
              </a>
            </div>
          )}
          {!vendor.contactEmail && !vendor.contactPhone && (
            <p className="text-sm text-muted-foreground">
              No contact information
            </p>
          )}
        </div>

        {/* Address & Business Hours */}
        <div className="space-y-2 pt-3 border-t">
          <h4 className="text-sm font-semibold">Location & Hours</h4>
          {vendor.address && (
            <DetailField label="Address">{vendor.address}</DetailField>
          )}
          {vendor.businessHours && (
            <DetailField label="Business Hours">
              {vendor.businessHours}
            </DetailField>
          )}
          {!vendor.address && !vendor.businessHours && (
            <p className="text-sm text-muted-foreground">
              No location or hours information
            </p>
          )}
        </div>

        {/* Statistics */}
        <div className="space-y-2 pt-3 border-t">
          <h4 className="text-sm font-semibold">Statistics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">
                Total Products
              </div>
              <div className="text-lg font-medium">
                {vendor.stats.totalProducts}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                Active Products
              </div>
              <div className="text-lg font-medium">
                {vendor.stats.activeProducts}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Low Stock</div>
              <div className="text-lg font-medium text-orange-600">
                {vendor.stats.lowStockProducts}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Agreements</div>
              <div className="text-lg font-medium">
                {vendor.stats.agreementCount}
              </div>
            </div>
          </div>
        </div>

        {/* Vendor User Account */}
        {vendor.user && (
          <div className="space-y-2 pt-3 border-t">
            <h4 className="text-sm font-semibold">Vendor User Account</h4>
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <a
                href={`mailto:${vendor.user.email}`}
                className="font-medium text-primary hover:underline"
              >
                {vendor.user.email}
              </a>
            </div>
            {vendor.user.name && (
              <DetailField label="Name">{vendor.user.name}</DetailField>
            )}
          </div>
        )}

        {/* Created */}
        <div className="pt-3 border-t">
          <DetailField label="Vendor Since">
            {formatDate(vendor.createdAt)}
          </DetailField>
        </div>

        {/* Notes */}
        {vendor.notes && (
          <div className="pt-3 border-t">
            <div className="text-sm text-muted-foreground mb-1">Notes</div>
            <div className="text-sm whitespace-pre-wrap">{vendor.notes}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
