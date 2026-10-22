import { LuCalendarClock } from 'react-icons/lu';
import type { ModuleNavEntry } from '../shared/nav';
import { backgroundJobsLinks } from './links';

export const backgroundJobsNav: ModuleNavEntry[] = [
  {
    id: 'background-jobs',
    label: 'Background Jobs',
    href: backgroundJobsLinks.overview(),
    icon: LuCalendarClock,
    requiredAction: 'job.view',
  },
];
