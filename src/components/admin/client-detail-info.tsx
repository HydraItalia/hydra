"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientEditDialog } from "./client-edit-dialog";
import type { ClientDetail } from "@/data/clients";
import { formatDate } from "@/lib/utils";

type ClientDetailInfoProps = {
  client: ClientDetail;
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

export function ClientDetailInfo({ client }: ClientDetailInfoProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Client Information</CardTitle>
          <ClientEditDialog client={client} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Name & Region */}
        <div className="space-y-2">
          <DetailField label="Client Name">{client.name}</DetailField>
          {client.region && (
            <div>
              <div className="text-sm text-muted-foreground">Region</div>
              <Badge variant="outline">{client.region}</Badge>
            </div>
          )}
        </div>

        {/* Contact Information */}
        <div className="space-y-2 pt-3 border-t">
          <h4 className="text-sm font-semibold">Contact Information</h4>
          {client.contactPerson && (
            <DetailField label="Contact Person">
              {client.contactPerson}
            </DetailField>
          )}
          {client.email && (
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <a
                href={`mailto:${client.email}`}
                className="font-medium text-primary hover:underline"
              >
                {client.email}
              </a>
            </div>
          )}
          {client.phone && (
            <div>
              <div className="text-sm text-muted-foreground">Phone</div>
              <a
                href={`tel:${client.phone}`}
                className="font-medium text-primary hover:underline"
              >
                {client.phone}
              </a>
            </div>
          )}
          {client.taxId && <DetailField label="Tax ID">{client.taxId}</DetailField>}
          {!client.contactPerson &&
            !client.email &&
            !client.phone &&
            !client.taxId && (
              <p className="text-sm text-muted-foreground">
                No contact information
              </p>
            )}
        </div>

        {/* Address Information */}
        <div className="space-y-2 pt-3 border-t">
          <h4 className="text-sm font-semibold">Address Information</h4>
          {client.fullAddress && (
            <DetailField label="Full Address">{client.fullAddress}</DetailField>
          )}
          {client.deliveryAddress && (
            <DetailField label="Delivery Address">
              {client.deliveryAddress}
            </DetailField>
          )}
          {client.shortAddress && (
            <DetailField label="Short Address">{client.shortAddress}</DetailField>
          )}
          {client.deliveryLat != null && client.deliveryLng != null && (
            <div>
              <div className="text-sm text-muted-foreground">Coordinates</div>
              <div className="font-medium text-xs">
                {client.deliveryLat.toFixed(6)}, {client.deliveryLng.toFixed(6)}
              </div>
            </div>
          )}
          {!client.fullAddress &&
            !client.deliveryAddress &&
            !client.shortAddress &&
            client.deliveryLat == null &&
            client.deliveryLng == null && (
              <p className="text-sm text-muted-foreground">
                No address information
              </p>
            )}
        </div>

        {/* Statistics */}
        {client.stats && (
          <div className="space-y-2 pt-3 border-t">
            <h4 className="text-sm font-semibold">Statistics</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Visits</div>
                <div className="text-lg font-medium">
                  {client.stats.totalVisits}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Agreements</div>
                <div className="text-lg font-medium">
                  {client.stats.agreementCount}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Orders</div>
                <div className="text-lg font-medium">
                  {client.stats.orderCount}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Last Visit & Created */}
        <div className="space-y-2 pt-3 border-t">
          <DetailField label="Last Visit">
            {client.lastVisitAt ? formatDate(client.lastVisitAt) : "Never"}
          </DetailField>
          <DetailField label="Client Since">
            {formatDate(client.createdAt)}
          </DetailField>
        </div>

        {/* Notes */}
        {client.notes && (
          <div className="pt-3 border-t">
            <div className="text-sm text-muted-foreground mb-1">Notes</div>
            <div className="text-sm whitespace-pre-wrap">{client.notes}</div>
          </div>
        )}

        {/* UI Settings */}
        {(client.hidden || client.pinColor) && (
          <div className="pt-3 border-t">
            <h4 className="text-sm font-semibold mb-2">UI Settings</h4>
            <div className="flex gap-2">
              {client.hidden && <Badge variant="secondary">Hidden on Map</Badge>}
              {client.pinColor && (
                <Badge variant="outline">
                  Pin Color:{" "}
                  <span
                    className="inline-block w-3 h-3 rounded-full ml-1"
                    style={{ backgroundColor: client.pinColor }}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Integration Info */}
        {(client.externalId || client.freezco || client.mandanti) && (
          <div className="space-y-2 pt-3 border-t">
            <h4 className="text-sm font-semibold">Integration Info</h4>
            {client.externalId && (
              <div>
                <div className="text-sm text-muted-foreground">
                  External ID (Gentmo)
                </div>
                <div className="font-medium text-xs">{client.externalId}</div>
              </div>
            )}
            {client.freezco && (
              <Badge variant="secondary">Freezco Client</Badge>
            )}
            {client.mandanti && (
              <div>
                <div className="text-sm text-muted-foreground">Mandanti</div>
                <div className="font-medium">{client.mandanti}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
