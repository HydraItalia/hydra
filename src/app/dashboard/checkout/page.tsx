import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getCart } from "@/data/cart";
import { CheckoutPage } from "./checkout-page";

export default async function Checkout() {
  // 1. Check authentication and role
  const user = await currentUser();

  if (!user) {
    redirect("/signin?callbackUrl=/dashboard/checkout");
  }

  if (user.role !== "CLIENT" || !user.clientId) {
    redirect("/dashboard");
  }

  // 2. Load cart
  const cart = await getCart();

  // 3. Check if cart has items
  if (!cart || cart.CartItem.length === 0) {
    redirect("/dashboard/cart");
  }

  return <CheckoutPage cart={cart} />;
}
