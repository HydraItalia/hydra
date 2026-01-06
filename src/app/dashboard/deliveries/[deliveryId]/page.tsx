import { currentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getDeliveryById } from "@/data/deliveries";
import { DeliveryDetail } from "@/components/deliveries/delivery-detail";
import { PageHeader } from "@/components/shared/page-header";

export default async function DeliveryDetailPage({
  params,
}: {
  params: Promise<{ deliveryId: string }>;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/signin");
  }

  if (user.role !== "DRIVER") {
    redirect("/dashboard");
  }

  if (!user.driverId) {
    return (
      <div className="p-8">
        <PageHeader
          title="Delivery Details"
          subtitle="Error: User is not associated with a driver account"
        />
      </div>
    );
  }

  const { deliveryId } = await params;

  let delivery;
  try {
    delivery = await getDeliveryById(deliveryId);
  } catch (error) {
    console.error("Failed to fetch delivery:", error);
    notFound();
  }

  if (!delivery) {
    notFound();
  }

  // Verify the delivery belongs to this driver
  if (delivery.driverId !== user.driverId) {
    console.warn(
      `Driver ${user.driverId} attempted to access delivery ${deliveryId} assigned to driver ${delivery.driverId}`
    );
    redirect("/dashboard"); // Better UX than 404 - gives driver a clear path forward
  }

  // Get order number from either Order or SubOrder
  const orderNumber = delivery.SubOrder
    ? delivery.SubOrder.subOrderNumber
    : delivery.Order?.orderNumber || "N/A";

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title={`Delivery ${orderNumber}`}
        subtitle={`Status: ${delivery.status.replace(/_/g, " ")}`}
      />

      <DeliveryDetail delivery={delivery} />
    </div>
  );
}
