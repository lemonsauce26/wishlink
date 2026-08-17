"use client";

import { SearchBar } from "@/components/ui/search-bar";

export function ExploreSearchBar({ defaultValue }: { defaultValue?: string }) {
  return (
    <SearchBar
      actionPath="/explore"
      placeholder="Search people or wishlists..."
      defaultValue={defaultValue}
    />
  );
}
