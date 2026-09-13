<!-- ascendra-ui-version: 1.4.0 -->
<!-- ascendra-ui-commit: 2fb5614182f4bb11b93695abfe1b99a06a0fada0 -->
# Ascendra UI — Showcase Reference

> Auto-generated on 2026-06-10 · ascendra-ui v1.4.0
> Run `npm run docs:generate` after any config or showcase change.
> For the component API reference (props, imports, types) see `docs/ui-reference.md`.

---

## Purpose of This Document

This document is the **design guide and AI training reference** for Ascendra UI.
It answers questions like:

- _What visual patterns does this library use?_
- _Which component should I reach for in a given situation?_
- _How are pages and layouts composed?_
- _What real-world scenarios does the showcase demonstrate?_
- _How should I instruct an AI model to build a new feature using this library?_

For the technical API (props, import paths, TypeScript types) see `docs/ui-reference.md`.

---

## Library at a Glance

| Stat | Count |
|---|---|
| Primitive components | 57 |
| Composite form patterns | 10 |
| Dialog patterns | 12 |
| Sheet patterns | 10 |
| Drawer patterns | 8 |
| Dashboard demos | 10 |
| Report demos | 10 |
| Showcase pages total | 111 |

---

## Design Philosophy

Ascendra UI is a **premium admin panel component library** built for internal tools, SaaS products, and data-rich applications. It is not a general-purpose UI kit — it is optimized for complex multi-section pages, large forms, data tables, and analytical dashboards.

### Core Principles

**1. Depth over flatness**  
Components use a layered shadow and gloss system rather than flat borders. Buttons have a 4-layer shadow. Inputs show a shadow ring on pointer focus and a keyboard-only outline for accessibility. Cards and panels have subtle elevation.

**2. Semantic color tokens, not raw palette values**  
Never use `text-red-500` directly. Instead use semantic tokens: `text-negative` (error), `text-positive` (success), `text-warning` (warning), `text-info` (informational), `text-muted-foreground` (de-emphasized). The library exposes `--brand`, `--positive`, `--negative`, `--warning`, `--info`, `--dimmed` as CSS custom properties that automatically adapt to dark mode.

**3. Smart focus distinction**  
Pointer-device focus shows a shadow ring (visible but not intrusive). Keyboard focus shows a high-contrast outline ring. This is baked into Input, Button, Checkbox, etc. — do not override focus styles.

**4. Layout through composition, not config**  
Page layout is assembled from discrete components (`PageLayout > Header + Nav + MainContainer > SideBar + ContentArea`) rather than a single mega-config prop. This makes each layer independently replaceable.

**5. Forms always use the Field system**  
Never place a label adjacent to an input with ad-hoc spacing. Always use `Field > FieldLabel + Input` (or your control). This ensures consistent label alignment, error display (`FieldError`), and accessible `htmlFor` wiring.

**6. Cards for settings, not content cards**  
The `Card` component is a settings-style card (header + collapsible panel + items), not a generic content card. Use it for forms, settings pages, and structured data. For generic content containers use `PageContent` / `MainContent`.

**7. Dark mode first**  
Every token has a light and dark variant defined in `globals.css`. Dark mode is enabled via the `dark` class on `<html>` (managed by `ThemeProvider` from `next-themes`). Never hardcode light-only colors.

---

## Layout System

### Application Shell

The outer shell is assembled in `app/(app)/layout.tsx`. The hierarchy is:

```
PageLayout
├── SideBarOverlay        ← mobile overlay backdrop
├── Header                ← top navigation bar
│   ├── HeaderLinks       ← breadcrumb / project name area
│   │   └── HeaderLink    ← individual breadcrumb segment
│   └── HeaderActions     ← right-side: ThemeToggle, NameAvatar, etc.
├── Nav                   ← sticky secondary nav strip (tab-style links)
│   └── NavLink           ← active-underline link
└── MainContainer         ← flex row: sidebar + content
    ├── SideBarToggle     ← hamburger button (mobile)
    ├── SideBar
    │   └── SideBarMain
    │       └── SideBarMenu (basePath="/section")
    │           ├── SideBarMenuHeader (icon={LuIcon})
    │           └── SideBarMenuContent
    │               ├── SideBarMenuItem (path="/section/page")
    │               └── SideBarMenuItemGroup → SideBarMenuItem[]
    └── ContentArea       ← main scrollable content column
```

### Page Content Structure

Inside `ContentArea`, every page follows this wrapper hierarchy:

```
PageHeader                ← sticky top bar with title + action slot
├── PageHeaderGroup       ← title/subtitle group
│   ├── PageTitle
│   └── PageSubtitle
└── PageHeaderAction      ← right slot (buttons, badges)

PageMain                  ← scrollable main region below header
└── PageWrapper           ← horizontal padding + max-width
    └── PageContent       ← vertical spacing between sections
        └── MainContent   ← the content itself (grid, list, etc.)
```

Optional secondary navigation between `PageHeader` and `PageMain`:
```
Nav > NavLink[]           ← tab-style section switcher
```

### Layout Variants

| Variant | When to use | Structure |
|---|---|---|
| **Single column** | Simple forms, settings | `MainContent > Card[]` |
| **Two column** | Form + aside | `PageContent > grid cols-3` where main is `col-span-2` and `AsideContent` is `col-span-1` |
| **Full width table** | Data-heavy pages | `MainContent` without `max-w` constraint, `TableWrapper` fills width |
| **Dashboard grid** | Analytics | `MainContent > grid` with mixed `col-span` values for KPI tiles, charts, tables |

### When to Use AsideContent

`AsideContent` is a sidebar-within-a-page for supplementary info (related records, quick stats, help text). Use it when content logically divides into main + context panel. The `dimmed` prop overlays it when a form is in a loading/saving state.

---

## Structural Code Templates

Copy these templates as the starting point for each page type. They encode the exact wrapper hierarchy, class names, import paths, and composition rules used across all showcase pages. Do not invent alternative structures.

---

### Template 1 — Standard Page Shell

Every page in a consumer project uses this exact wrapper hierarchy. Never replace `PageMain`/`PageWrapper`/`PageContent` with raw divs.

```tsx
import {
  PageHeader, PageHeaderGroup, PageTitle, PageSubtitle, PageHeaderAction,
  PageMain, PageWrapper, PageContent, MainContent,
  Button,
} from '@/ascendra-ui';

export default function MyPage() {
  return (
    <>
      <PageHeader>
        <PageHeaderGroup>
          <PageTitle>Page Title</PageTitle>
          <PageSubtitle>One line describing this page</PageSubtitle>
        </PageHeaderGroup>
        <PageHeaderAction>
          <Button size="sm">Create New</Button>
        </PageHeaderAction>
      </PageHeader>

      <PageMain>
        <PageWrapper>
          <PageContent>
            <MainContent>
              {/* page content here */}
            </MainContent>
          </PageContent>
        </PageWrapper>
      </PageMain>
    </>
  );
}
```

**With aside panel** — use `AsideContent` for supplementary info (related records, quick stats, help):

```tsx
<PageContent>
  <MainContent>
    {/* primary content — gets flex-1 width on lg+ */}
  </MainContent>
  <AsideContent>
    {/* secondary panel — w-full on mobile, fixed width on lg+ */}
  </AsideContent>
</PageContent>
```

**With secondary nav tabs** — `Nav` goes between `PageHeader` and `PageMain`:

```tsx
<PageHeader>...</PageHeader>
<Nav>
  <NavLink href="/section/overview">Overview</NavLink>
  <NavLink href="/section/activity">Activity</NavLink>
  <NavLink href="/section/settings">Settings</NavLink>
</Nav>
<PageMain>...</PageMain>
```

---

### Template 2 — Settings / Form Page

Rules: `BackLink` for pages with a parent · `Card > CardHeader + CardPanel > CardPanelItem` per section · Always `Field > FieldLabel + FieldContent > [control] + FieldError` · 2-col rows use `FieldGrid` · 1-col rows use `FieldGroup` · Horizontal label+control uses `Field orientation="horizontal" > FieldLabelGroup` · `UnsavedChangesBar` at root level outside `PageMain`

```tsx
"use client";
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  BackLink, PageHeader, PageHeaderGroup, PageTitle, PageSubtitle,
  PageMain, PageWrapper, PageContent, MainContent,
  Card, CardHeader, CardHeaderTitle, CardHeaderSubtitle,
  CardPanel, CardPanelItem,
  Field, FieldLabel, FieldContent, FieldError, FieldGrid, FieldGroup,
  FieldHint, FieldLabelGroup,
  Input, Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Switch, Button, UnsavedChangesBar,
} from '@/ascendra-ui';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  email:     z.string().email('Invalid email'),
  role:      z.string().min(1, 'Select a role'),
  notifications: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export default function SettingsPage() {
  const { register, handleSubmit, control, reset,
    formState: { errors, isDirty, isValid, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { notifications: true },
  });

  return (
    <>
      <BackLink href="/parent">Back to Parent</BackLink>

      <PageHeader>
        <PageHeaderGroup>
          <PageTitle>Account Settings</PageTitle>
          <PageSubtitle>Manage your profile and preferences</PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>

      <PageMain>
        <PageWrapper>
          <PageContent>
            <MainContent>

              {/* ── Section with 2-column field grid ───────────────────── */}
              <Card>
                <CardHeader>
                  <CardHeaderTitle>Personal Information</CardHeaderTitle>
                  <CardHeaderSubtitle>Your name and contact</CardHeaderSubtitle>
                </CardHeader>
                <CardPanel>
                  <CardPanelItem>
                    <FieldGrid>
                      <Field>
                        <FieldLabel htmlFor="first-name">First Name</FieldLabel>
                        <FieldContent>
                          <Input id="first-name" full {...register('firstName')}
                            aria-invalid={!!errors.firstName} />
                          <FieldError errors={errors.firstName ? [errors.firstName] : []} />
                        </FieldContent>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <FieldContent>
                          <Input id="email" type="email" full {...register('email')}
                            aria-invalid={!!errors.email} />
                          <FieldError errors={errors.email ? [errors.email] : []} />
                        </FieldContent>
                      </Field>
                    </FieldGrid>
                  </CardPanelItem>

                  {/* Horizontal field — label left, control right */}
                  <CardPanelItem>
                    <Field orientation="horizontal">
                      <FieldLabelGroup>
                        <FieldLabel htmlFor="notifications">Email Notifications</FieldLabel>
                        <FieldHint>Receive product updates</FieldHint>
                      </FieldLabelGroup>
                      <FieldContent>
                        <Controller name="notifications" control={control}
                          render={({ field }) => (
                            <Switch id="notifications"
                              checked={field.value}
                              onCheckedChange={field.onChange} />
                          )} />
                      </FieldContent>
                    </Field>
                  </CardPanelItem>
                </CardPanel>
              </Card>

              {/* ── Section with Select ──────────────────────────────────── */}
              <Card>
                <CardHeader><CardHeaderTitle>Role & Access</CardHeaderTitle></CardHeader>
                <CardPanel>
                  <CardPanelItem>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="role">Role</FieldLabel>
                        <FieldContent>
                          <Controller name="role" control={control}
                            render={({ field }) => (
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger id="role"><SelectValue placeholder="Select a role" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                  <SelectItem value="editor">Editor</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            )} />
                          <FieldError errors={errors.role ? [errors.role] : []} />
                        </FieldContent>
                      </Field>
                    </FieldGroup>
                  </CardPanelItem>
                </CardPanel>
              </Card>

              {/* Danger zone — use Card danger prop */}
              <Card danger>
                <CardHeader>
                  <CardHeaderTitle>Danger Zone</CardHeaderTitle>
                  <CardHeaderSubtitle>Irreversible actions</CardHeaderSubtitle>
                </CardHeader>
                <CardPanel>
                  <CardPanelItem>{/* destructive action */}</CardPanelItem>
                </CardPanel>
              </Card>

            </MainContent>
          </PageContent>
        </PageWrapper>
      </PageMain>

      {/* UnsavedChangesBar is OUTSIDE PageMain — always at root level */}
      <UnsavedChangesBar
        isDirty={isDirty}
        isValid={isValid}
        isSaving={isSubmitting}
        onSave={handleSubmit(onSave)}
        onReset={() => reset()}
        onInvalid={() => {}}
      />
    </>
  );
}
```

