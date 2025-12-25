"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { X, Search } from "lucide-react";

type ClientsFiltersProps = {
  regions: string[];
  agents: Array<{ id: string; name: string | null; agentCode: string | null }>;
};

export function ClientsFilters({ regions, agents }: ClientsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isUserTyping = useRef(false);

  // Filter states
  const [regionFilter, setRegionFilter] = useState(
    searchParams.get("region") || "all"
  );
  const [agreementFilter, setAgreementFilter] = useState(
    searchParams.get("hasAgreement") || "all"
  );
  const [agentFilter, setAgentFilter] = useState(
    searchParams.get("agent") || "all"
  );
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );

  // Sync state with URL changes (e.g., browser back/forward)
  useEffect(() => {
    setRegionFilter(searchParams.get("region") || "all");
    setAgreementFilter(searchParams.get("hasAgreement") || "all");
    setAgentFilter(searchParams.get("agent") || "all");
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  // Debounced search
  useEffect(() => {
    if (!isUserTyping.current) {
      return;
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (searchQuery && searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      } else {
        params.delete("search");
      }

      // Reset to page 1 when search changes
      params.delete("page");

      router.push(`/dashboard/clients?${params.toString()}`);
      isUserTyping.current = false;
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, router, searchParams]);

  const handleRegionChange = useCallback(
    (value: string) => {
      setRegionFilter(value);
      const params = new URLSearchParams(searchParams);

      if (value && value !== "all") {
        params.set("region", value);
      } else {
        params.delete("region");
      }

      // Reset to page 1
      params.delete("page");

      router.push(`/dashboard/clients?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleAgreementChange = useCallback(
    (value: string) => {
      setAgreementFilter(value);
      const params = new URLSearchParams(searchParams);

      if (value && value !== "all") {
        params.set("hasAgreement", value);
      } else {
        params.delete("hasAgreement");
      }

      // Reset to page 1
      params.delete("page");

      router.push(`/dashboard/clients?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleAgentChange = useCallback(
    (value: string) => {
      setAgentFilter(value);
      const params = new URLSearchParams(searchParams);

      if (value && value !== "all") {
        params.set("agent", value);
      } else {
        params.delete("agent");
      }

      // Reset to page 1
      params.delete("page");

      router.push(`/dashboard/clients?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = useCallback(() => {
    setRegionFilter("all");
    setAgreementFilter("all");
    setAgentFilter("all");
    setSearchQuery("");
    router.push("/dashboard/clients");
  }, [router]);

  const hasActiveFilters =
    regionFilter !== "all" ||
    agreementFilter !== "all" ||
    agentFilter !== "all" ||
    searchQuery.trim() !== "";

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients by name..."
          value={searchQuery}
          onChange={(e) => {
            isUserTyping.current = true;
            setSearchQuery(e.target.value);
          }}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => {
              isUserTyping.current = true;
              setSearchQuery("");
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Region Filter */}
        <div>
          <label htmlFor="region-filter" className="text-sm font-medium mb-2 block">Region</label>
          <Select value={regionFilter} onValueChange={handleRegionChange}>
            <SelectTrigger id="region-filter">
              <SelectValue placeholder="All regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All regions</SelectItem>
              {regions.map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Agreement Filter */}
        <div>
          <label htmlFor="agreement-filter" className="text-sm font-medium mb-2 block">Agreement</label>
          <Select value={agreementFilter} onValueChange={handleAgreementChange}>
            <SelectTrigger id="agreement-filter">
              <SelectValue placeholder="All clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clients</SelectItem>
              <SelectItem value="true">Has agreement</SelectItem>
              <SelectItem value="false">No agreement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Agent Filter */}
        <div>
          <label htmlFor="agent-filter" className="text-sm font-medium mb-2 block">
            Assigned Agent
          </label>
          <Select value={agentFilter} onValueChange={handleAgentChange}>
            <SelectTrigger id="agent-filter">
              <SelectValue placeholder="All agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agents</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.agentCode || agent.name || "Unknown"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
}
