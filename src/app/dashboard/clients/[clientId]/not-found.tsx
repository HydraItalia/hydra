import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-bold mb-2">Client Not Found</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        This client doesn't exist or has been archived. It may have been deleted
        or you don't have permission to view it.
      </p>
      <Button asChild>
        <Link href="/dashboard/clients">Back to Clients</Link>
      </Button>
    </div>
  );
}