---

### Template 3 — Dashboard Page

Rules: Use `PageHeader variant="dashboard"` + `DashboardContent` — NOT `PageMain/PageWrapper/PageContent` · KPI row: `grid grid-cols-2 gap-4 lg:grid-cols-4` · KPI tile: `Card className="h-full" > CardPanel > div.flex.flex-1.flex-col.p-5` · Chart rows: `grid grid-cols-12 gap-4` with `col-span-12 md:col-span-N` · Charts inside `Card > CardHeader + CardPanel > div.p-5 > ChartContainer` · Table: standalone `CardHeader` + `TableWrapper > Table` (NOT wrapped in Card) · `TableBody border={{}} bg={{}}` for accent styling · Chart colors: always `var(--chart-1)` through `var(--chart-5)` — NEVER raw hex · `ChartContainer`, `ChartConfig` from `@/ascendra-ui/shadcn` · `ChartLegend`, `ChartLegendGroup` from `@/ascendra-ui`

```tsx
"use client";
import {
  BackLink, PageHeader, PageHeaderGroup, PageTitle, PageSubtitle, PageHeaderAction,
  DashboardContent,
  Card, CardHeader, CardHeaderTitle, CardHeaderSubtitle, CardPanel,
  Table, TableWrapper, TableHeader, TableHeaderRow, TableHead,
  TableBody, TableRow, TableCell,
  SimpleBadge, ChartLegend, ChartLegendGroup,
} from '@/ascendra-ui';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  type ChartConfig,
} from '@/ascendra-ui/shadcn';             // ← shadcn, not ascendra-ui
import { AreaChart, Area, BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts';
import { LuTrendingUp, LuTrendingDown } from 'react-icons/lu';

const revenueConfig: ChartConfig = {
  revenue:  { label: 'Revenue',  color: 'var(--chart-1)' },
  expenses: { label: 'Expenses', color: 'var(--chart-2)' },
};

export default function MyDashboard() {
  return (
    <>
      <BackLink href="/dashboards">All Dashboards</BackLink>

      {/* variant="dashboard" adds bottom border + spacing below header */}
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>Revenue & Growth</PageTitle>
          <PageSubtitle>Monthly metrics for the current fiscal year</PageSubtitle>
        </PageHeaderGroup>
        <PageHeaderAction className="w-fit">
          <SimpleBadge variant="blue">SaaS</SimpleBadge>
        </PageHeaderAction>
      </PageHeader>

      {/* DashboardContent replaces PageMain/PageWrapper/PageContent entirely */}
      <DashboardContent>

        {/* ── KPI tiles — always 2 cols mobile / 4 cols desktop ── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="h-full">
              <CardPanel>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <div className="mt-auto flex flex-col items-start gap-1 pt-4
                                  md:flex-row md:items-center md:justify-between">
                    <span className="text-2xl font-semibold tracking-tight">{kpi.value}</span>
                    <SimpleBadge variant={kpi.up ? 'green' : 'red'}>
                      {kpi.up ? <LuTrendingUp className="size-3" /> : <LuTrendingDown className="size-3" />}
                      {kpi.delta}
                    </SimpleBadge>
                  </div>
                </div>
              </CardPanel>
            </Card>
          ))}
        </div>

        {/* ── Chart row — 12-column grid ── */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-8">
            <Card className="h-full">
              <CardHeader>
                <CardHeaderTitle>Revenue vs Expenses</CardHeaderTitle>
                <CardHeaderSubtitle>12-month trend</CardHeaderSubtitle>
              </CardHeader>
              <CardPanel>
                <div className="p-5">
                  <ChartContainer config={revenueConfig} className="h-64 w-full">
                    <AreaChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="grad-rev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="var(--chart-1)" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      {/* Standard grid — always these exact props */}
                      <CartesianGrid vertical={false}
                        stroke="var(--border)" strokeOpacity={0.6} strokeWidth={0.5} />
                      {/* Standard axes — always tickLine={false} axisLine={false} */}
                      <XAxis dataKey="month"
                        tickLine={false} axisLine={false} tick={{ fontSize: 11 }} dy={6} />
                      <YAxis tickLine={false} axisLine={false}
                        tick={{ fontSize: 11 }} width={44} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="revenue"
                        stroke="var(--chart-1)" fill="url(#grad-rev)" strokeWidth={2} />
                      <Area type="monotone" dataKey="expenses"
                        stroke="var(--chart-2)" fill="var(--chart-2)"
                        fillOpacity={0.1} strokeWidth={1.5} />
                    </AreaChart>
                  </ChartContainer>
                  <ChartLegendGroup className="mt-3">
                    <ChartLegend variant="chart-1" shape="square">Revenue</ChartLegend>
                    <ChartLegend variant="chart-2" shape="square">Expenses</ChartLegend>
                  </ChartLegendGroup>
                </div>
              </CardPanel>
            </Card>
          </div>

          <div className="col-span-12 md:col-span-4">
            <Card className="h-full">
              <CardPanel>
                <div className="flex flex-1 flex-col p-5">
                  {/* narrow chart or stat breakdown */}
                </div>
              </CardPanel>
            </Card>
          </div>
        </div>

        {/* ── Table row — standalone CardHeader + TableWrapper (NOT Card-wrapped) ── */}
        <div>
          <CardHeader>
            <CardHeaderTitle>Top Records</CardHeaderTitle>
            <CardHeaderSubtitle>Sorted by value, current period</CardHeaderSubtitle>
          </CardHeader>
          <TableWrapper>
            <Table scrollable horizontal vertical height={300}>
              <TableHeader>
                <TableHeaderRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableHeaderRow>
              </TableHeader>
              {/* border={{}} bg={{}} = accent border + gradient row styling */}
              <TableBody border={{}} bg={{}}>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{row.value}</TableCell>
                    <TableCell>
                      <SimpleBadge variant={row.active ? 'green' : 'amber'}>{row.status}</SimpleBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableWrapper>
        </div>

      </DashboardContent>
    </>
  );
}
```

---

### Template 4 — Report Page

Rules: No `PageHeader`/`PageMain`/`PageWrapper` — entire page is `BackLink` + `ReportDocumentWrapper` · `ReportDocumentWrapper` has `id="report-content"` hardcoded (PDF export target) · `ReportPdfExportButton` goes AFTER and OUTSIDE `ReportDocumentWrapper` · Document header: `Card > CardPanel (border color) > ReportHeaderContent > ReportHeaderBody > ReportHeaderBodyWrap` · Metadata strip: `ReportHeaderFooter > ReportHeaderField` · Section dividers: `ReportSectionHeader` · Report KPIs use raw `div.flex.flex-col` layout — NOT Card tiles · Charts: `Card > CardHeader + CardPanel > div.p-6 > ChartContainer.h-56` · Positive/negative: `text-emerald-600 dark:text-emerald-400` / `text-rose-600 dark:text-rose-400` (NOT semantic tokens — for print reliability)

