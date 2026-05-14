import {
  CommandLineIcon,
  CpuChipIcon,
  DocumentMagnifyingGlassIcon,
  DocumentPlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  ServerIcon,
  WrenchIcon,
} from '@heroicons/react/24/outline';
import { isMcpTool } from '@/utils/tool-utils';

const TOOL_ICON_CLASS = 'w-4 h-4 shrink-0';

export function getToolIcon(toolName: string): React.ReactNode {
  if (toolName === 'Bash') return <CommandLineIcon className={TOOL_ICON_CLASS} />;
  if (toolName === 'Read') return <DocumentMagnifyingGlassIcon className={TOOL_ICON_CLASS} />;
  if (toolName === 'Write') return <DocumentPlusIcon className={TOOL_ICON_CLASS} />;
  if (toolName === 'Edit' || toolName === 'MultiEdit')
    return <PencilSquareIcon className={TOOL_ICON_CLASS} />;
  if (toolName === 'WebSearch') return <MagnifyingGlassIcon className={TOOL_ICON_CLASS} />;
  if (toolName === 'Agent' || toolName === 'Task')
    return <CpuChipIcon className={TOOL_ICON_CLASS} />;
  if (isMcpTool(toolName)) return <ServerIcon className={TOOL_ICON_CLASS} />;
  return <WrenchIcon className={TOOL_ICON_CLASS} />;
}

export function ToolUseHeader({
  icon,
  name,
  detail,
  range,
  badge,
}: {
  icon: React.ReactNode;
  name: string;
  detail?: string;
  range?: string;
  badge?: React.ReactNode;
}): React.JSX.Element {
  return (
    <>
      <span className="inline-flex items-center">{icon}</span>
      <span className="font-semibold text-text-bright">{name}</span>
      {detail && <span className="opacity-70 truncate max-w-72">{detail}</span>}
      {range && <span className="opacity-50 text-xs">{range}</span>}
      {badge}
    </>
  );
}
