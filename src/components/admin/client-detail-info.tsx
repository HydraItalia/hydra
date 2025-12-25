"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientEditDialog } from "./client-edit-dialog";
import type { ClientDetail } from "@/data/clients";
import { formatDate } from "@/lib/utils";

type ClientDetailInfoProps = {
  client: ClientDetail;
};

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
          <div>
            <div className="text-sm text-muted-foreground">Client Name</div>
            <div className="font-medium">{client.name}</div>
          </div>
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
            <div>
              <div className="text-sm text-muted-foreground">
                Contact Person
              </div>
              <div className="font-medium">{client.contactPerson}</div>
            </div>
          )}
          {client.email && (
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium">{client.email}</div>
            </div>
          )}
          {client.phone && (
            <div>
              <div className="text-sm text-muted-foreground">Phone</div>
              <div className="font-medium">{client.phone}</div>
            </div>
          )}
          {client.taxId && (
            <div>
              <div className="text-sm text-muted-foreground">Tax ID</div>
              <div className="font-medium">{client.taxId}</div>
            </div>
          )}
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
            <div>
              <div className="text-sm text-muted-foreground">Full Address</div>
              <div className="font-medium">{client.fullAddress}</div>
            </div>
          )}
          {client.deliveryAddress && (
            <div>
              <div className="text-sm text-muted-foreground">
                Delivery Address
              </div>
              <div className="font-medium">{client.deliveryAddress}</div>
            </div>
          )}
          {client.shortAddress && (
            <div>
              <div className="text-sm text-muted-foreground">Short Address</div>
              <div className="font-medium">{client.shortAddress}</div>
            </div>
          )}
          {client.deliveryLat && client.deliveryLng && (
            <div>
              <div className="text-sm text-muted-foreground">Coordinates</div>
              <div className="font-medium text-xs">
                {client.deliveryLat.toFixed(6)}, {client.deliveryLng.toFixed(6)}
              </div>
            </div>
          )}
          {!client.fullAddress &&
            !client.deliveryAddress &&
            !client.shortAddress && (
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
          <div>
            <div className="text-sm text-muted-foreground">Last Visit</div>
            <div className="font-medium">
              {client.lastVisitAt ? formatDate(client.lastVisitAt) : "Never"}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Client Since</div>
            <div className="font-medium">{formatDate(client.createdAt)}</div>
          </div>
        </div>

        {/* Notes */}
        {client.notes && (
          <div className="pt-3 border-t">
            <div className="text-sm text-muted-foreground mb-1">Notes</div>
            <div className="text-sm whitespace-pre-wrap">{client.notes}</div>
          </div>
        )}

        {/* UI Settings */}
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
