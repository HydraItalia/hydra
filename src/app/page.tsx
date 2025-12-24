import Link from "next/link";
import Image from "next/image";
import { FeatureCard } from "@/components/home/feature-card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-600 to-gray-300 dark:from-black dark:via-gray-800 dark:to-gray-700">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-gray-400/20 dark:bg-gray-600/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-gray-500/20 dark:bg-gray-700/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          {/* Main Hero Content */}
          <div className="text-center space-y-8 mb-20">
            <div className="flex justify-center px-4">
              <Image
                src="/hydra-logo.png"
                alt="Hydra - Restaurant Procurement, Simplified"
                width={700}
                height={450}
                priority
                className="w-full max-w-4xl h-auto"
              />
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              {process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true" ? (
                <Link
                  href="/demo-signin"
                  className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-red-500 to-rose-500 rounded-xl hover:from-red-600 hover:to-rose-600 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Try Demo Mode
                </Link>
              ) : (
                <Link
                  href="/signin"
                  aria-label="Sign in to your account"
                  className="px-8 py-4 text-lg font-semibold text-red-600 dark:text-red-400 bg-white dark:bg-slate-800 border-2 border-red-600 dark:border-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-slate-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Sign In
                </Link>
              )}
              <Link
                href="/signin"
                aria-label="Explore catalog"
                className="group relative px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-xl hover:from-red-700 hover:to-rose-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                Explore Catalog
                <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {[
              { label: "Vendors", value: "20+", icon: "🏪" },
              { label: "Products", value: "10K+", icon: "📦" },
              { label: "Restaurants", value: "150+", icon: "🍽️" },
              { label: "Orders/Month", value: "5K+", icon: "📈" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg border border-gray-200 dark:border-slate-700"
              >
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <FeatureCard
              icon="🍴"
              title="For Restaurants"
              description="One platform, multiple vendors. Compare prices, check availability, and order from all your suppliers in seconds."
              features={[
                "Real-time inventory",
                "Price comparison",
                "Quick reordering",
              ]}
            />

            <FeatureCard
              icon="🚚"
              title="For Vendors"
              description="Reach more restaurants with less effort. Manage your catalog, update pricing, and fulfill orders all from one dashboard."
              features={[
                "Easy inventory sync",
                "Order management",
                "Analytics insights",
              ]}
            />

            <FeatureCard
              icon="⚡"
              title="For Admins"
              description="Complete control and visibility. Route orders intelligently, manage relationships, and optimize the entire supply chain."
              features={[
                "Smart routing",
                "Vendor oversight",
                "Full transparency",
              ]}
            />
          </div>

          {/* How It Works */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-gray-200 dark:border-slate-700 mb-20">
            <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-red-600 dark:text-red-400">
                  1
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Browse & Compare
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Search across all connected vendors. See real-time prices,
                  stock levels, and product details.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-rose-600 dark:text-rose-400">
                  2
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Order Seamlessly
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Add items to your cart from multiple vendors and checkout in
                  one smooth transaction.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-pink-600 dark:text-pink-400">
                  3
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Track & Receive
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Monitor order status, coordinate deliveries, and manage
                  everything from your dashboard.
                </p>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="text-center">
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              Serving the HORECA sector across Sardegna and beyond
            </p>
            <Link
              href="/dashboard/catalog"
              className="inline-block px-10 py-4 text-xl font-bold text-white bg-gradient-to-r from-red-600 to-pink-600 rounded-xl hover:from-red-700 hover:to-pink-700 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Start Exploring Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
