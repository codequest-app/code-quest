import {
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  PlayIcon,
  QuestionMarkCircleIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import type { FC, SVGProps } from 'react';

type IconComponent = FC<SVGProps<SVGSVGElement>>;

const MESSAGE_TYPE_ICONS: Record<string, IconComponent> = {
  task_started: PlayIcon,
  streamlined_tool_use_summary: PlayIcon,
  hook_started: WrenchScrewdriverIcon,
  hook_response: LinkIcon,
  hook_diagnostics: ExclamationTriangleIcon,
  interrupt: ExclamationTriangleIcon,
  rate_limit_event: ExclamationTriangleIcon,
  unknown_delta: QuestionMarkCircleIcon,
  raw_event: ArchiveBoxIcon,
};

export function renderIcon(type: string, className = 'w-4 h-4 shrink-0'): React.ReactNode {
  const Icon = MESSAGE_TYPE_ICONS[type];
  if (!Icon) return null;
  return <Icon className={className} />;
}
