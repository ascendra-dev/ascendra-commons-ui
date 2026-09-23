"use client";

import React, { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiSearchLine } from "react-icons/ri";
import { LuX } from "react-icons/lu";
import { cn } from "@/ascendra-ui/shadcn";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
  InputGroupButton,
  SideBarMenuItem,
  SideBarMenuHeader,
  SideBarMenuSetTitle,
} from "@/ascendra-ui";

type NavItem = {
  category: string;
  name: string;
  href: string;
};

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement(node))
    return extractText((node.props as Record<string, unknown>).children as React.ReactNode);
  return "";
}

function extractNavItems(
  children: React.ReactNode,
  inheritedCategory = "",
): NavItem[] {
  const items: NavItem[] = [];
  const childArray = React.Children.toArray(children);

  // First pass: find the category from a header in this level's direct children
  let localCategory = inheritedCategory;
  for (const child of childArray) {
    if (React.isValidElement(child)) {
      if (
        child.type === SideBarMenuHeader ||
        child.type === SideBarMenuSetTitle
      ) {
        localCategory = extractText(
          (child.props as Record<string, unknown>).children as React.ReactNode,
        );
        break;
      }
    }
  }

  // Second pass: collect items and recurse into containers
  for (const child of childArray) {
    if (!React.isValidElement(child)) continue;
    const props = child.props as Record<string, unknown>;

    if (child.type === SideBarMenuItem) {
      items.push({
        category: localCategory,
        name: extractText(props.children as React.ReactNode),
        href: props.path as string,
      });
    } else if (
      child.type !== SideBarMenuHeader &&
      child.type !== SideBarMenuSetTitle &&
      props.children
    ) {
      items.push(
        ...extractNavItems(props.children as React.ReactNode, localCategory),
      );
    }
  }

  return items;
}

export function SideBarSearch({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  const allItems = useMemo(() => extractNavItems(children), [children]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allItems.filter((item) => item.name.toLowerCase().includes(q));
  }, [query, allItems]);

  const isSearching = query.trim().length > 0;

  const handleResultClick = () => {
    setQuery("");
    document
      .getElementById("app-layout")
      ?.setAttribute("data-sidebar", "closed");
  };

  return (
    <>
      <div data-slot="side-bar-search-input" className="px-3 pt-3 pb-1">
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <InputGroupText>
              <RiSearchLine />
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            ref={inputRef}
            type="text"
            placeholder="Search menus…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
              >
                <LuX />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
      </div>

      {isSearching ? (
        <div data-slot="side-bar-search-results" className="mt-1 px-1.5">
          {results.length === 0 ? (
            <p
              data-slot="side-bar-search-empty"
              className="px-3 py-6 text-center text-xs text-muted-foreground"
            >
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-0.5">
              {results.map((result) => {
                const isActive = pathname === result.href;
                return (
                  <Link
                    key={result.href}
                    data-slot="side-bar-search-result"
                    href={result.href}
                    onClick={handleResultClick}
                    className={cn(
                      "flex h-8 w-full items-center gap-2 rounded-md px-3 text-sm transition-colors",
                      "text-muted-foreground hover:bg-foreground/4 hover:text-foreground",
                      isActive && "bg-foreground/8 text-foreground",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{result.name}</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground/50">
                      {result.category}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        children
      )}
    </>
  );
}
