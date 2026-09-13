import { auditLoggingNav } from "@/ascendra-commons-ui/audit-logging.ui/nav";
import type { ModuleNavEntry } from "@/ascendra-commons-ui/shared/nav";

/** Every shipped module mounted in this testbed, aggregated for DashboardShell's nav. */
export const moduleNavEntries: ModuleNavEntry[] = [...auditLoggingNav];
