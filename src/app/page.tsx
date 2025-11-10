import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-3xl w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100">
            Hydra
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-300">
            Restaurant Supply Procurement Platform
          </p>
        </div>

        <div className="space-y-6 bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8">
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Streamline your restaurant procurement with Hydra. Browse inventory from multiple vendors,
            manage agreements, and place orders all in one place.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="p-4 border dark:border-slate-700 rounded-lg">
              <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">For Restaurants</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Browse aggregated inventory, see real-time stock and pricing, and place orders effortlessly.
              </p>
            </div>

            <div className="p-4 border dark:border-slate-700 rounded-lg">
              <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">For Vendors</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage your inventory, update prices and stock levels, and fulfill orders efficiently.
              </p>
            </div>

            <div className="p-4 border dark:border-slate-700 rounded-lg">
              <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">For Admins</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Route orders, manage vendor relationships, and oversee the entire procurement process.
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Link
              href="/signin"
              className="inline-block px-8 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Serving the HORECA sector across Sardegna and beyond
        </p>
      </div>
    </div>
  )
}
