"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/ascendra-ui/components/ui/input-group";
import { useDataTableContext } from "@/ascendra-ui/providers/data-table/data-table.provider";
import { cn } from "@/ascendra-ui/shadcn";
import { useRef } from "react";
import { LuSearch, LuX } from "react-icons/lu";
import { VscSearchFuzzy } from "react-icons/vsc";

export function DataTableSearchInput() {
  const { searchTerm, setSearchTerm, fuzzy, setFuzzy } = useDataTableContext();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    // Below md it fills the bar's row up to the buttons after it; from md up it keeps a fixed width (max-w-xs), still
    // shrinking if the row is too narrow for it.
    <InputGroup className="md:max-w-xs">
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
        autoComplete="off"
        // Narrower below sm, so the search and the bar's buttons fit a phone's width on one row.
        className="w-40 sm:w-65"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <InputGroupAddon
        align="inline-end"
        className={cn(
          "transition-opacity",
          searchTerm ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <InputGroupButton onClick={() => setSearchTerm("")}>
          <LuX className="text-muted-foreground size-3.5" />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
