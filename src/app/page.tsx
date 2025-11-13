import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          {/* Main Hero Content */}
          <div className="text-center space-y-8 mb-20">
            <div className="space-y-6">
              <h1 className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                Hydra
              </h1>
              <p className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">
                Restaurant Procurement,{" "}
                <span className="text-blue-600 dark:text-blue-400">
                  Simplified
                </span>
              </p>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Unite multiple suppliers into one seamless platform. Real-time
                inventory, intelligent ordering, and complete transparency for
                the modern restaurant.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link
                href="/dashboard/catalog"
                className="group relative px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                Browse Catalog
                <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
              <Link
                href="/signin"
                className="px-8 py-4 text-lg font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 border-2 border-blue-600 dark:border-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                Sign In
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
            <div className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-200 dark:border-slate-700 hover:scale-105">
              <div className="text-5xl mb-4">🍴</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                For Restaurants
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                One platform, multiple vendors. Compare prices, check
                availability, and order from all your suppliers in seconds.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Real-time inventory
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Price comparison
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Quick reordering
                </li>
              </ul>
            </div>

            <div className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-200 dark:border-slate-700 hover:scale-105">
              <div className="text-5xl mb-4">🚚</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                For Vendors
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Reach more restaurants with less effort. Manage your catalog,
                update pricing, and fulfill orders all from one dashboard.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Easy inventory sync
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Order management
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Analytics insights
                </li>
              </ul>
            </div>

            <div className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-200 dark:border-slate-700 hover:scale-105">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                For Admins
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Complete control and visibility. Route orders intelligently,
                manage relationships, and optimize the entire supply chain.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Smart routing
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Vendor oversight
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Full transparency
                </li>
              </ul>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-gray-200 dark:border-slate-700 mb-20">
            <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-600 dark:text-blue-400">
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
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
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
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-purple-600 dark:text-purple-400">
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
              className="inline-block px-10 py-4 text-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Start Exploring Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
