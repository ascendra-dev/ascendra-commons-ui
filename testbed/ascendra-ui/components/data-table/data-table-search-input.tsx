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
    // Below sm the bar's row is full width: the search fills it up to the buttons, which sit flush right (mr-auto
    // keeps them there once the search reaches max-w-xs).
    <InputGroup className="max-w-xs max-sm:mr-auto">
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