```tsx
"use client";
import {
  BackLink,
  ReportDocumentWrapper, ReportHeaderContent, ReportHeaderBody,
  ReportHeaderBodyWrap, ReportTitle, ReportTitleHeader, ReportSubTitle,
  ReportHeaderFooter, ReportHeaderField,
  ReportSectionHeader, ReportDocumentFooter, ReportDocumentFooterLine,
  ReportDocumentFooterLineLeft, ReportDocumentFooterLineRight,
  ReportPdfExportButton,
  Card, CardHeader, CardHeaderTitle, CardHeaderSubtitle, CardPanel,
  Table, TableWrapper, TableHeader, TableHeaderRow, TableHead,
  TableBody, TableRow, TableCell,
  SimpleBadge, ChartLegend, ChartLegendGroup,
} from '@/ascendra-ui';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  type ChartConfig,
} from '@/ascendra-ui/shadcn';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { LuTrendingUp, LuTrendingDown } from 'react-icons/lu';

export default function MyReportPage() {
  return (
    <>
      <BackLink href="/reports">Report Gallery</BackLink>

      {/* ReportDocumentWrapper id="report-content" — PDF export targets this */}
      <ReportDocumentWrapper>

        {/* ── Document header ──────────────────────────────────────────── */}
        <Card>
          <CardPanel border={{ color: 'blue' }}>
            <ReportHeaderContent>
              <ReportHeaderBody>
                <ReportHeaderBodyWrap>
                  <ReportTitle>Report Category</ReportTitle>
                  <ReportTitleHeader>Organization Name</ReportTitleHeader>
                  <ReportSubTitle>Period · Month YYYY</ReportSubTitle>
                </ReportHeaderBodyWrap>
                <SimpleBadge variant="secondary">Confidential</SimpleBadge>
              </ReportHeaderBody>
              <ReportHeaderFooter>
                <ReportHeaderField label="Prepared for">Client Name</ReportHeaderField>
                <ReportHeaderField label="Report Date">June 30, 2024</ReportHeaderField>
                <ReportHeaderField label="Prepared by">Department</ReportHeaderField>
              </ReportHeaderFooter>
            </ReportHeaderContent>
          </CardPanel>
        </Card>

        {/* ── Report KPIs — raw div layout, NOT Card tiles ────────────── */}
        <div>
          <ReportSectionHeader>
            <CardHeaderTitle>Period Highlights</CardHeaderTitle>
            <CardHeaderSubtitle>Key metrics vs. prior period</CardHeaderSubtitle>
          </ReportSectionHeader>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.label} className="flex flex-col gap-1.5">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-4xl font-bold tracking-tight text-foreground">{k.value}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Use emerald/rose directly — semantic tokens don't print reliably */}
                  <span className={`flex items-center gap-0.5 font-semibold ${
                    k.up ? 'text-emerald-600 dark:text-emerald-400'
                         : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {k.up ? <LuTrendingUp className="size-3" /> : <LuTrendingDown className="size-3" />}
                    {k.delta}
                  </span>
                  <span className="text-muted-foreground">vs {k.py}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Chart ───────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardHeaderTitle>Monthly Trend</CardHeaderTitle>
            <CardHeaderSubtitle>Current vs. prior period</CardHeaderSubtitle>
          </CardHeader>
          <CardPanel>
            <div className="p-6">
              <ChartContainer config={chartConfig} className="h-56 w-full">
                <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                  barCategoryGap="28%" barGap={4}>
                  <CartesianGrid vertical={false}
                    stroke="var(--border)" strokeOpacity={0.6} strokeWidth={0.5} />
                  <XAxis dataKey="month"
                    tickLine={false} axisLine={false} tick={{ fontSize: 11 }} dy={6} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={44} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="current" fill="var(--chart-1)" fillOpacity={0.85}
                    radius={[3, 3, 0, 0]} />
                  <Bar dataKey="prior"   fill="var(--chart-2)" fillOpacity={0.6}
                    radius={[3, 3, 0, 0]} />
                </BarChart>
              </ChartContainer>
              <ChartLegendGroup align="left" className="mt-3">
                <ChartLegend variant="chart-1" shape="square">Current Period</ChartLegend>
                <ChartLegend variant="chart-2" shape="square">Prior Period</ChartLegend>
              </ChartLegendGroup>
            </div>
          </CardPanel>
        </Card>

        {/* ── Table ───────────────────────────────────────────────────── */}
        <div>
          <ReportSectionHeader>
            <CardHeaderTitle>Detailed Breakdown</CardHeaderTitle>
          </ReportSectionHeader>
          <TableWrapper>
            <Table horizontal vertical scrollable>
              <TableHeader>
                <TableHeaderRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">vs. Target</TableHead>
                </TableHeaderRow>
              </TableHeader>
              <TableBody border={{}} bg={{}}>
                {rows.map((r) => (
                  <TableRow key={r.name}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{r.value}</TableCell>
                    <TableCell className={`text-right font-mono font-medium tabular-nums ${
                      r.vs >= 0 ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {r.vs >= 0 ? '+' : ''}{r.vs.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableWrapper>
        </div>

        {/* ── Report footer ────────────────────────────────────────────── */}
        <ReportDocumentFooter>
          <ReportDocumentFooterLine>
            <ReportDocumentFooterLineLeft>Organization — Department</ReportDocumentFooterLineLeft>
            <ReportDocumentFooterLineRight>
              <span>Report Title</span><span>·</span>
              <span>Confidential</span><span>·</span>
              <span>June 30, 2024</span>
            </ReportDocumentFooterLineRight>
          </ReportDocumentFooterLine>
        </ReportDocumentFooter>

      </ReportDocumentWrapper>

      {/* ReportPdfExportButton is OUTSIDE and AFTER ReportDocumentWrapper */}
      <ReportPdfExportButton fileName="my-report" />
    </>
  );
}
```

---

### Template 5 — Dialog Patterns

**Confirmation dialog** — user reads consequences, clicks confirm:

```tsx
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogBody, DialogFooter, DialogClose,
  Button,
} from '@/ascendra-ui';

<Dialog>
  <DialogTrigger asChild><Button variant="secondary">Archive</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Archive this project?</DialogTitle>
      <DialogDescription>This project will be archived and hidden.</DialogDescription>
    </DialogHeader>
    <DialogBody>
      <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
        {consequences.map((c) => (
          <li key={c} className="flex items-start gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
            {c}
          </li>
        ))}
      </ul>
    </DialogBody>
    <DialogFooter>
      <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
      <DialogClose asChild><Button onClick={handleArchive}>Archive</Button></DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Input dialog** — collect ≤ 4 fields:

```tsx
<Dialog onOpenChange={(open) => { if (!open) reset(); }}>
  <DialogTrigger asChild><Button size="sm">Invite Member</Button></DialogTrigger>
  <DialogContent showCloseButton>
    <DialogHeader>
      <DialogTitle>Invite a team member</DialogTitle>
      <DialogDescription>They will receive an email with a link to join.</DialogDescription>
    </DialogHeader>
    <DialogBody>
      <FieldGrid>
        <Field>
          <FieldLabel htmlFor="invite-email">Email address</FieldLabel>
          <FieldContent>
            <Input id="invite-email" type="email" full
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel htmlFor="invite-role">Role</FieldLabel>
          <FieldContent>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="invite-role"><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>
      </FieldGrid>
    </DialogBody>
    <DialogFooter>
      <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
      <DialogClose asChild>
        <Button disabled={!email || !role} onClick={handleInvite}>Send Invite</Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Destructive dialog** — irreversible action, typed confirmation:

```tsx
<Dialog onOpenChange={(open) => { if (!open) setConfirmText(''); }}>
  <DialogTrigger asChild><Button variant="destructive">Delete Account</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete your account?</DialogTitle>
      <DialogDescription>Permanent — all data will be erased.</DialogDescription>
    </DialogHeader>
    <DialogBody>
      <Field>
        <FieldLabel htmlFor="confirm-delete">Type <strong>DELETE</strong> to confirm</FieldLabel>
        <FieldContent>
          <Input id="confirm-delete" full value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" />
        </FieldContent>
      </Field>
    </DialogBody>
    <DialogFooter>
      <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
      <Button variant="destructive" disabled={confirmText !== 'DELETE'}
        onClick={handleDelete}>Delete Account</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### Template 6 — Sheet Pattern (Detail / Preview)

Rules: All `Sheet*` sub-components from `@/ascendra-ui` · Use `SheetTabs` for multi-tab sheets · `SheetProperties` for key-value metadata grids · `SheetSection` for each content block · `SheetSubHeader` holds the tab strip

```tsx
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle,
  SheetDescription, SheetSubHeader, SheetTabs, SheetTabList,
  SheetTabTrigger, SheetTabContent, SheetBody, SheetSection,
  SheetProperties, SheetFooter, SheetClose,
  Button, NameAvatar, SimpleBadge, StatusDot,
} from '@/ascendra-ui';

<Sheet>
  <SheetTrigger asChild><Button variant="secondary" size="sm">View Record</Button></SheetTrigger>
  <SheetContent>
    <SheetTabs defaultTab="overview">
      <SheetHeader>
        <NameAvatar name="Sarah Mitchell" size={36} />
        <div>
          <SheetTitle>Sarah Mitchell</SheetTitle>
          <SheetDescription className="flex items-center gap-1.5">
            <StatusDot variant="emerald" />
            Senior Engineer · Engineering
          </SheetDescription>
        </div>
      </SheetHeader>

      <SheetSubHeader>
        <SheetTabList>
          <SheetTabTrigger value="overview">Overview</SheetTabTrigger>
          <SheetTabTrigger value="history">History</SheetTabTrigger>
        </SheetTabList>
      </SheetSubHeader>

      <SheetBody>
        <SheetTabContent value="overview">
          <SheetSection>
            <SheetProperties>
              <SheetProperties.Row label="Department">Engineering</SheetProperties.Row>
              <SheetProperties.Row label="Location">Remote — London</SheetProperties.Row>
              <SheetProperties.Row label="Start Date">Mar 15, 2021</SheetProperties.Row>
              <SheetProperties.Row label="Manager">James Okafor</SheetProperties.Row>
            </SheetProperties>
          </SheetSection>
        </SheetTabContent>

        <SheetTabContent value="history">
          {/* timeline or list content */}
        </SheetTabContent>
      </SheetBody>

      <SheetFooter>
        <SheetClose asChild><Button variant="secondary">Close</Button></SheetClose>
        <Button>Edit Record</Button>
      </SheetFooter>
    </SheetTabs>
  </SheetContent>
</Sheet>
```

---

### Template 7 — Drawer Pattern (Mobile-first)

Rules: `Drawer`, `DrawerTrigger`, `DrawerClose`, `DrawerContent`, `DrawerFooter` from `@/ascendra-ui/shadcn` — NOT `@/ascendra-ui` · Content in `div.flex-1.overflow-y-auto.px-6.py-4` · Footer: `DrawerFooter className="flex-row items-center justify-end border-t border-border px-6 py-4"`

```tsx
import {
  Drawer, DrawerTrigger, DrawerClose, DrawerContent, DrawerFooter,
} from '@/ascendra-ui/shadcn';              // ← shadcn, not ascendra-ui
import {
  Button, Item, ItemGroup, ItemContent, ItemMedia, ItemTitle,
} from '@/ascendra-ui';
import { LuPencil, LuTrash2 } from 'react-icons/lu';

<Drawer>
  <DrawerTrigger asChild><Button variant="secondary">More Options</Button></DrawerTrigger>
  <DrawerContent>
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <ItemGroup>
        <DrawerClose asChild>
          <Item asChild={false} variant="default" className="cursor-pointer hover:bg-muted/60">
            <ItemMedia variant="icon">
              <LuPencil className="size-4 text-muted-foreground" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="font-normal">Rename</ItemTitle>
            </ItemContent>
          </Item>
        </DrawerClose>
        <DrawerClose asChild>
          <Item asChild={false} variant="default" className="cursor-pointer hover:bg-muted/60">
            <ItemMedia variant="icon">
              <LuTrash2 className="size-4 text-negative" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="text-negative font-normal">Delete</ItemTitle>
            </ItemContent>
          </Item>
        </DrawerClose>
      </ItemGroup>
    </div>
    <DrawerFooter className="flex-row items-center justify-end border-t border-border px-6 py-4">
      <DrawerClose asChild>
        <Button variant="secondary" className="w-full">Cancel</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
```

---

### Template 8 — Tabs Page Pattern

Rules: `Tabs` goes inside `PageWrapper` but outside `PageContent` · `TabTrigger dirty` prop shows unsaved-changes dot · `UnsavedChangesBar` at root level outside `PageMain`

```tsx
import {
  PageHeader, PageHeaderGroup, PageTitle, PageSubtitle,
  PageMain, PageWrapper, PageContent, MainContent,
  Tabs, TabList, TabTrigger, TabContent,
  Card, CardHeader, CardHeaderTitle, CardPanel, CardPanelItem,
  UnsavedChangesBar,
} from '@/ascendra-ui';

<PageHeader>
  <PageHeaderGroup>
    <PageTitle>User Profile</PageTitle>
    <PageSubtitle>Manage your account settings</PageSubtitle>
  </PageHeaderGroup>
</PageHeader>

<PageMain>
  <PageWrapper>
    {/* Tabs goes inside PageWrapper, outside PageContent */}
    <Tabs defaultValue="general">
      <TabList>
        <TabTrigger value="general">General</TabTrigger>
        <TabTrigger value="preferences">Preferences</TabTrigger>
        {/* dirty prop shows unsaved-changes dot on the tab */}
        <TabTrigger value="notifications" dirty={notificationsDirty}>Notifications</TabTrigger>
      </TabList>

      <PageContent>
        <MainContent>
          <TabContent value="general">
            <Card>
              <CardHeader><CardHeaderTitle>Identity</CardHeaderTitle></CardHeader>
              <CardPanel>
                <CardPanelItem>{/* fields */}</CardPanelItem>
              </CardPanel>
            </Card>
          </TabContent>
          <TabContent value="preferences">{/* preferences content */}</TabContent>
          <TabContent value="notifications">{/* notification toggles */}</TabContent>
        </MainContent>
      </PageContent>
    </Tabs>
  </PageWrapper>
</PageMain>

<UnsavedChangesBar isDirty={isDirty} onSave={onSave} onReset={reset} />
```

---

### Template 9 — Color & Token Rules

```
ALWAYS use semantic CSS custom properties — NEVER raw Tailwind palette values.

Text:  text-foreground          → primary text
       text-muted-foreground    → labels, metadata, de-emphasized
       text-negative            → error / destructive
       text-positive            → success
       text-warning             → warning
       text-info                → informational

Background:  bg-background      → page background
             bg-card            → card surface
             bg-muted           → subtle fill, tags
             bg-muted/60        → hover row background
             bg-destructive     → destructive action background

Border:  border-border          → standard border
         stroke="var(--border)" → SVG chart grid (+ strokeOpacity=0.6 strokeWidth=0.5)

Chart series (always, never hex/Tailwind):  var(--chart-1) through var(--chart-5)

Special cases — use Tailwind directly ONLY here:
  text-emerald-600 dark:text-emerald-400  → positive delta in reports (print-safe)
  text-rose-600 dark:text-rose-400        → negative delta in reports (print-safe)

WRONG:  className="text-red-500"
WRONG:  fill="#2563eb"
WRONG:  stroke="rgb(99,102,241)"
RIGHT:  className="text-negative"
RIGHT:  fill="var(--chart-1)"
RIGHT:  stroke="var(--border)"
```

---

## Component Selection Guide

### Feedback & Status

| Need | Component | Notes |
|---|---|---|
| Label a record status | `SimpleBadge` | semantic variants: default, green, red, amber, blue, violet, orange |
| Label with gradient style | `BubbleBadge` | sizes sm/md/lg; use sparingly, higher visual weight |
| Online / offline indicator | `StatusDot` | tiny halo dot; pairs with `SimpleBadge` in table cells |
| Inline alert message | `SimpleAlert` | use inside forms for guidance; never use toast for form validation |
| Transient notification | `toast()` + `<Toaster />` | mount Toaster in root layout; call `toast.success()`, `toast.error()` etc. |
| Premium feature marker | `ProBadge` | blue-purple gradient; place next to feature names in settings |
| Loading placeholder | `Skeleton` + presets | use `SkeletonTable`, `SkeletonStat`, `SkeletonCard` for structured loading states |
| Progress indicator | `ProgressBar` | indeterminate for unknown duration; sized/colored variants |
| Multi-step flow | `Stepper` | shows current step with completed/active/pending states |
| Dirty form warning | `UnsavedChangesBar` | fixed-bottom bar; appears when `isDirty` is true |

### Form Inputs

| Need | Component | Notes |
|---|---|---|
| Text input | `Input` | always wrap in `Field` for label + errors |
| Prefix / suffix / button addon | `InputGroup` | e.g. URL prefix, currency suffix, search button |
| Short list select | `Select` | ≤ 20 options; use `SelectTrigger` + `SelectContent` + `SelectItem` |
| Searchable select, multi-select | `Combobox` | built-in search; multi mode shows chips |
| Large dataset lookup | `TableLookup` | tabular popup with async search; single or multi mode |
| Toggle boolean | `Switch` | for settings and preferences |
| Agree / multi-select | `Checkbox` | individual item; use `FieldSet > FieldGroup` for a group |
| Single pick from small set | `RadioGroup` + `RadioGroupItem` | ≤ 6 options; wrap in `FieldSet` |
| Date | `DatePicker` | single date selection |
| Date range | `DateRangePicker` | shows 2-month calendar |
| Rich content | `RichTextEditor` | Tiptap-based; bold, italic, lists, links |
| File | `FileUpload` | dropzone / button / inline variants; managed upload states |
| Color | `ColorPicker` | HSL sliders + hex input + presets grid |

### Always use Field wrappers

```tsx
// Correct
<Field orientation="horizontal">
  <FieldLabel htmlFor="email">Email</FieldLabel>
  <FieldContent>
    <Input id="email" {...register('email')} />
    <FieldError errors={errors.email ? [errors.email] : []} />
  </FieldContent>
</Field>

// Wrong — raw label + input
<label>Email</label>
<input ... />
```

### Navigation

| Need | Component | Notes |
|---|---|---|
| External / internal text link | `Anchor` | variants: primary (brand color), blue, muted |
| Tab-style page links | `NavLink` | active underline driven by pathname |
| Horizontal link strip | `Nav > NavLink[]` | sticky strip; used for sub-section navigation |
| Breadcrumb header | `Header > HeaderLinks > HeaderLink` | use slash separators via `HeaderSlash` |
| App sidebar nav | `SideBarMenu` system | see layout guide above |
| Global search / commands | `CommandPalette` + `useCommandPalette` | ⌘K registered automatically |

### Overlays

| Need | Component | Notes |
|---|---|---|
| Confirm an action | `Dialog` | centered modal; use for short confirmations and form inputs |
| Destroy / irreversible action | `Dialog` with `variant="destructive"` on the confirm button | |
| Detail / preview panel | `Sheet` side="right" | slides in from right; use for record detail, preview |
| Settings panel | `Sheet` side="right" | wider than dialog; use when form has many fields |
| Mobile action menu | `Drawer` | slides up from bottom; use for mobile-first action flows |
| Contextual menu | `DropdownMenu` | right-click or button trigger; supports sub-menus, checkboxes |
| Hover help | `Tooltip` | short label only; for longer help use `FieldDescription` |

**Rule:** Use Dialog for ≤ 4 fields and destructive confirmations. Use Sheet for ≥ 5 fields or complex forms. Use Drawer for mobile-first interactions.

### Data Display

| Need | Component | Notes |
|---|---|---|
| Simple data list | `Table` system | no search/sort/filter; use inside dashboards |
| Full-featured data grid | `DataTable` system | search, filter, sort, column manager, pagination |
| Empty list state | `Empty` | with `EmptyMedia` icon variant and `EmptyContent` CTA |
| Clickable list items | `Item` system | media + title + description + actions slots |
| KPI tile | `Card` with `CardPanel > CardPanelItem` | use in dashboard grids |
| Analytics charts | Recharts via `CardPanel` | Line, Area, Bar, Pie, Radial, etc. |
| Interactive stars | `Rating` | `onChange` makes it interactive; omit for read-only |

### Utilities

| Need | Component | Notes |
|---|---|---|
| Copy to clipboard | `CopyText` | wrap any element; `showTooltip` for confirmation |
| User avatar | `NameAvatar` | deterministic color from name; optional `href` |
| Theme switcher | `ThemeToggle` | places in `HeaderActions` |
| Page navigation | `PaginationButton` | prev/next bordered buttons |
| Table row action | `RowActionButton` | hidden by default; visible on row hover |
| Route scroll reset | `ScrollToTop` | place once in root layout; no props needed |
| Collapsible calendar | `Calendar` | single, multiple, or range mode |
| Tabbed layout | `Tabs > TabList > TabTrigger` | `dirty` prop shows unsaved-changes dot |

---

## DataTable System

The DataTable is a full-featured, server-aware data grid composed of a provider layer (state + React Query) and a compound component layer. Do not confuse it with the simple `Table` system — use `DataTable` when you need search, sort, filter, column management, row selection, or server-side queries.

### Provider Choice

| Provider | When to use |
|---|---|
| `DataTableProvider` | You already have data in scope (from server component, SWR, or local state). Table handles search/sort/filter/pagination internally. |
| `DataTableWithQueryProvider` | Data comes from the server via named queries. Adds `QueryBar`, `QueryParamPanel`, and React Query fetching on top of `DataTableProvider`. |

### Column Definitions — ColumnDef\<T\>

```ts
const COLUMNS: ColumnDef<Invoice>[] = [
  { key: 'invoiceNumber', label: 'Invoice #', freeze: true },         // always visible
  { key: 'clientName',    label: 'Client',    freeze: true, filter: true },
  { key: 'amount',        label: 'Amount',    type: 'number' },
  { key: 'dueDate',       label: 'Due Date',  type: 'date' },
  { key: 'status',        label: 'Status',    sortable: false, filter: true },
  { key: 'issuedAt',      label: 'Issued',    type: 'date', active: false }, // hidden by default
];
```

| Prop | Type | Default | Meaning |
|---|---|---|---|
| `key` | `keyof T` | — | Maps to a field on your data object |
| `label` | `string` | — | Display name in headers, dropdowns, column manager |
| `type` | `'string' \| 'number' \| 'date'` | `'string'` | Sort comparison logic |
| `sortable` | `boolean` | `true` | Sort on header click; appears in sort dropdown |
| `filter` | `boolean` | `false` | Makes column available in filter picker |
| `active` | `boolean` | `true` | Visible by default; user can toggle off |
| `freeze` | `boolean` | `false` | Always visible; user cannot hide it |
| `locked` | `boolean` | `false` | Always visible and cannot be reordered |

### Template — Static Data Table

Use when data is already in scope (fetched externally or passed from a server component).

```tsx
import {
  DataTableProvider, DataTable, DataTableBar, DataTableBarContent, DataTableBarAction,
  DataTableBody, DataTableCell, DataTableFoot, DataTableHead, DataTableHeader,
  DataTableHeaderRow, DataTableRow, DataTableRowAction, DataTableEditRowAction,
  DataTableDeleteRowAction, DataTableSearchInput, DataTableColumnManager,
  DataTableSortDropdown, DataTableFilterDropdown, DataTableFilterBar, DataTableWrapper,
  DataTableLoadingBody, DataTableEmptyBody, SimpleBadge, Button, type ColumnDef,
} from '@/ascendra-ui';

const COLUMNS: ColumnDef<User>[] = [
  { key: 'name',   label: 'Name' },
  { key: 'email',  label: 'Email' },
  { key: 'status', label: 'Status', filter: true, sortable: false },
];

export function UsersTable({ data, isLoading }: { data: User[]; isLoading: boolean }) {
  return (
    <DataTableProvider
      columns={COLUMNS}
      data={data}
      isLoading={isLoading}
      getRowId={(row) => String(row.id)}
    >
      <DataTableBar>
        <DataTableBarContent>
          <DataTableSearchInput />
          <DataTableColumnManager />
          <DataTableSortDropdown />
          <DataTableFilterDropdown />
        </DataTableBarContent>
        <DataTableBarAction>
          <Button size="sm">+ Add User</Button>
        </DataTableBarAction>
      </DataTableBar>
      <DataTableFilterBar />
      <DataTableWrapper>
        <DataTable scrollable horizontal height={400}>
          <DataTableHeader>
            <DataTableHeaderRow>
              <DataTableHead column="name" />
              <DataTableHead column="email" />
              <DataTableHead column="status" />
            </DataTableHeaderRow>
          </DataTableHeader>
          <DataTableBody>
            {(row: User) => (
              <DataTableRow key={row.id}>
                <DataTableCell column="name">{row.name}</DataTableCell>
                <DataTableCell column="email">{row.email}</DataTableCell>
                <DataTableCell column="status">
                  <SimpleBadge variant="green">{row.status}</SimpleBadge>
                </DataTableCell>
                <DataTableRowAction onAction={(id) => handleAction(id, row)}>
                  <DataTableEditRowAction />
                  <DataTableDeleteRowAction />
                </DataTableRowAction>
              </DataTableRow>
            )}
          </DataTableBody>
        </DataTable>
        <DataTableLoadingBody />
        <DataTableEmptyBody title="No users yet" />
        <DataTableFoot />
      </DataTableWrapper>
    </DataTableProvider>
  );
}
```

### Service Function Contract — QueryFn\<T\>

The query layer requires fetch functions that match the `QueryFn<T>` signature. Define one service function per query and collect them in a `QueryFunctionMap`. The library does not dictate your HTTP client — use `axios`, `fetch`, or any other.

```ts
// services/invoices.service.ts
import type { QueryFn, QueryFunctionMap, QueryParamValues } from '@/ascendra-ui';
import type { Invoice } from '@/types';
import { http } from '@/lib/http-client'; // your own HTTP client

// Every QueryFn must return { data: T[], totalBatches: number }
// params — confirmed field values from QueryParamPanel (empty {} for 'query' group)
// batch  — current page number (1-indexed); use as your API page param
export const fetchAllInvoices: QueryFn<Invoice> = async (_params, batch) => {
  const res = await http.get('/api/invoices', { params: { page: batch, limit: 20 } });
  return { data: res.data.items, totalBatches: res.data.meta.totalPages };
};

export const fetchInvoicesByStatus: QueryFn<Invoice> = async (params, batch) => {
  const res = await http.get('/api/invoices', {
    params: { statuses: params.statuses, page: batch, limit: 20 },
  });
  return { data: res.data.items, totalBatches: res.data.meta.totalPages };
};

// Keys must match QueryDef ids exactly
export const INVOICE_QUERY_FUNCTIONS: QueryFunctionMap<Invoice> = {
  'all-invoices':  fetchAllInvoices,
  'by-status':     fetchInvoicesByStatus,
};
```

**Cursor-based pagination:** If your API uses cursors and has no page count, return `totalBatches: 1` and handle navigation externally.

**React Query cache key:** The provider uses `['data-table', queryId, confirmedParams, batch]` as the query key — invalidate this key from outside if you need to force a refetch.

### QueryDef — Defining Queries

```ts
// invoices.queries.ts
import type { QueryDef } from '@/ascendra-ui';

export const QUERIES: QueryDef[] = [
  // group: 'query' — runs immediately on selection; no params
  {
    id: 'all-invoices',
    title: 'All Invoices',
    description: 'Returns every invoice without filters',
    group: 'query',
  },

  // group: 'filter' — shows QueryParamPanel before fetching;
  //   user fills fields and clicks 'Run Query'
  {
    id: 'by-status',
    title: 'By Status',
    description: 'Filter invoices by payment status',
    group: 'filter',
    columns: { sm: 1, md: 2 },   // param form grid layout
    params: [
      {
        name: 'statuses',
        label: 'Status',
        type: 'multiselect',
        required: true,
        mandatory: true,           // shows red 'Mandatory' badge
        options: [
          { value: 'Paid',    label: 'Paid'    },
          { value: 'Pending', label: 'Pending' },
          { value: 'Overdue', label: 'Overdue' },
        ],
      },
      // Section break — visual divider in the param form
      { _type: 'section', title: 'Date Range', showTitle: true },
      {
        name: 'issueDateRange',
        label: 'Issue Date Range',
        type: 'daterange',
        optional: true,
        span: 'full',
      },
    ],
    queryOptions: { staleTime: 30_000 },  // React Query cache options
  },
];
```

**Query groups:**

| Group | Behaviour |
|---|---|
| `'query'` | Fetches immediately when selected; no params required |
| `'filter'` | Shows `QueryParamPanel`; fetch starts only after user clicks "Run Query" |
| `'user-query'` | Reserved — managed automatically when a user saves a filter query; never define manually |

**FieldDef `type` values and the input rendered:**

| `type` | Input rendered |
|---|---|
| `'text'` | Text input with optional min/maxLength |
| `'number'` | Numeric input with optional min/max |
| `'select'` | Single-select dropdown |
| `'multiselect'` | Multi-select dropdown with chips |
| `'date'` | Single date picker |
| `'daterange'` | Two-month date range picker |
| `'radio'` | Radio group |
| `'checkbox'` | Single boolean checkbox |

**Span control:** Set `span: 1`, `span: 2`, or `span: 'full'` on any `FieldDef` to control its width in the param form grid.

### Dynamic Field Options — FieldOptionsMap

Override static `options` in a `FieldDef` at runtime. Use when options come from an API or depend on another field's value.

```ts
import type { FieldOptionsMap } from '@/ascendra-ui';

export const FIELD_OPTIONS: FieldOptionsMap = {
  // Static override — e.g. options fetched from your API on page mount
  'by-status': {
    statuses: serverFetchedStatuses, // SelectOption[] loaded from API
  },

  // Reactive resolver — options change based on another field's current value
  'by-client': {
    paymentStatus: (values) => {
      const base = [{ value: 'Paid', label: 'Paid' }, { value: 'Pending', label: 'Pending' }];
      // Narrow options when a specific grade is selected
      if (values.gradeLevel === 'class-12') return base;
      return [...base, { value: 'Overdue', label: 'Overdue' }];
    },
  },
};
```

### Template — Query-Driven DataTable

Full wiring for a server-queried table with selection, bulk actions, and persistence.

```tsx
"use client";
import {
  DataTableWithQueryProvider, DataTable, DataTableBar, DataTableBarContent, DataTableBarAction,
  DataTableBody, DataTableCell, DataTableFoot,
  DataTableCheckboxHead, DataTableCheckboxCell,
  DataTableHead, DataTableHeadAction, DataTableBulkDeleteHeadAction,
  DataTableHeader, DataTableHeaderRow, DataTableHighlight, DataTableRow,
  DataTableRowAction, DataTableEditRowAction, DataTableDeleteRowAction,
  DataTableSearchInput, DataTableColumnManager, DataTableSortDropdown,
  DataTableFilterDropdown, DataTableFilterBar, DataTableWrapper,
  DataTableLoadingBody, DataTableEmptyBody, DataTableErrorBody,
  QueryBar, QueryParamPanel, SimpleBadge, Button, type ColumnDef,
} from '@/ascendra-ui';
import { QUERIES, INVOICE_QUERY_FUNCTIONS, FIELD_OPTIONS } from './invoices.queries';
import { formatAmount } from '@/ascendra-ui/utils/common.util';

const COLUMNS: ColumnDef<Invoice>[] = [
  { key: 'invoiceNumber', label: 'Invoice #', freeze: true },
  { key: 'clientName',    label: 'Client',    freeze: true, filter: true },
  { key: 'amount',        label: 'Amount',    type: 'number' },
  { key: 'status',        label: 'Status',    sortable: false, filter: true },
];

export default function InvoicesPage() {
  return (
    <DataTableWithQueryProvider
      queries={QUERIES}
      queryFunctions={INVOICE_QUERY_FUNCTIONS}
      fieldOptions={FIELD_OPTIONS}
      columns={COLUMNS}
      getRowId={(row) => String(row.id)}
      tableId="invoices-table"  // persists active query + params to localStorage
    >
      {/* QueryBar — query picker dropdown */}
      <QueryBar />
      {/* QueryParamPanel — param form for 'filter' group queries; auto-hides after submit */}
      <QueryParamPanel />
      <DataTableBar>
        <DataTableBarContent>
          <DataTableSearchInput />
          <DataTableColumnManager />
          <DataTableSortDropdown />
          <DataTableFilterDropdown />
        </DataTableBarContent>
        <DataTableBarAction>
          <Button size="sm">+ New Invoice</Button>
        </DataTableBarAction>
      </DataTableBar>
      <DataTableFilterBar />
      {/* DataTableWrapper hides table while QueryParamPanel is open */}
      <DataTableWrapper>
        <DataTable scrollable horizontal height={500}>
          <DataTableHeader>
            <DataTableHeaderRow>
              <DataTableCheckboxHead />
              <DataTableHead column="invoiceNumber" />
              <DataTableHead column="clientName" />
              <DataTableHead column="amount" />
              <DataTableHead column="status" />
              <DataTableHeadAction
                onAction={(id, selectedRowIds) => {
                  if (id === 'bulk-delete') deleteInvoices(selectedRowIds);
                }}
              >
                <DataTableBulkDeleteHeadAction />
              </DataTableHeadAction>
            </DataTableHeaderRow>
          </DataTableHeader>
          <DataTableBody>
            {(row: Invoice) => (
              <DataTableRow key={row.id}>
                <DataTableCheckboxCell rowId={String(row.id)} />
                <DataTableCell column="invoiceNumber">
                  <DataTableHighlight text={row.invoiceNumber} item={row} itemKey="invoiceNumber" />
                </DataTableCell>
                <DataTableCell column="clientName">
                  <DataTableHighlight text={row.clientName} item={row} itemKey="clientName" />
                </DataTableCell>
                <DataTableCell column="amount">
                  <DataTableHighlight text={formatAmount(row.amount)} item={row} itemKey="amount" />
                </DataTableCell>
                <DataTableCell column="status">
                  <SimpleBadge variant="green">{row.status}</SimpleBadge>
                </DataTableCell>
                <DataTableRowAction onAction={(id) => handleRowAction(id, row)}>
                  <DataTableEditRowAction />
                  <DataTableDeleteRowAction />
                </DataTableRowAction>
              </DataTableRow>
            )}
          </DataTableBody>
        </DataTable>
        <DataTableLoadingBody />
        <DataTableErrorBody />
        <DataTableEmptyBody />
        <DataTableFoot />
      </DataTableWrapper>
    </DataTableWithQueryProvider>
  );
}
```

### tableId — Persistence

Pass `tableId` (a stable unique string per table, e.g. `"invoices-table"`) to persist the user's last active query and confirmed params to `localStorage`. On the next page visit the last-run query is restored automatically. Omit `tableId` to disable persistence.

### Key Gotchas

| Gotcha | What to do instead |
|---|---|
| Wrapping `DataTableCell` in a fragment, `React.memo`, or custom component | Pass cells as **direct children** of `DataTableRow` — wrapping hides the `column` prop and the cell is silently dropped |
| Adding `DataTableCheckboxCell` without `getRowId` | Always pass `getRowId` to the provider when using checkbox components — without it they render nothing |
| Rendering the raw `data` prop in a custom body | Use `pagedData` from `useDataTableData()` — `data` bypasses search / filter / sort / pagination |
| Placing `DataTableFoot` or `DataTableErrorBody` outside `DataTableWrapper` | All state-display siblings (`LoadingBody`, `ErrorBody`, `EmptyBody`, `Foot`) must be **inside** `DataTableWrapper` |
| Defining `group: 'user-query'` in your `QueryDef` array | `'user-query'` is reserved; the system manages these automatically when users save filter queries |
| Passing a transformed/copied row to `DataTableHighlight item={}` | Pass the **original row object** — fuzzy match ranges are keyed by object reference in a WeakMap |

---

## Composite Patterns

> Composite patterns are full-page or full-panel implementations that combine multiple
> primitives into a realistic domain scenario. Study these to understand how components
> are assembled together in production-quality code.

### Forms

10 form patterns covering: General / Marketing, SaaS / Product, IT / SaaS, Healthcare / Services, HR / Recruitment, Finance / Banking, E-Commerce, Project Management, Universal Utility, HR / Enterprise.

#### Form Component Palette

The following primitives appear across all form patterns: Input, Select, Field, Button, UnsavedChangesBar, Switch, Combobox, FieldGroup, RadioGroup, Checkbox, SimpleAlert, DatePicker, SimpleBadge, InputGroup, DateRangePicker, TableLookup.

#### Form Complexity Guide

| Complexity | Characteristics | Examples |
|---|---|---|
| Simple | Single section, vertical layout, ≤ 6 fields | Contact & Inquiry, Search & Filter Panel |
| Medium | 2–3 sections or conditional logic, 7–15 fields | User Profile Settings, Support Ticket, Appointment Booking, Job Application, Financial Transaction |
| Complex | Multi-section, multi-step, ≥ 15 fields, file uploads, rich text | Create Product Listing, Project Kickoff, Employee Onboarding Stepper |

#### All Form Patterns

| Name | Route | Domain | Complexity | Layout | Edit Mode |
|---|---|---|---|---|---|
| **Contact & Inquiry** | [`/showcase/forms/contact-inquiry`](/showcase/forms/contact-inquiry) | General / Marketing | Simple | Single column, vertical | No |
| **User Profile Settings** | [`/showcase/forms/user-profile`](/showcase/forms/user-profile) | SaaS / Product | Medium | 2 sections, mixed vertical & horizontal fields | Yes |
| **Support Ticket** | [`/showcase/forms/support-ticket`](/showcase/forms/support-ticket) | IT / SaaS | Medium | Single column with conditional section reveal | No |
| **Appointment Booking** | [`/showcase/forms/appointment-booking`](/showcase/forms/appointment-booking) | Healthcare / Services | Medium | 3 sections, step-like visual flow | No |
| **Job Application** | [`/showcase/forms/job-application`](/showcase/forms/job-application) | HR / Recruitment | Medium | 3 sections, single column with 2-column grid rows | No |
| **Financial Transaction** | [`/showcase/forms/financial-transaction`](/showcase/forms/financial-transaction) | Finance / Banking | Medium | 2 sections, horizontal-label compact layout | No |
| **Create Product Listing** | [`/showcase/forms/create-product`](/showcase/forms/create-product) | E-Commerce | Complex | 3 sections, mixed 1-column and 2-column grid | Yes |
| **Project Kickoff** | [`/showcase/forms/project-kickoff`](/showcase/forms/project-kickoff) | Project Management | Complex | 3 sections, mixed 1-column and 2-column grids | No |
| **Search & Filter Panel** | [`/showcase/forms/search-filter`](/showcase/forms/search-filter) | Universal Utility | Simple | Compact sidebar panel, single column | No |
| **Employee Onboarding Stepper** | [`/showcase/forms/employee-onboarding`](/showcase/forms/employee-onboarding) | HR / Enterprise | Complex | 4-step stepper with step indicator and per-step sections | No |

---

### Dialogs

12 dialog patterns. All rendered on a single gallery page at `/showcase/dialogs`.

#### When to Use Dialog vs Sheet vs Drawer

- **Dialog** — short confirmations (≤ 4 fields), destructive actions, feature announcements
- **Sheet** — side panels for record detail, longer forms (≥ 5 fields), settings
- **Drawer** — bottom-up panels for mobile-first flows, action menus, quick inputs

#### Dialog Type Definitions

| Type | Intent | Typical buttons |
|---|---|---|
| Confirmation | Ask user to confirm a safe action | Cancel + Confirm |
| Destructive | Confirm an irreversible action | Cancel + Delete/Remove (red) |
| Input | Collect a small amount of data | Cancel + Save |
| Alert | Display important information | OK / Dismiss |
| Feature | Announce or explain a feature | Close or CTA |

#### All Dialog Patterns

| Name | Type | Components |
|---|---|---|
| **Archive Project** | Confirmation | Dialog, Button |
| **Transfer Ownership** | Confirmation | Dialog, Checkbox, Button |
| **Delete Record** | Destructive | Dialog, Button |
| **Delete Account** | Destructive | Dialog, Input, Field, Button |
| **Rename Item** | Input | Dialog, Input, Field, Button |
| **Add Note** | Input | Dialog, InputGroup, Field, Button |
| **Invite Member** | Input | Dialog, Input, Select, Field, Button |
| **Change Password** | Input | Dialog, Input, Field, Button |
| **Session Expired** | Alert | Dialog, Button |
| **Payment Failed** | Alert | Dialog, SimpleAlert, Button |
| **Feature Announcement** | Feature | Dialog, Button |
| **Upgrade Required** | Feature | Dialog, Checkbox, Button |

---

### Sheets

10 slide-out panel patterns for detail, preview, activity, and settings flows.
All rendered on a single gallery page at `/showcase/sheets`.

#### Sheet Type Definitions

| Type | Intent | Typical content |
|---|---|---|
| Detail | Full record detail view | Read-only fields, sections, related items |
| Preview | Quick-look without leaving context | Compact summary, key metrics |
| Activity | Timeline or audit log | Chronological events list |
| Settings | Configuration panel | Form fields, switches, selects |

#### All Sheet Patterns

| Name | Type | Domain | Components |
|---|---|---|---|
| **Employee Profile** | Detail | HR | Sheet, SimpleBadge, NameAvatar, Switch, Item |
| **Order Details** | Detail | E-commerce | Sheet, Item, SimpleBadge, Button |
| **Support Ticket** | Activity | SaaS | Sheet, Item, NameAvatar, StatusDot, SimpleBadge, Button |
| **Notification Preferences** | Settings | SaaS | Sheet, Switch, Button |
| **Customer Profile** | Preview | CRM | Sheet, NameAvatar, SimpleBadge, StatusDot, Item, Button |
| **Invoice Preview** | Preview | Finance | Sheet, Item, SimpleBadge, SimpleAlert, Button |
| **Project Overview** | Detail | Project Management | Sheet, NameAvatar, SimpleBadge, StatusDot, Item, Button |
| **Audit Log Entry** | Detail | System / Admin | Sheet, SimpleBadge, SimpleAlert, Button |
| **Product Details** | Preview | Catalog | Sheet, SimpleBadge, StatusDot, Button |
| **Account Settings** | Settings | Platform | Sheet, Switch, SimpleBadge, Button |

---

### Drawers

8 bottom-drawer patterns for mobile-first flows.
All rendered on a single gallery page at `/showcase/drawers`.

#### Drawer Type Definitions

| Type | Intent |
|---|---|
| Action | Quick action menu; list of actionable options |
| Panel | Richer content panel that slides up from bottom |
| Preview | Compact record preview for mobile |
| Input | Short form or data entry on mobile |

#### All Drawer Patterns

| Name | Type | Domain | Components |
|---|---|---|---|
| **Quick Actions** | Action | General | Drawer, Item, Button |
| **Smart Filter** | Panel | E-commerce | Drawer, Switch, Item, SimpleBadge, Button |
| **Share Sheet** | Action | General | Drawer, Button |
| **Event Preview** | Preview | Calendar | Drawer, NameAvatar, StatusDot, Button |
| **Media Attachment** | Preview | File Management | Drawer, Button |
| **Assign Task** | Input | Project Management | Drawer, Input, NameAvatar, Item, Button |
| **Notification Center** | Panel | SaaS | Drawer, BubbleBadge, StatusDot, Button |
| **Danger Zone** | Action | Settings | Drawer, Input, SimpleAlert, Button |

---

### Dashboards

10 full analytics dashboard pages. Each has KPI tiles, multiple chart types, and a data table.
Domains covered: SaaS / Startup, Retail / E-commerce, Marketing / Growth, Finance / CFO, Finance / Trading, Healthcare / Clinical, People Operations, Engineering / SRE, Operations / Logistics, Property Investment.

#### Chart Type Frequency

The most commonly used chart types across all dashboards:

- **bar** — used in 9 dashboards
- **composed** — used in 7 dashboards
- **pie** — used in 4 dashboards
- **area** — used in 4 dashboards
- **radial** — used in 4 dashboards
- **line** — used in 4 dashboards

#### Dashboard Layout Pattern

Every dashboard page follows a consistent structure:

```
PageHeader (title + date range badge)
PageMain > PageWrapper > PageContent
  Row 1: KPI tiles (grid of 4 — col-span-3 each on 12-col grid)
  Row 2+: Charts + Tables (mixed col-span via 12-column grid)
  Final row: Full-width Table (col-span-12)
```

KPI tiles always use `Card > CardPanel > CardPanelItem` with a metric value, label, and change indicator.

#### All Dashboard Patterns

| Name | Route | Domain | KPIs | Chart types |
|---|---|---|---|---|
| **SaaS Revenue & Growth** | [`/showcase/dashboards/saas-revenue`](/showcase/dashboards/saas-revenue) | SaaS / Startup | Monthly Recurring Revenue, Annual Run Rate, Churn Rate, Net Revenue Retention | composed, pie, area, radial, bar |
| **E-commerce Operations** | [`/showcase/dashboards/ecommerce-ops`](/showcase/dashboards/ecommerce-ops) | Retail / E-commerce | Gross Merchandise Value, Orders Placed, Avg. Order Value, Return Rate | line, bar, treemap, histogram |
| **Marketing Performance** | [`/showcase/dashboards/marketing`](/showcase/dashboards/marketing) | Marketing / Growth | Attributed Revenue, Blended ROAS, Customer Acq. Cost, Avg. CTR | bar, radar, area, pie, composed |
| **Financial P&L** | [`/showcase/dashboards/financial-pnl`](/showcase/dashboards/financial-pnl) | Finance / CFO | Total Revenue, EBITDA, Monthly Burn Rate, Cash Runway | composed, radial, area, bar |
| **Trading & Portfolio** | [`/showcase/dashboards/trading-portfolio`](/showcase/dashboards/trading-portfolio) | Finance / Trading | Portfolio Value, Day P&L, Beta, Sharpe Ratio | candlestick, histogram, scatter, composed |
| **Healthcare Analytics** | [`/showcase/dashboards/healthcare`](/showcase/dashboards/healthcare) | Healthcare / Clinical | Active Patients, Avg. Wait Time, Bed Occupancy, Recovery Rate | line, radial, bar, radar, histogram |
| **HR & People Analytics** | [`/showcase/dashboards/hr-people`](/showcase/dashboards/hr-people) | People Operations | Total Headcount, Attrition Rate, Avg. Time to Hire, eNPS Score | line, pie, bar, scatter |
| **DevOps Monitoring** | [`/showcase/dashboards/devops`](/showcase/dashboards/devops) | Engineering / SRE | Uptime (30d), P99 Latency, Error Rate, Deploy Frequency | area, line, bar, composed, radial |
| **Supply Chain** | [`/showcase/dashboards/supply-chain`](/showcase/dashboards/supply-chain) | Operations / Logistics | On-time Delivery, Inventory Fill Rate, Inventory Turns, Avg. Lead Time | composed, bar, treemap, radar |
| **Real Estate Portfolio** | [`/showcase/dashboards/real-estate`](/showcase/dashboards/real-estate) | Property Investment | Portfolio Value, Avg. Gross Yield, Occupancy Rate, Monthly Income | treemap, pie, composed, bar, scatter |

#### Dashboard Layout Breakdowns

##### SaaS Revenue & Growth

Monthly recurring revenue, plan-tier breakdown, churn, and net revenue retention — the core metrics for a SaaS growth review.

- **Domain:** SaaS / Startup
- **KPIs:** Monthly Recurring Revenue, Annual Run Rate, Churn Rate, Net Revenue Retention
- **Chart types:** composed, pie, area, radial, bar

**Layout** (12-column grid)

- Row 1: `chart[8]` MRR & Growth Rate  ·  `chart[4]` Plan Mix
- Row 2: `chart[8]` Revenue by Tier  ·  `chart[4]` NRR Gauge
- Row 3: `table[7]` Top Accounts  ·  `chart[5]` Churn by Cohort

##### E-commerce Operations

Order volume, GMV, category performance, and return rates — the ops view for a mid-size online retailer.

- **Domain:** Retail / E-commerce
- **KPIs:** Gross Merchandise Value, Orders Placed, Avg. Order Value, Return Rate
- **Chart types:** line, bar, treemap, histogram

**Layout** (12-column grid)

- Row 1: `chart[12]` Daily Orders
- Row 2: `chart[6]` Orders by Category  ·  `chart[6]` GMV by Category
- Row 3: `chart[5]` Order Value Distribution  ·  `table[7]` Top Products

##### Marketing Performance

Channel ROAS, traffic mix, and spend efficiency — the CMO view for a performance-marketing team running multi-channel campaigns.

- **Domain:** Marketing / Growth
- **KPIs:** Attributed Revenue, Blended ROAS, Customer Acq. Cost, Avg. CTR
- **Chart types:** bar, radar, area, pie, composed

**Layout** (12-column grid)

- Row 1: `chart[5]` Channel ROAS  ·  `chart[7]` Channel Scorecard
- Row 2: `chart[8]` Traffic by Source  ·  `chart[4]` Spend Allocation
- Row 3: `chart[8]` Spend vs Revenue  ·  `chart[4]` Status Summary
- Row 4: `table[12]` Active Campaigns

##### Financial P&L

Revenue, cost breakdown, EBITDA margin trajectory, and budget attainment — the board-ready financial view for a growth-stage company.

- **Domain:** Finance / CFO
- **KPIs:** Total Revenue, EBITDA, Monthly Burn Rate, Cash Runway
- **Chart types:** composed, radial, area, bar

**Layout** (12-column grid)

- Row 1: `chart[7]` Costs & EBITDA Margin  ·  `chart[5]` Budget Attainment
- Row 2: `chart[12]` Revenue vs Expenses
- Row 3: `chart[6]` Cash Flow Waterfall  ·  `table[6]` P&L Summary

##### Trading & Portfolio

Price action, volume, return distribution, and risk/return positioning — a complete view for an equity portfolio manager.

- **Domain:** Finance / Trading
- **KPIs:** Portfolio Value, Day P&L, Beta, Sharpe Ratio
- **Chart types:** candlestick, histogram, scatter, composed

**Layout** (12-column grid)

- Row 1: `chart[12]` Price Action _(xl)_
- Row 2: `chart[4]` Return Distribution  ·  `chart[4]` Risk vs Return  ·  `chart[4]` Price + Volume
- Row 3: `table[12]` Positions

##### Healthcare Analytics

Patient flow, bed occupancy, department performance, and outcome rates — the clinical director's operational view of a hospital.

- **Domain:** Healthcare / Clinical
- **KPIs:** Active Patients, Avg. Wait Time, Bed Occupancy, Recovery Rate
- **Chart types:** line, radial, bar, radar, histogram

**Layout** (12-column grid)

- Row 1: `chart[8]` Admissions Trend  ·  `chart[4]` Bed Occupancy
- Row 2: `chart[6]` Conditions by Department  ·  `chart[6]` Department Scorecard
- Row 3: `chart[5]` Patient Age Distribution  ·  `table[7]` Recent Cases

##### HR & People Analytics

Headcount movement, attrition drivers, salary distribution, and performance spread — the CHRO's workforce view.

- **Domain:** People Operations
- **KPIs:** Total Headcount, Attrition Rate, Avg. Time to Hire, eNPS Score
- **Chart types:** line, pie, bar, scatter

**Layout** (12-column grid)

- Row 1: `chart[7]` Hiring vs Attrition  ·  `chart[5]` Seniority Mix
- Row 2: `chart[12]` Headcount by Department
- Row 3: `chart[6]` Tenure vs Performance  ·  `table[6]` Recent Hires

##### DevOps Monitoring

Latency, throughput, error rates by service, and deployment frequency — the reliability dashboard for an engineering team.

- **Domain:** Engineering / SRE
- **KPIs:** Uptime (30d), P99 Latency, Error Rate, Deploy Frequency
- **Chart types:** area, line, bar, composed, radial

**Layout** (12-column grid)

- Row 1: `chart[12]` Request Volume
- Row 2: `chart[6]` P99 Latency  ·  `chart[6]` Errors by Service
- Row 3: `chart[8]` Error Rate & Throughput  ·  `chart[4]` SLA Uptime

##### Supply Chain

Inventory flow, supplier concentration, regional shipments, and delivery performance — the operations director's supply view.

- **Domain:** Operations / Logistics
- **KPIs:** On-time Delivery, Inventory Fill Rate, Inventory Turns, Avg. Lead Time
- **Chart types:** composed, bar, treemap, radar

**Layout** (12-column grid)

- Row 1: `chart[7]` Inventory Flow  ·  `chart[5]` Shipments by Region
- Row 2: `chart[12]` Supplier Spend Share
- Row 3: `chart[5]` Supplier Scorecard  ·  `table[7]` Open Orders

##### Real Estate Portfolio

Portfolio valuation, yield analysis, occupancy, and individual property performance — the asset manager's property view.

- **Domain:** Property Investment
- **KPIs:** Portfolio Value, Avg. Gross Yield, Occupancy Rate, Monthly Income
- **Chart types:** treemap, pie, composed, bar, scatter

**Layout** (12-column grid)

- Row 1: `chart[7]` Portfolio by Type  ·  `chart[5]` Geographic Allocation
- Row 2: `chart[8]` Rental Income & Yield  ·  `chart[4]` Properties by Value
- Row 3: `chart[5]` Price vs Area  ·  `table[7]` Properties

---

### Reports

10 document-style report pages.
Domains covered: Finance / Accounting, Corporate / C-Suite, Healthcare / Clinical, Project Management, Sales / CRM, Marketing / Growth, Operations / Logistics, Human Resources, IT / Security, Corporate / ESG.

#### Report vs Dashboard

| Dimension | Dashboard | Report |
|---|---|---|
| Purpose | Live operational monitoring | Periodic review, export-ready summary |
| Layout | Wide grid, dense data | Document-style, print-friendly |
| Charts | Multiple interactive charts | Supporting charts only |
| Tables | Scrollable DataTable | Simple Table with summary rows |
| Audience | Operations team | Executives, auditors, HR |

#### Report Type Definitions

| Type | Focus |
|---|---|
| Executive | High-level KPIs for leadership |
| Financial | Revenue, P&L, cost analysis |
| Operational | Process efficiency, throughput |
| Performance | Individual or team metrics |
| Clinical | Healthcare outcomes, patient data |
| Compliance | Audit trails, regulatory adherence |

#### All Report Patterns

| Name | Route | Domain | Type | Complexity |
|---|---|---|---|---|
| **Annual Financial Statement** | [`/showcase/reports/annual-financial-statement`](/showcase/reports/annual-financial-statement) | Finance / Accounting | Financial | Complex |
| **Executive Business Review** | [`/showcase/reports/executive-business-review`](/showcase/reports/executive-business-review) | Corporate / C-Suite | Executive | Simple |
| **Patient Health Summary** | [`/showcase/reports/patient-health-summary`](/showcase/reports/patient-health-summary) | Healthcare / Clinical | Clinical | Medium |
| **Project Status Report** | [`/showcase/reports/project-status-report`](/showcase/reports/project-status-report) | Project Management | Operational | Simple |
| **Sales Pipeline Report** | [`/showcase/reports/sales-pipeline-report`](/showcase/reports/sales-pipeline-report) | Sales / CRM | Performance | Medium |
| **Marketing Campaign Analysis** | [`/showcase/reports/marketing-campaign-analysis`](/showcase/reports/marketing-campaign-analysis) | Marketing / Growth | Performance | Medium |
| **Supply Chain Operations Report** | [`/showcase/reports/supply-chain-ops-report`](/showcase/reports/supply-chain-ops-report) | Operations / Logistics | Operational | Complex |
| **Employee Performance Review** | [`/showcase/reports/employee-performance-review`](/showcase/reports/employee-performance-review) | Human Resources | Performance | Simple |
| **Cybersecurity Incident Report** | [`/showcase/reports/security-incident-report`](/showcase/reports/security-incident-report) | IT / Security | Compliance | Medium |
| **ESG Sustainability Report** | [`/showcase/reports/esg-sustainability-report`](/showcase/reports/esg-sustainability-report) | Corporate / ESG | Compliance | Complex |

---

## Showcase Gallery Entry Points

The showcase has 111 pages total. These are the primary gallery landing pages. Primitive component pages follow the pattern `/showcase/{category}/{slug}` — see `docs/ui-reference.md` for individual component showcase links.

| Section | Route |
|---|---|
| Sample Forms | [`/showcase/forms`](/showcase/forms) |
| Sample Dialogs | [`/showcase/dialogs`](/showcase/dialogs) |
| Sample Sheets | [`/showcase/sheets`](/showcase/sheets) |
| Sample Drawers | [`/showcase/drawers`](/showcase/drawers) |
| Sample Dashboards | [`/showcase/dashboards`](/showcase/dashboards) |
| Sample Reports | [`/showcase/reports`](/showcase/reports) |
| Charts gallery | [`/showcase/charts`](/showcase/charts) |
| Layout guide | [`/showcase/layout-guide`](/showcase/layout-guide) |
| Data Table lab | [`/showcase/data-table-lab`](/showcase/data-table-lab) |

---

## Page Building Rules

### Core Rules

Always follow these rules when building pages with Ascendra UI:

- Use the standard page shell: `PageHeader` + `PageMain` + `PageWrapper` + `PageContent` + `MainContent`
- Always wrap inputs in `Field > FieldLabel + FieldContent > [control] + FieldError`
- Always use `Card > CardPanel > CardPanelItem` for settings sections
- Use `SimpleBadge` for status labels — not custom `<span>` elements with color classes
- Use `UnsavedChangesBar` for any form that can be saved (`isDirty`, `onSave`, `onReset`)
- Import all components from `@/ascendra-ui` — see **Import Paths** below for the shadcn exceptions
- Use the code templates in **Structural Code Templates** as the starting point for each page type
- Always check `docs/ui-reference.md` for an existing component before building custom UI. If a needed pattern is missing, implement it minimally and add `{/* TODO: ascendra-ui candidate — [ComponentName] — [why it's reusable] */}` above the custom code

### Design System Gap Flagging

When the library lacks a needed pattern, implement it minimally with Tailwind and mark it so the team can incorporate it into `@/ascendra-ui`:

```tsx
{/* TODO: ascendra-ui candidate — StatusTimeline — sequence of status change events with icons; reusable across all record detail sheets */}
<div className="flex flex-col gap-3">
  {events.map((e) => (
    <div key={e.id} className="flex items-start gap-3 text-sm">
      <span className="mt-0.5 size-2 shrink-0 rounded-full bg-current" />
      <div>
        <p className="font-medium">{e.label}</p>
        <p className="text-muted-foreground">{e.date}</p>
      </div>
    </div>
  ))}
</div>
```

Comment format: `TODO: ascendra-ui candidate — [ComponentName] — [reason it is reusable across pages]`

Run `grep -r "ascendra-ui candidate" .` to collect all flagged gaps at any time.

### Common Mistakes to Avoid

| Wrong | Correct |
|---|---|
| Raw `<label>` + `<input>` | `Field > FieldLabel + Input` |
| `bg-red-500` for error color | `text-negative` / `bg-destructive` |
| Custom div for card | `Card > CardPanel > CardPanelItem` |
| `alert()` for confirmations | `Dialog` with Cancel + Confirm |
| Large form in Dialog | Move to `Sheet` (side panel) |
| Mobile menu in Dialog | Use `Drawer` (bottom sheet) |
| DataTable inside dashboard | Use `Table` system (simpler, no built-in state) |
| Inline toast for form errors | Use `FieldError` + `SimpleAlert` inside the form |
| Hardcoded dark mode colors | Use semantic tokens (`--foreground`, `--muted-foreground`) |

### Page Templates by Domain

Use the code templates in the **Structural Code Templates** section of this document as the starting point for each page type:

| Page type | Template to use |
|---|---|
| Settings / account page | Template 2 — Settings / Form Page |
| Multi-step onboarding | Template 2 with `Stepper` + per-step `CardPanelItem` blocks |
| Analytics overview / dashboard | Template 3 — Dashboard Page |
| Document report / PDF export | Template 4 — Report Page |
| Confirm or soft-delete action | Template 5 — Dialog (Confirmation variant) |
| Collect ≤ 4 fields in an overlay | Template 5 — Dialog (Input variant) |
| Irreversible delete with typed confirmation | Template 5 — Dialog (Destructive variant) |
| Record detail panel / preview slide-out | Template 6 — Sheet Pattern |
| Mobile bottom-sheet action menu | Template 7 — Drawer Pattern |
| Section-switched settings (General / Notifications / etc.) | Template 8 — Tabs Page |

### Component Naming Conventions

- Components named `Page*` belong to the page shell (`PageHeader`, `PageMain`, `PageWrapper`, `PageContent`, `PageTitle`, `PageSubtitle`)
- Components named `SideBar*` belong to the sidebar system
- Components named `Card*` belong to the settings card system — not generic cards
- Components named `Field*` belong to the form field wrapper system
- Components named `DataTable*` belong to the advanced table with built-in state
- Components named `Table*` belong to the simple table without built-in state
- Compound component families share a prefix: `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, etc.

### Tech Stack Assumptions

All code templates in this document assume the following stack. If your project differs, adapt accordingly.

| Dependency | Why it's assumed |
|---|---|
| **Next.js App Router** | `"use client"` directive, `<Link>` routing, and `PageHeader`/`PageMain` shell conventions are App Router patterns |
| **TypeScript** | All templates use TypeScript — `z.infer<>`, `type ChartConfig`, typed form values, component prop types |
| **react-hook-form** | Form templates use `useForm`, `Controller`, `register`, `formState` from `react-hook-form` |
| **zod + @hookform/resolvers/zod** | Schema validation in form templates uses `z.object()` + `zodResolver` |
| **react-icons/lu** | All icon usage in templates uses Lucide React icons via `react-icons/lu` (`LuTrendingUp`, `LuSearch`, etc.) |
| **Recharts** | All chart primitives (`AreaChart`, `BarChart`, `CartesianGrid`, etc.) come from `recharts` |
| **@tanstack/react-query** | `DataTableQueryProvider` uses `useQuery` internally — wrap your app root in `QueryClientProvider` |

### Import Paths

```tsx
// All ascendra-ui components (buttons, inputs, cards, tables, charts legends, sheets, etc.)
import { Button, Input, Field, Card, ChartLegend, ChartLegendGroup, ... } from '@/ascendra-ui'

// These three groups come from the shadcn layer — NOT from @/ascendra-ui:
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/ascendra-ui/shadcn'
import { Drawer, DrawerTrigger, DrawerClose, DrawerContent, DrawerFooter } from '@/ascendra-ui/shadcn'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/ascendra-ui/shadcn'

// Chart primitives from recharts
import { AreaChart, Area, BarChart, Bar, CartesianGrid, XAxis, YAxis, Line } from 'recharts'

// Form state
import { useForm, Controller } from 'react-hook-form'

// Icons
import { LuTrendingUp, LuSearch, LuPlus } from 'react-icons/lu'
```

Never import from sub-paths like `@/ascendra-ui/components/button` — always use the barrel exports.

---

## Versioning

This reference was generated for **ascendra-ui v1.4.0**.
Commit: `2fb5614182f4bb11b93695abfe1b99a06a0fada0`

Run `npm run docs:generate` to regenerate after any change.
Run `npm run release` to cut a new version.
