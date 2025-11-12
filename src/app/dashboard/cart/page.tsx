import { Suspense } from "react"
import { requireRole } from "@/lib/auth"
import { getCart } from "@/data/cart"
import { CartPage } from "./cart-page"
import { CartPageSkeleton } from "./cart-page-skeleton"

export const metadata = {
  title: "Shopping Cart | Hydra",
  description: "View and manage your shopping cart",
}

async function CartData() {
  await requireRole("CLIENT")
  const cart = await getCart()

  return <CartPage cart={cart} />
}

export default async function Page() {
  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<CartPageSkeleton />}>
        <CartData />
      </Suspense>
    </div>
  )
}
