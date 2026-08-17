"use client";

import { SearchBar } from "@/components/ui/search-bar";

export function ItemSearchBar({ defaultValue }: { defaultValue?: string }) {
  return (
    <SearchBar
      actionPath="/wishlists"
      placeholder="Search your items..."
      defaultValue={defaultValue}
    />
  );
}
