"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/ascendra-ui/components/ui/input-group";
import { useDataTableContext } from "@/ascendra-ui/providers/data-table/data-table.provider";
import { cn } from "@/ascendra-ui/shadcn";
import { useRef, useState } from "react";
import { LuSearch, LuX } from "react-icons/lu";
import { VscSearchFuzzy } from "react-icons/vsc";

export function DataTableSearchInput() {
  const { searchTerm, setSearchTerm, fuzzy, setFuzzy } = useDataTableContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchHovered, setSearchHovered] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <InputGroup
      className="max-w-xs"
      onMouseEnter={() => setSearchHovered(true)}
      onMouseLeave={() => setSearchHovered(false)}
    >
      <InputGroupAddon>
        <InputGroupButton
          className="text-muted-foreground"
          onClick={() => {
            setFuzzy(!fuzzy);
            inputRef.current?.focus();
          }}
        >
          {fuzzy ? (
            <VscSearchFuzzy className="size-3.5 rotate-y-180" />
          ) : (
            <LuSearch className="size-3.5" />
          )}
        </InputGroupButton>
      </InputGroupAddon>
      <InputGroupInput
        ref={inputRef}
        placeholder="Search..."
        className="w-65"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setSearchFocused(true)}
        onBlur={() => setSearchFocused(false)}
      />
      <InputGroupAddon
        align="inline-end"
        className={cn(
          "transition-opacity",
          searchTerm && searchHovered && !searchFocused
            ? "opacity-100"
            : "pointer-events-none opacity-0",
        )}
      >
        <InputGroupButton onClick={() => setSearchTerm("")}>
          <LuX className="text-muted-foreground size-3.5" />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
