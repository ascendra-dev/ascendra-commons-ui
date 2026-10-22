import { LuRadioTower } from 'react-icons/lu';
import type { ModuleNavEntry } from '../shared/nav';
import { domainEventsLinks } from './links';

export const domainEventsNav: ModuleNavEntry[] = [
  {
    id: 'domain-events',
    label: 'Domain Events',
    href: domainEventsLinks.overview(),
    icon: LuRadioTower,
    requiredAction: 'domain-events.view',
  },
];
