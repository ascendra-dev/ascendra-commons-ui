import { LuBan, LuBrush, LuDatabase, LuFiles, LuGauge, LuHardDrive, LuLayers } from 'react-icons/lu';
import type { ModuleNavEntry } from '../shared/nav';
import { fileStorageLinks } from './links';

/** The file console's own sidebar — every entry needs `file.view`. */
export const fileStorageNav: ModuleNavEntry[] = [
  { id: 'files-overview', label: 'Overview', href: fileStorageLinks.overview(), icon: LuGauge, requiredAction: 'file.view' },
  { id: 'files-list', label: 'Files', href: fileStorageLinks.files(), icon: LuFiles, requiredAction: 'file.view' },
  { id: 'files-types', label: 'Upload types', href: fileStorageLinks.types(), icon: LuLayers, requiredAction: 'file.view' },
  { id: 'files-rejections', label: 'Refused uploads', href: fileStorageLinks.rejections(), icon: LuBan, requiredAction: 'file.view' },
  { id: 'files-storage', label: 'Storage & limits', href: fileStorageLinks.storage(), icon: LuHardDrive, requiredAction: 'file.view' },
  { id: 'files-cleanup', label: 'Cleanup', href: fileStorageLinks.cleanup(), icon: LuBrush, requiredAction: 'file.view' },
  { id: 'files-retention', label: 'Volume & retention', href: fileStorageLinks.retention(), icon: LuDatabase, requiredAction: 'file.view' },
];
