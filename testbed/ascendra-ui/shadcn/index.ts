// Shadcn boundary — raw, unmodified shadcn primitives only.
//
// Policy:
//   - Files here are kept as close to the shadcn source as possible.
//     Do not add custom logic, variants, or design-system opinions.
//   - If a shadcn component needs customisation, create a wrapper in
//     ascendra-ui/components/ui/ instead and import from there.
//   - To update a component, re-run the shadcn CLI and replace the file.
//     Never hand-edit these files; edits will be overwritten on next sync.
//   - Only include components that are actually consumed by the library.
//     Unused shadcn components should not live here to avoid confusion
//     about which layer to use.
//
// Currently replaced by custom wrappers (do not re-add):
//   - sidebar   → ascendra-ui/components/side-bar/
//   - card      → ascendra-ui/components/card/
//   - badge     → ascendra-ui/components/common-ui/simple-badge, bubble-badge
//   - alert-dialog, slider, textarea
//     (not yet needed; add back via shadcn CLI when a use-case arises)
//   - skeleton  → ascendra-ui/components/ui/skeleton (wrapped with presets)
//   - progress  → ascendra-ui/components/ui/progress (wrapped with size/color variants)

export * from "./components/ui/command";
export * from "./components/ui/accordion";
export * from "./components/ui/avatar";
export * from "./components/ui/chart";
export * from "./components/ui/collapsible";
export * from "./components/ui/drawer";
export * from "./components/ui/label";
export * from "./components/ui/separator";
export * from "./components/ui/tooltip";
export * from "./hooks/use-mobile";
export * from "./lib/utils";
