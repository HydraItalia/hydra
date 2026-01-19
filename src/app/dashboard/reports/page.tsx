import { requireRole } from "@/lib/auth";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Receipt, TrendingUp, Users, Package } from "lucide-react";

const reports = [
  {
    title: "Fee Report",
    description:
      "View platform fees for paid sub-orders by vendor and date range. Export to CSV.",
    href: "/dashboard/reports/fee-report",
    icon: Receipt,
    available: true,
  },
  {
    title: "Sales Report",
    description:
      "Analyze sales trends, revenue by period, and top-selling products.",
    href: "/dashboard/reports/sales",
    icon: TrendingUp,
    available: false,
  },
  {
    title: "Vendor Performance",
    description:
      "Track vendor fulfillment rates, delivery times, and order volumes.",
    href: "/dashboard/reports/vendor-performance",
    icon: Users,
    available: false,
  },
  {
    title: "Inventory Report",
    description:
      "Monitor stock levels, low inventory alerts, and product turnover.",
    href: "/dashboard/reports/inventory",
    icon: Package,
    available: false,
  },
];

export default async function ReportsPage() {
  await requireRole("ADMIN");

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Access business reports and analytics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card
            key={report.href}
            className={!report.available ? "opacity-60" : undefined}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <report.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{report.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {report.description}
              </CardDescription>
              {report.available ? (
                <Link
                  href={report.href}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View Report →
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Coming Soon
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
