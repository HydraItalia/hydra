import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { TemplateList } from "@/components/import/template-list";

export default async function TemplatesPage() {
  const user = await currentUser();

  if (!user) redirect("/signin");
  if (user.role !== "VENDOR") {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Unauthorized"
          subtitle="You must be a vendor to access this page"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Templates"
        subtitle="Manage saved column mapping templates."
        action={
          <Button variant="outline" asChild>
            <Link href="/dashboard/vendor/import">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Imports
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <TemplateList />
        </CardContent>
      </Card>
    </div>
  );
}
