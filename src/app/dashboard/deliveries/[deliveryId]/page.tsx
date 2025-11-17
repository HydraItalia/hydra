import { currentUser } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { getDeliveryById } from "@/data/deliveries"
import { DeliveryDetail } from "@/components/deliveries/delivery-detail"
import { PageHeader } from "@/components/shared/page-header"

export default async function DeliveryDetailPage({
  params,
}: {
  params: Promise<{ deliveryId: string }>
}) {
  const user = await currentUser()

  if (!user) {
    redirect("/signin")
  }

  if (user.role !== "DRIVER") {
    redirect("/dashboard")
  }

  if (!user.driverId) {
    return (
      <div className="p-8">
        <PageHeader
          title="Delivery Details"
          subtitle="Error: User is not associated with a driver account"
        />
      </div>
    )
  }

  const { deliveryId } = await params

  let delivery
  try {
    delivery = await getDeliveryById(deliveryId)
  } catch (error) {
    notFound()
  }

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title={`Delivery ${delivery.order.orderNumber}`}
        subtitle={`Status: ${delivery.status.replace(/_/g, " ")}`}
      />

      <DeliveryDetail delivery={delivery} />
    </div>
  )
}
