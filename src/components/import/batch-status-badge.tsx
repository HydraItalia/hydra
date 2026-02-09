import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  string,
  { variant: "default" | "secondary" | "outline" | "destructive"; className?: string; label?: string }
> = {
  DRAFT: { variant: "secondary" },
  PARSING: { variant: "secondary", label: "Parsing..." },
  PARSED: { variant: "outline" },
  VALIDATING: { variant: "secondary", label: "Validating..." },
  VALIDATED: { variant: "default" },
  COMMITTING: { variant: "secondary", label: "Committing..." },
  COMMITTED: { variant: "default", className: "bg-green-600 hover:bg-green-700" },
  FAILED: { variant: "destructive" },
};

interface BatchStatusBadgeProps {
  status: string;
  className?: string;
}

export function BatchStatusBadge({ status, className }: BatchStatusBadgeProps) {
  const config = statusConfig[status] || { variant: "outline" as const };
  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label || status}
    </Badge>
  );
}
