import { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { currentUser } from "@/lib/auth";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { CartSheet } from "@/components/cart/cart-sheet";
import { CartProvider } from "@/components/cart/cart-provider";
import { DemoModeBanner } from "@/components/auth/demo-mode-banner";
import { getCart } from "@/data/cart";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/signin");
  }

  // Defense-in-depth: middleware handles this, but double-check status
  if (!user.status || user.status !== "APPROVED") {
    redirect(user.status === "PENDING" ? "/pending" : "/onboarding");
  }

  // Fetch cart for CLIENT users
  let initialCart: Awaited<ReturnType<typeof getCart>> | undefined;
  if (user.role === "CLIENT" && user.clientId) {
    try {
      initialCart = await getCart();
    } catch (error) {
      // Cart fetch failed, but don't block the layout
      console.error("Failed to fetch cart:", error);
    }
  }

  return (
    <CartProvider initialCart={initialCart}>
      <div className="min-h-screen bg-background">
        {/* Demo Mode Banner */}
        <DemoModeBanner />

        {/* Top Bar */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-24 items-center px-4 md:px-6">
            <MobileNav role={user.role} />

            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="flex items-center gap-2">
                <Image
                  src="/hydra-icon.png"
                  alt="Hydra"
                  width={96}
                  height={96}
                  className="h-20 w-20"
                />
              </Link>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              {user.role === "CLIENT" && user.clientId && <CartSheet />}
              <UserMenu />
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Desktop Sidebar */}
          <aside className="hidden md:flex w-64 flex-col border-r bg-background">
            <div className="flex-1 overflow-y-auto p-6">
              <SidebarNav role={user.role} />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="container py-6 md:py-8">{children}</div>
          </main>
        </div>
      </div>
    </CartProvider>
  );
}
