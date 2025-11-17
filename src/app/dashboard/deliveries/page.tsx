import { currentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getMyDeliveries, getDeliveryStats } from "@/data/deliveries"
import { DeliveryList } from "@/components/deliveries/delivery-list"
import { DeliveryStats } from "@/components/deliveries/delivery-stats"
import { PageHeader } from "@/components/shared/page-header"

export default async function DeliveriesPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; status?: string }>
}) {
  const user = await currentUser()

  if (!user) {
    redirect("/signin?callbackUrl=/dashboard/deliveries")
  }

  if (user.role !== "DRIVER") {
    redirect("/dashboard")
  }

  if (!user.driverId) {
    return (
      <div className="p-8">
        <PageHeader
          title="My Deliveries"
          subtitle="Error: User is not associated with a driver account"
        />
      </div>
    )
  }

  const params = await searchParams
  const page = Number(params?.page) || 1
  const status = params?.status as any

  const [deliveries, stats] = await Promise.all([
    getMyDeliveries({ page, pageSize: 20, status }),
    getDeliveryStats(),
  ])

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="My Deliveries"
        subtitle="Manage your assigned deliveries and update their status"
      />

      <DeliveryStats stats={stats} />

      <DeliveryList deliveries={deliveries} currentPage={page} />
    </div>
  )
}
