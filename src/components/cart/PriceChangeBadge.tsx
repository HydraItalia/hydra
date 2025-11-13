import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

type PriceChangeBadgeProps = {
  oldPriceCents: number;
  newPriceCents: number;
  className?: string;
};

/**
 * Badge showing price change delta with up/down arrow
 * - Up arrow (red) when price increased
 * - Down arrow (green) when price decreased
 * - Muted when price unchanged
 */
export function PriceChangeBadge({
  oldPriceCents,
  newPriceCents,
  className,
}: PriceChangeBadgeProps) {
  // Validate price inputs
  if (
    oldPriceCents < 0 ||
    newPriceCents < 0 ||
    !Number.isFinite(oldPriceCents) ||
    !Number.isFinite(newPriceCents)
  ) {
    console.warn("PriceChangeBadge received invalid price values");
    return null;
  }

  const deltaCents = newPriceCents - oldPriceCents;
  const isIncrease = deltaCents > 0;
  const isDecrease = deltaCents < 0;
  const isUnchanged = deltaCents === 0;

  if (isUnchanged) {
    return (
      <div
        aria-label="Price unchanged"
        role="status"
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
          "bg-muted text-muted-foreground",
          className
        )}
      >
        <Minus className="h-3 w-3" />
        <span>No change</span>
      </div>
    );
  }

  return (
    <div
      aria-label={`Price ${isIncrease ? "increased" : "decreased"} by ${formatCurrency(
        Math.abs(deltaCents)
      )}`}
      role="status"
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
        isIncrease &&
          "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
        isDecrease &&
          "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
        className
      )}
    >
      {isIncrease ? (
        <ArrowUp className="h-3 w-3" />
      ) : (
        <ArrowDown className="h-3 w-3" />
      )}
      <span>
        {isIncrease ? "+" : ""}
        {formatCurrency(deltaCents)}
      </span>
    </div>
  );
}
