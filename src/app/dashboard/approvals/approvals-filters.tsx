"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "ONBOARDING", label: "Onboarding" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "ALL", label: "All" },
];

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "VENDOR", label: "Vendor" },
  { value: "CLIENT", label: "Client" },
  { value: "DRIVER", label: "Driver" },
  { value: "AGENT", label: "Agent" },
];

export function ApprovalsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "PENDING";
  const currentRole = searchParams.get("role") || "";
  const currentSearch = searchParams.get("search") || "";

  const [searchQuery, setSearchQuery] = useState(currentSearch);
  const isUserTyping = useRef(false);

  // Debounced search
  useEffect(() => {
    if (!isUserTyping.current) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery) {
        params.set("search", searchQuery);
      } else {
        params.delete("search");
      }
      params.delete("page");
      router.push(`/dashboard/approvals?${params.toString()}`);
      isUserTyping.current = false;
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, router, searchParams]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/dashboard/approvals?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    router.push("/dashboard/approvals");
  };

  const hasFilters =
    currentStatus !== "PENDING" || currentRole || currentSearch;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => {
            isUserTyping.current = true;
            setSearchQuery(e.target.value);
          }}
          className="pl-8"
        />
      </div>
      <div className="flex gap-2">
        <select
          value={currentStatus}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={currentRole}
          onChange={(e) => updateFilter("role", e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
